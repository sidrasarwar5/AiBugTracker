from rest_framework import serializers

from accounts.serializers import ProfileSerializer
from projects.models import ProjectMember

from .models import Bug, Notification, validate_screenshot_extension


class BugSerializer(serializers.ModelSerializer):
    assigned_to = ProfileSerializer(read_only=True)
    created_by = ProfileSerializer(read_only=True)

    class Meta:
        model = Bug
        fields = [
            "id",
            "title",
            "description",
            "type",
            "status",
            "priority",
            "category",
            "deadline",
            "screenshot",
            "project",
            "assigned_to",
            "created_by",
            "resolution_notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "assigned_to",
            "created_by",
            "resolution_notes",
            "created_at",
            "updated_at",
        ]

    def validate_screenshot(self, value):
        validate_screenshot_extension(value)
        return value

    def validate(self, attrs):
        project = attrs.get("project") or getattr(self.instance, "project", None)
        title = attrs.get("title") or getattr(self.instance, "title", None)
        if project and title:
            qs = Bug.objects.filter(project=project, title=title)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    {"title": "A bug with this title already exists in this project."}
                )
        return attrs


class BugCreateSerializer(BugSerializer):
    """
    Used on create. assigned_to is a writable field here (QA assigns
    while creating, or can reassign later via BugAssignSerializer),
    but must be a Developer who belongs to the same project.
    priority/category are writable here too -- QA can accept AI
    suggestions or set manually; both default sensibly if omitted.
    """

    assigned_to_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta(BugSerializer.Meta):
        fields = BugSerializer.Meta.fields + ["assigned_to_id"]

    def validate_assigned_to_id(self, value):
        if value is None:
            return value
        project = self.initial_data.get("project")
        member = ProjectMember.objects.filter(
            project_id=project, user_id=value, role=ProjectMember.Role.DEVELOPER
        ).first()
        if not member:
            raise serializers.ValidationError(
                "Selected user is not a Developer on this project."
            )
        return value

    def create(self, validated_data):
        assigned_to_id = validated_data.pop("assigned_to_id", None)
        bug = Bug(**validated_data)
        if assigned_to_id:
            bug.assigned_to_id = assigned_to_id
        bug.full_clean()
        bug.save()
        return bug


class BugAssignSerializer(serializers.Serializer):
    """POST body for (re)assigning a bug: {assigned_to_id}"""

    assigned_to_id = serializers.UUIDField()

    def validate_assigned_to_id(self, value):
        bug = self.context["bug"]
        member = ProjectMember.objects.filter(
            project=bug.project, user_id=value, role=ProjectMember.Role.DEVELOPER
        ).first()
        if not member:
            raise serializers.ValidationError(
                "Selected user is not a Developer on this project."
            )
        return value


class BugStatusUpdateSerializer(serializers.ModelSerializer):
    """
    Used by a Developer to update status + resolution_notes on a bug
    assigned to them. type/title/etc are not editable here.
    """

    class Meta:
        model = Bug
        fields = ["status", "resolution_notes"]

    def validate_status(self, value):
        bug = self.instance
        valid = {s.value for s in bug.valid_statuses()}
        if value not in valid:
            raise serializers.ValidationError(
                f"'{value}' is not a valid status for type '{bug.type}'. Valid options: {sorted(valid)}"
            )
        return value


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "title", "message", "is_read", "created_at"]
        read_only_fields = ["id", "title", "message", "created_at"]