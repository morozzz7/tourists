from rest_framework import serializers
from .models import QRCampaign, QRCodeLink


class QRCampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = QRCampaign
        fields = ["id", "name", "character", "description", "created_at"]


class QRCodeLinkSerializer(serializers.ModelSerializer):
    campaign = QRCampaignSerializer()

    class Meta:
        model = QRCodeLink
        fields = ["id", "code", "campaign", "scans", "created_at"]
