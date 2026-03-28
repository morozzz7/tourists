from rest_framework import serializers
from .models import PointOfInterest, POIQRCode


class PointOfInterestSerializer(serializers.ModelSerializer):
    class Meta:
        model = PointOfInterest
        fields = "__all__"


class POIQRCodeSerializer(serializers.ModelSerializer):
    poi = PointOfInterestSerializer(read_only=True)
    poi_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = POIQRCode
        fields = ["id", "code", "poi", "poi_id", "scans", "created_at"]
        read_only_fields = ["id", "code", "scans", "created_at"]
