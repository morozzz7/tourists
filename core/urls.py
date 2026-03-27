"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from quests import views as quests_views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/quests/', include('quests.urls')),
    path('api/auth/csrf/', quests_views.csrf, name='auth-csrf'),
    path('api/auth/register/', quests_views.register, name='auth-register'),
    path('api/auth/login/', quests_views.login, name='auth-login'),
    path('api/auth/logout/', quests_views.logout, name='auth-logout'),
    path('api/auth/me/', quests_views.me, name='auth-me'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
