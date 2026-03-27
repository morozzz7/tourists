# ВСЁ ЧТО БЫЛО РАНЬШЕ, ОСТАЕТСЯ НА МЕСТЕ
# А В КОНЕЦ ДОБАВЬТЕ ЭТО:

from django.contrib import admin
from .models import QRCampaign, QRCodeLink

@admin.register(QRCampaign)
class QRCampaignAdmin(admin.ModelAdmin):
    list_display = ('name', 'character', 'created_at')
    search_fields = ('name', 'character')
    list_filter = ('created_at', 'character')

@admin.register(QRCodeLink)
class QRCodeLinkAdmin(admin.ModelAdmin):
    list_display = ('code', 'campaign', 'scans', 'created_at')
    search_fields = ('code', 'campaign__name')
    list_filter = ('campaign', 'created_at')
    readonly_fields = ('id', 'code', 'created_at')
