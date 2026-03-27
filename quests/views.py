# ВСЁ ЧТО БЫЛО РАНЬШЕ, ОСТАЕТСЯ НА МЕСТЕ
# А В КОНЕЦ ДОБАВЬТЕ ЭТО:

from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth.models import User
from django.middleware.csrf import get_token
import qrcode
from io import BytesIO
import base64
import urllib.request
import urllib.parse
import json
from .models import QRCampaign, QRCodeLink
from .serializers import QRCampaignSerializer, QRCodeLinkSerializer


class QRCampaignViewSet(viewsets.ModelViewSet):
    queryset = QRCampaign.objects.all()
    serializer_class = QRCampaignSerializer

    @action(detail=True, methods=["post"])
    def generate_qr_codes(self, request, pk=None):
        """Генерирует QR-коды для кампании"""
        campaign = self.get_object()
        quantity = request.data.get("quantity", 10)

        qr_codes = []

        for i in range(quantity):
            code = f"{str(campaign.id).replace('-', '')[:8]}{i:04d}"
            full_url = request.build_absolute_uri(f"/campaign/{code}/")

            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_H,
                box_size=10,
                border=4,
            )
            qr.add_data(full_url)
            qr.make(fit=True)

            img = qr.make_image(fill_color="black", back_color="white")

            buffer = BytesIO()
            img.save(buffer, format="PNG")
            buffer.seek(0)

            img_base64 = base64.b64encode(buffer.getvalue()).decode()

            qr_link = QRCodeLink.objects.get_or_create(campaign=campaign, code=code)[0]

            qr_codes.append(
                {
                    "id": str(qr_link.id),
                    "code": code,
                    "url": full_url,
                    "image": f"data:image/png;base64,{img_base64}",
                }
            )

        return Response(
            {"campaign": campaign.name, "qr_codes": qr_codes, "count": len(qr_codes)}
        )


class QRCodeLinkViewSet(viewsets.ModelViewSet):
    queryset = QRCodeLink.objects.all()
    serializer_class = QRCodeLinkSerializer

    @action(detail=False, methods=["get"])
    def by_code(self, request):
        """Получает кампанию по коду из QR"""
        code = request.query_params.get("code")

        if not code:
            return Response(
                {"error": "Code required"}, status=status.HTTP_400_BAD_REQUEST
            )

        qr_link = get_object_or_404(QRCodeLink, code=code)
        campaign = qr_link.campaign

        qr_link.scans += 1
        qr_link.save()

        return Response(
            {
                "campaign_id": str(campaign.id),
                "character": campaign.character,
                "name": campaign.name,
                "description": campaign.description,
                "scans": qr_link.scans,
            }
        )


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
