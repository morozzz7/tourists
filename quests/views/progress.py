"""Эндпойнт прогресса пользователя."""
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..models import UserProgress
from ..serializers import UserProgressSerializer


@api_view(["GET", "PUT", "PATCH"])
def user_progress(request):
    if not request.user.is_authenticated:
        return Response({"authenticated": False}, status=401)

    progress, _ = UserProgress.objects.get_or_create(user=request.user)

    if request.method == "GET":
        serializer = UserProgressSerializer(progress)
        return Response(serializer.data)

    serializer = UserProgressSerializer(progress, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)
