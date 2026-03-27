from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'qr-campaigns', views.QRCampaignViewSet, basename='qr-campaign')
router.register(r'qr-codes', views.QRCodeLinkViewSet, basename='qr-code')

app_name = 'quests'

urlpatterns = [
    path('', include(router.urls)),
    path('poi/', views.poi_proxy, name='poi-proxy'),
]
