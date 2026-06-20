from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Profile


@admin.register(Profile)
class ProfileAdmin(UserAdmin):
    model = Profile
    list_display = ("email", "full_name", "role", "is_staff", "created_at")
    list_filter = ("role", "is_staff", "is_active")
    search_fields = ("email", "full_name")
    ordering = ("-created_at",)

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("full_name", "role")}),
        (
            "Permissions",
            {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")},
        ),
        ("Important dates", {"fields": ("last_login",)}),
    )
    add_fieldsets = (
        (
            None,
            {
                "fields": ("email", "full_name", "role", "password1", "password2"),
            },
        ),
    )
