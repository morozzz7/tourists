# ВСЁ ЧТО БЫЛО РАНЬШЕ, ОСТАЕТСЯ НА МЕСТЕ
# А В КОНЕЦ ДОБАВЬТЕ ЭТО:

from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth.models import User
from django.middleware.csrf import get_token
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.conf import settings
import qrcode
from io import BytesIO
import base64
import urllib.request
import urllib.parse
import math
import json
import uuid

from .models import PointOfInterest, POIQRCode
from .serializers import PointOfInterestSerializer, POIQRCodeSerializer


class PointOfInterestViewSet(viewsets.ModelViewSet):
    queryset = PointOfInterest.objects.all()
    serializer_class = PointOfInterestSerializer

    @action(detail=True, methods=['post'])
    def generate_qr(self, request, pk=None):
        poi = self.get_object()
        
        # Генерируем уникальный код
        code = f"{poi.id.hex[:8]}{uuid.uuid4().hex[:6]}"
        
        # ИСПРАВЛЕНО: ссылка на фронтенд, а не на бэкенд
        frontend_url = 'http://localhost:5173'
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

        qr_link = POIQRCode.objects.create(poi=poi, code=code)
        
        return Response({
            'code': code,
            'url': qr_url,
            'image': f'data:image/png;base64,{img_base64}',
            'poi_title': poi.title,  # ← добавили название
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
    """Чекин по QR-коду"""
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
    
    # Проверяем геолокацию, если переданы координаты
    if user_lat is not None and user_lng is not None:
        def haversine(lat1, lng1, lat2, lng2):
            R = 6371000
            phi1 = math.radians(lat1)
            phi2 = math.radians(lat2)
            dphi = math.radians(lat2 - lat1)
            dlambda = math.radians(lng2 - lng1)
            a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
            return R * c
        
        distance = haversine(user_lat, user_lng, poi.coords_lat, poi.coords_lng)
        if distance > poi.radius:
            return JsonResponse({
                "error": f"Вы слишком далеко ({int(distance)} м). Подойдите ближе (нужно в радиусе {poi.radius} м)."
            }, status=400)
    
    # Увеличиваем счётчик сканирований
    qr_link.scans += 1
    qr_link.save()
    
    return JsonResponse({
        "message": f"Посещение подтверждено! +{poi.qr_points or poi.points} баллов.",
        "poi_id": str(poi.id),
        "points_added": poi.qr_points or poi.points
    })


@api_view(["GET"])
def poi_proxy(request):
    """Proxy для Overpass API, чтобы избежать CORS на фронте."""
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


@api_view(["GET"])
def csrf(request):
    """Выдает CSRF токен и ставит cookie."""
    return Response({"csrfToken": get_token(request)})


@api_view(["POST"])
def register(request):
    """Регистрация пользователя с логином по email."""
    name = (request.data.get("name") or "").strip()
    email = (request.data.get("email") or "").strip().lower()
    password = (request.data.get("password") or "").strip()

    if not email or not password:
        return Response({"error": "Email и пароль обязательны."}, status=400)

    if User.objects.filter(username=email).exists():
        return Response({"error": "Пользователь уже существует."}, status=400)

    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        first_name=name,
    )
    auth_login(request, user)
    return Response(
        {
            "id": user.id,
            "name": user.first_name,
            "email": user.email,
        }
    )


@api_view(["POST"])
def login(request):
    """Вход по email и паролю."""
    email = (request.data.get("email") or "").strip().lower()
    password = (request.data.get("password") or "").strip()

    if not email or not password:
        return Response({"error": "Email и пароль обязательны."}, status=400)

    user = authenticate(request, username=email, password=password)
    if user is None:
        return Response({"error": "Неверные учетные данные."}, status=400)

    auth_login(request, user)
    return Response(
        {
            "id": user.id,
            "name": user.first_name,
            "email": user.email,
        }
    )


@api_view(["POST"])
def logout(request):
    """Выход."""
    auth_logout(request)
    return Response({"ok": True})


@api_view(["GET"])
def me(request):
    """Текущий пользователь."""
    if not request.user.is_authenticated:
        return Response({"authenticated": False}, status=200)
    return Response(
        {
            "authenticated": True,
            "id": request.user.id,
            "name": request.user.first_name,
            "email": request.user.email,
        }
    )

def haversine(lat1, lng1, lat2, lng2):
    R = 6371000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    c = 2*math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

@require_POST
@login_required
def poi_checkin(request):
    """Эндпоинт для подтверждения посещения POI"""
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Неверный формат данных'}, status=400)
    
    poi_id = data.get('poi_id')
    user_lat = data.get('lat')
    user_lng = data.get('lng')
    
    if not poi_id or user_lat is None or user_lng is None:
        return JsonResponse({'error': 'Недостаточно данных. Укажите poi_id, lat, lng'}, status=400)
    
    try:
        from .models import PointOfInterest  # импортируйте здесь, если ещё не импортировали
        poi = PointOfInterest.objects.get(id=poi_id)
    except PointOfInterest.DoesNotExist:
        return JsonResponse({'error': 'POI не найден'}, status=404)
    
    # Функция для расчёта расстояния
    def haversine(lat1, lng1, lat2, lng2):
        R = 6371000  # радиус Земли в метрах
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlambda = math.radians(lng2 - lng1)
        a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        return R * c
    
    distance = haversine(user_lat, user_lng, poi.coords_lat, poi.coords_lng)
    
    if distance > poi.radius:
        return JsonResponse({
            'error': f'Вы слишком далеко ({int(distance)} м от точки). Подойдите ближе (нужно в радиусе {poi.radius} м).'
        }, status=400)
    
    # Здесь логика начисления баллов пользователю
    # Например:
    # user = request.user
    # profile, created = UserProfile.objects.get_or_create(user=user)
    # profile.points += poi.points
    # profile.save()
    
    return JsonResponse({
        'success': True,
        'message': f'Посещение подтверждено! +{poi.points} баллов.',
        'points_added': poi.points
    })
