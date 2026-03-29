# quests/models.py
import uuid
from django.db import models
from django.contrib.auth.models import User


class PointOfInterest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200, verbose_name="Название")
    description = models.TextField(verbose_name="Краткое описание")
    info = models.TextField(verbose_name="Подробная информация", blank=True)
    coords_lat = models.FloatField(verbose_name="Широта")
    coords_lng = models.FloatField(verbose_name="Долгота")
    points = models.IntegerField(default=0, verbose_name="Баллы за посещение")
    qr_points = models.IntegerField(default=0, verbose_name="Баллы за QR")
    radius = models.IntegerField(default=100, verbose_name="Радиус подтверждения (м)")
    image = models.URLField(blank=True, verbose_name="URL изображения")
    character_name = models.CharField(max_length=100, verbose_name="Имя персонажа")
    character_text = models.TextField(verbose_name="Текст персонажа")
    character_voice_rate = models.FloatField(default=1.0, verbose_name="Скорость речи")
    character_voice_pitch = models.FloatField(default=1.0, verbose_name="Высота тона")
    active = models.BooleanField(default=True, verbose_name="Активна в игре")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Точка интереса"
        verbose_name_plural = "Точки интереса"

    def __str__(self):
        return self.title
# quests/models.py


class POIQRCode(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    poi = models.ForeignKey(PointOfInterest, on_delete=models.CASCADE, related_name='qr_codes')
    code = models.CharField(max_length=50, unique=True, db_index=True)
    scans = models.IntegerField(default=0, verbose_name="Сканирований")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "QR-код POI"
        verbose_name_plural = "QR-коды POI"
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['poi', 'created_at']),
        ]

    def __str__(self):
        return f"{self.poi.title} - {self.code}"


class UserProgress(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='progress')
    points = models.IntegerField(default=0, verbose_name="Баллы пользователя")
    collected_cards = models.JSONField(default=list, blank=True, verbose_name="Собранные карточки")
    purchased_rewards = models.JSONField(default=list, blank=True, verbose_name="Купленные награды")
    started_routes = models.JSONField(default=list, blank=True, verbose_name="Начатые маршруты")
    completed_routes = models.JSONField(default=list, blank=True, verbose_name="Завершенные маршруты")
    route_stamps = models.JSONField(default=dict, blank=True, verbose_name="Штампы маршрутов")
    active_route_id = models.CharField(max_length=100, blank=True, default="", verbose_name="Активный маршрут")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Прогресс пользователя"
        verbose_name_plural = "Прогресс пользователей"

    def __str__(self):
        return f"Progress for {self.user.username}"
