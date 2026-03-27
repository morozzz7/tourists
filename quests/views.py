# ВСЁ ЧТО БЫЛО РАНЬШЕ, ОСТАЕТСЯ НА МЕСТЕ
# А В КОНЕЦ ДОБАВЬТЕ ЭТО:

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
import qrcode
from io import BytesIO
import base64
from .models import QRCampaign, QRCodeLink
from .serializers import QRCampaignSerializer, QRCodeLinkSerializer


class QRCampaignViewSet(viewsets.ModelViewSet):
    queryset = QRCampaign.objects.all()
    serializer_class = QRCampaignSerializer

    @action(detail=True, methods=["post"])
    def generate_qr_codes(self, request, pk=None):
        """Генерирует QR-коды для кампании"""
        campaign = self.get_object()
        quantity = request.data.get("quantity", 10)

        qr_codes = []

        for i in range(quantity):
            code = f"{str(campaign.id).replace('-', '')[:8]}{i:04d}"
            full_url = request.build_absolute_uri(f"/campaign/{code}/")

            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_H,
                box_size=10,
                border=4,
            )
            qr.add_data(full_url)
            qr.make(fit=True)

            img = qr.make_image(fill_color="black", back_color="white")

            buffer = BytesIO()
            img.save(buffer, format="PNG")
            buffer.seek(0)

            img_base64 = base64.b64encode(buffer.getvalue()).decode()

            qr_link = QRCodeLink.objects.get_or_create(campaign=campaign, code=code)[0]

            qr_codes.append(
                {
                    "id": str(qr_link.id),
                    "code": code,
                    "url": full_url,
                    "image": f"data:image/png;base64,{img_base64}",
                }
            )

        return Response(
            {"campaign": campaign.name, "qr_codes": qr_codes, "count": len(qr_codes)}
        )


class QRCodeLinkViewSet(viewsets.ModelViewSet):
    queryset = QRCodeLink.objects.all()
    serializer_class = QRCodeLinkSerializer

    @action(detail=False, methods=["get"])
    def by_code(self, request):
        """Получает кампанию по коду из QR"""
        code = request.query_params.get("code")

        if not code:
            return Response(
                {"error": "Code required"}, status=status.HTTP_400_BAD_REQUEST
            )

        qr_link = get_object_or_404(QRCodeLink, code=code)
        campaign = qr_link.campaign

        qr_link.scans += 1
        qr_link.save()

        return Response(
            {
                "campaign_id": str(campaign.id),
                "character": campaign.character,
                "name": campaign.name,
                "description": campaign.description,
                "scans": qr_link.scans,
            }
        )
