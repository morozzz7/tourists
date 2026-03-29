"""Auth-эндпойнты: регистрация, вход, выход, me."""
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth.models import User
from django.middleware.csrf import get_token
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(["GET"])
def csrf(request):
    return Response({"csrfToken": get_token(request)})


@api_view(["POST"])
def register(request):
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
    auth_logout(request)
    return Response({"ok": True})


@api_view(["GET"])
def me(request):
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
