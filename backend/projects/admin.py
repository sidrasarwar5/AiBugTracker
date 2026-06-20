from django.contrib import admin

from .models import Project, ProjectMember


class ProjectMemberInline(admin.TabularInline):
    model = ProjectMember
    extra = 0
    readonly_fields = ("added_at",)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("name", "created_by", "created_at")
    search_fields = ("name", "created_by__email")
    list_filter = ("created_at",)
    inlines = [ProjectMemberInline]


@admin.register(ProjectMember)
class ProjectMemberAdmin(admin.ModelAdmin):
    list_display = ("project", "user", "role", "added_at")
    list_filter = ("role",)
    search_fields = ("project__name", "user__email")
