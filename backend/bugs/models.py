import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from projects.models import Project


def validate_screenshot_extension(value):
    """Only PNG and GIF allowed, per spec."""
    if not value:
        return
    valid_extensions = (".png", ".gif")
    name = value.name.lower()
    if not name.endswith(valid_extensions):
        raise ValidationError("Only PNG and GIF files are allowed for screenshots.")


class Bug(models.Model):
    class Type(models.TextChoices):
        BUG = "bug", "Bug"
        FEATURE = "feature", "Feature"

    class Status(models.TextChoices):
        NEW = "new", "New"
        STARTED = "started", "Started"
        RESOLVED = "resolved", "Resolved"   # valid only when type=bug
        COMPLETED = "completed", "Completed"  # valid only when type=feature

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        CRITICAL = "critical", "Critical"

    class Category(models.TextChoices):
        UI = "ui", "UI"
        BACKEND = "backend", "Backend"
        DATABASE = "database", "Database"
        PERFORMANCE = "performance", "Performance"
        SECURITY = "security", "Security"
        OTHER = "other", "Other"
        AUTH = "auth", "Authentication"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    type = models.CharField(max_length=10, choices=Type.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.OTHER)
    deadline = models.DateField(null=True, blank=True)
    screenshot = models.ImageField(
        upload_to="bug_screenshots/",
        null=True,
        blank=True,
        validators=[validate_screenshot_extension],
    )

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="bugs")
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="bugs_assigned",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bugs_reported",
    )
    resolution_notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["project", "title"], name="unique_title_per_project")
        ]
        ordering = ["-created_at"]

    def valid_statuses(self):
        if self.type == self.Type.BUG:
            return {self.Status.NEW, self.Status.STARTED, self.Status.RESOLVED}
        return {self.Status.NEW, self.Status.STARTED, self.Status.COMPLETED}

    def clean(self):
        if self.status and self.status not in {s.value for s in self.valid_statuses()}:
            raise ValidationError(
                {"status": f"'{self.status}' is not a valid status for type '{self.type}'."}
            )

    def __str__(self):
        return f"[{self.project.name}] {self.title}"


class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.full_name}: {self.title}"