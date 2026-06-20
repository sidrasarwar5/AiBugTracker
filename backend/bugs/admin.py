from django.contrib import admin

from .models import Bug, Notification


@admin.register(Bug)
class BugAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "project",
        "type",
        "status",
        "assigned_to",
        "created_by",
        "deadline",
        "created_at",
    )
    list_filter = ("type", "status", "project")
    search_fields = ("title", "project__name", "assigned_to__email", "created_by__email")


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("user", "title", "is_read", "created_at")
    list_filter = ("is_read",)
    search_fields = ("user__email", "title")
