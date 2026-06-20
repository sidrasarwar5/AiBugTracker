from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/projects/", include("projects.urls")),
    path("api/bugs/", include("bugs.urls")),
    path("api/notifications/", include("bugs.notification_urls")),
    path("api/ai/", include("ai_assistant.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)