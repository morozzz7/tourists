from .models import (
    PointOfInterest,
    POIQRCode,
)  # или QRCodeLink, если вы используете её для POI
from django.contrib import admin


@admin.register(PointOfInterest)
class PointOfInterestAdmin(admin.ModelAdmin):
    list_display = ("title", "active", "points", "qr_points", "created_at")
    list_filter = ("active", "created_at")
    search_fields = ("title", "character_name")
    readonly_fields = ("id", "created_at")
    fieldsets = (
        (None, {"fields": ("title", "description", "info", "active")}),
        ("Локация", {"fields": ("coords_lat", "coords_lng", "radius")}),
        ("Баллы", {"fields": ("points", "qr_points")}),
        (
            "Персонаж",
            {
                "fields": (
                    "character_name",
                    "character_text",
                    "character_voice_rate",
                    "character_voice_pitch",
                )
            },
        ),
        ("Медиа", {"fields": ("image",)}),
        ("Системные", {"fields": ("id", "created_at"), "classes": ("collapse",)}),
    )


@admin.register(POIQRCode)  # или QRCodeLink, если вы её используете
class POIQRCodeAdmin(admin.ModelAdmin):
    list_display = ("code", "poi", "scans", "created_at")
    search_fields = ("code", "poi__title")
    list_filter = ("poi", "created_at")
    readonly_fields = ("id", "code", "created_at")
