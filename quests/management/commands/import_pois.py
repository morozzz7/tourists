import json
import urllib.parse
import urllib.request

from django.core.management.base import BaseCommand

from quests.models import PointOfInterest


DEFAULT_CENTER_LAT = 54.6292
DEFAULT_CENTER_LNG = 39.7351
DEFAULT_RADIUS = 5000


def build_overpass_query(lat, lng, radius):
    return (
        "[out:json][timeout:25];\n"
        "(\n"
        f'  node["tourism"="attraction"](around:{radius},{lat},{lng});\n'
        f'  node["tourism"="museum"](around:{radius},{lat},{lng});\n'
        f'  node["historic"="monument"](around:{radius},{lat},{lng});\n'
        f'  node["historic"="memorial"](around:{radius},{lat},{lng});\n'
        ");\n"
        "out body 60;\n"
    )


def fetch_overpass(query):
    endpoint = "https://overpass-api.de/api/interpreter"
    data = urllib.parse.urlencode({"data": query}).encode("utf-8")
    request = urllib.request.Request(endpoint, data=data)
    with urllib.request.urlopen(request, timeout=25) as response:
        payload = response.read().decode("utf-8")
    return json.loads(payload)


class Command(BaseCommand):
    help = "Import POIs from Overpass API into the database."

    def add_arguments(self, parser):
        parser.add_argument("--lat", type=float, default=DEFAULT_CENTER_LAT)
        parser.add_argument("--lng", type=float, default=DEFAULT_CENTER_LNG)
        parser.add_argument("--radius", type=int, default=DEFAULT_RADIUS)
        parser.add_argument("--limit", type=int, default=40)
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **options):
        lat = options["lat"]
        lng = options["lng"]
        radius = options["radius"]
        limit = options["limit"]
        dry_run = options["dry_run"]

        query = build_overpass_query(lat, lng, radius)
        payload = fetch_overpass(query)
        elements = payload.get("elements", [])

        count_created = 0
        count_skipped = 0
        count_missing = 0

        for el in elements:
            if el.get("type") != "node":
                continue

            tags = el.get("tags") or {}
            title = (
                tags.get("name")
                or tags.get("name:ru")
                or tags.get("name:en")
            )
            if not title:
                count_missing += 1
                continue

            el_lat = el.get("lat")
            el_lng = el.get("lon")
            if el_lat is None or el_lng is None:
                count_missing += 1
                continue

            lat_min = el_lat - 0.000001
            lat_max = el_lat + 0.000001
            lng_min = el_lng - 0.000001
            lng_max = el_lng + 0.000001

            exists = PointOfInterest.objects.filter(
                title=title,
                coords_lat__range=(lat_min, lat_max),
                coords_lng__range=(lng_min, lng_max),
            ).exists()
            if exists:
                count_skipped += 1
                continue

            poi = PointOfInterest(
                title=title,
                description="Imported from OpenStreetMap.",
                info="",
                coords_lat=el_lat,
                coords_lng=el_lng,
                points=10,
                qr_points=20,
                radius=120,
                image="",
                character_name="Local Guide",
                character_text=(
                    "Welcome! Scan the QR code to learn more about this place."
                ),
                character_voice_rate=1.0,
                character_voice_pitch=1.0,
                active=True,
            )

            if dry_run:
                self.stdout.write(f"DRY RUN: would create POI: {title}")
                count_created += 1
                continue

            poi.save()
            count_created += 1

            if count_created >= limit:
                break

        self.stdout.write(
            "Import finished. "
            f"created={count_created}, skipped={count_skipped}, "
            f"missing={count_missing}"
        )
