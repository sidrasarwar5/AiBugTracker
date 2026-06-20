import uuid

from django.conf import settings
from django.db import models


class Project(models.Model):
    """
    A project is a container. Only a Manager can create one, and a
    Manager only ever sees projects where created_by == themself
    (enforced in the view's queryset, not here).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="projects_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class ProjectMember(models.Model):
    """
    Who belongs to which project, and in what capacity for THAT
    project. We store role here (rather than only trusting
    profile.role) so that a project knows "Sarah is QA here" without
    re-checking her global profile every time, per the trainer's
    feedback.
    """

    class Role(models.TextChoices):
        QA = "qa", "QA"
        DEVELOPER = "developer", "Developer"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="members")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="project_memberships",
    )
    role = models.CharField(max_length=20, choices=Role.choices)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["project", "user"], name="unique_member_per_project")
        ]

    def __str__(self):
        return f"{self.user.full_name} -> {self.project.name} ({self.role})"
