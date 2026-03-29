from rest_framework import serializers
from .models import PointOfInterest, POIQRCode, UserProgress


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


class UserProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProgress
        fields = [
            "points",
            "collected_cards",
            "purchased_rewards",
            "started_routes",
            "completed_routes",
            "route_stamps",
            "active_route_id",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]
