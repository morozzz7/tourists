# ВСЁ ЧТО БЫЛО РАНЬШЕ, ОСТАЕТСЯ НА МЕСТЕ
# А В КОНЕЦ ДОБАВЬТЕ ЭТО:

from django.db import models
import uuid


class QRCampaign(models.Model):
    """Кампания с QR-кодами"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.CharField(max_length=200, verbose_name="Название")
    character = models.CharField(max_length=100, verbose_name="Персонаж")
    description = models.TextField(verbose_name="Описание")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")

    class Meta:
        verbose_name = "QR Кампания"
        verbose_name_plural = "QR Кампании"

    def __str__(self):
        return self.name


class QRCodeLink(models.Model):
    """Уникальная ссылка для QR-кода"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    campaign = models.ForeignKey(
        QRCampaign, on_delete=models.CASCADE, related_name="qr_codes"
    )
    code = models.CharField(max_length=50, unique=True, db_index=True)
    scans = models.IntegerField(default=0, verbose_name="Сканирований")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")

    class Meta:
        verbose_name = "QR Код"
        verbose_name_plural = "QR Коды"
        indexes = [
            models.Index(fields=["code"]),
            models.Index(fields=["campaign", "created_at"]),
        ]

    def __str__(self):
        return f"{self.campaign.name} - {self.code}"
