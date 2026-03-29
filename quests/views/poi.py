"""POI-эндпойнты: карты, QR и прокси к Overpass."""
import base64
import json
import uuid
from io import BytesIO

import qrcode
import urllib.request
from django.http import HttpResponse, JsonResponse
from django.conf import settings
from rest_framework import viewsets
from rest_framework.decorators import action, api_view
from rest_framework.response import Response

from ..models import PointOfInterest, POIQRCode
from ..serializers import PointOfInterestSerializer
from ..utils.geo import haversine_meters


class PointOfInterestViewSet(viewsets.ModelViewSet):
    queryset = PointOfInterest.objects.all()
    serializer_class = PointOfInterestSerializer

    # Генерация QR-кода для POI.
    @action(detail=True, methods=['post'])
    def generate_qr(self, request, pk=None):
        poi = self.get_object()
        code = f"{poi.id.hex[:8]}{uuid.uuid4().hex[:6]}"
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        qr_url = f"{frontend_url}/scan/{code}/"

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        img_base64 = base64.b64encode(buffer.getvalue()).decode()

        POIQRCode.objects.create(poi=poi, code=code)

        return Response({
            'code': code,
            'url': qr_url,
            'image': f'data:image/png;base64,{img_base64}',
            'poi_title': poi.title,
        })


@api_view(["GET"])
def poi_by_qr_code(request):
    code = request.query_params.get("code")
    if not code:
        return Response({"error": "Code required"}, status=400)
    try:
        qr_link = POIQRCode.objects.get(code=code)
        qr_link.scans += 1
        qr_link.save()
        serializer = PointOfInterestSerializer(qr_link.poi)
        return Response(serializer.data)
    except POIQRCode.DoesNotExist:
        return Response({"error": "QR code not found"}, status=404)


@api_view(["POST"])
def poi_checkin_by_qr(request):
    data = json.loads(request.body)
    code = data.get("code")
    user_lat = data.get("lat")
    user_lng = data.get("lng")

    if not code:
        return JsonResponse({"error": "Код QR не указан"}, status=400)

    try:
        qr_link = POIQRCode.objects.get(code=code)
        poi = qr_link.poi
    except POIQRCode.DoesNotExist:
        return JsonResponse({"error": "QR-код не найден"}, status=404)

    if user_lat is not None and user_lng is not None:
        distance = haversine_meters(user_lat, user_lng, poi.coords_lat, poi.coords_lng)
        if distance > poi.radius:
            return JsonResponse({
                "error": f"Вы слишком далеко ({int(distance)} м). Подойдите ближе (нужно в радиусе {poi.radius} м)."
            }, status=400)

    qr_link.scans += 1
    qr_link.save()

    return JsonResponse({
        "message": f"Посещение подтверждено! +{poi.qr_points or poi.points} баллов.",
        "poi_id": str(poi.id),
        "points_added": poi.qr_points or poi.points
    })


@api_view(["GET"])
def poi_proxy(request):
    lat = request.query_params.get("lat", "54.6292")
    lon = request.query_params.get("lon", "39.7351")
    radius = request.query_params.get("radius", "5000")

    query = (
        "[out:json][timeout:25];\n"
        "(\n"
        f'  node["tourism"="attraction"](around:{radius},{lat},{lon});\n'
        f'  node["tourism"="museum"](around:{radius},{lat},{lon});\n'
        f'  node["historic"="monument"](around:{radius},{lat},{lon});\n'
        f'  node["historic"="memorial"](around:{radius},{lat},{lon});\n'
        ");\n"
        "out body 60;\n"
    )

    fallback = {
        "elements": [
            {
                "type": "node",
                "id": 1,
                "lat": 54.6348,
                "lon": 39.7486,
                "tags": {"name": "Рязанский Кремль", "historic": "monument"},
            },
            {
                "type": "node",
                "id": 2,
                "lat": 54.636,
                "lon": 39.747,
                "tags": {"name": "Памятник Есенину", "historic": "monument"},
            },
            {
                "type": "node",
                "id": 3,
                "lat": 54.6288,
                "lon": 39.7345,
                "tags": {"name": "Грибы с глазами", "tourism": "attraction"},
            },
        ]
    }

    try:
        req = urllib.request.Request(
            "https://overpass-api.de/api/interpreter",
            data=query.encode("utf-8"),
            headers={"Content-Type": "text/plain"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = resp.read()
        return HttpResponse(data, content_type="application/json")
    except Exception:
        return JsonResponse(fallback)
