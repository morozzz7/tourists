# quests/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import PointOfInterestViewSet

router = DefaultRouter()
router.register(r'pois', PointOfInterestViewSet)

urlpatterns = [
    path('', include(router.urls)),  # будет /pois/
    path('qr-by-code/', views.poi_by_qr_code),
    path('poi-checkin-by-qr/', views.poi_checkin_by_qr),
    path('auth/csrf/', views.csrf),
    path('auth/register/', views.register),
    path('auth/login/', views.login),
    path('auth/logout/', views.logout),
    path('auth/me/', views.me),
    path('progress/', views.user_progress),
]
