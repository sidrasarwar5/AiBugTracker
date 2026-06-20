from rest_framework import serializers

from accounts.models import Profile
from accounts.serializers import ProfileSerializer

from .models import Project, ProjectMember


class ProjectMemberSerializer(serializers.ModelSerializer):
    user = ProfileSerializer(read_only=True)

    class Meta:
        model = ProjectMember
        fields = ["id", "user", "role", "added_at"]
        read_only_fields = fields


class ProjectSerializer(serializers.ModelSerializer):
    created_by = ProfileSerializer(read_only=True)
    members = ProjectMemberSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "description",
            "created_by",
            "members",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_by", "members", "created_at", "updated_at"]


class ProjectListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views -- skips nested members."""

    created_by = ProfileSerializer(read_only=True)
    member_count = serializers.IntegerField(source="members.count", read_only=True)

    class Meta:
        model = Project
        fields = ["id", "name", "description", "created_by", "member_count", "created_at"]
        read_only_fields = fields


class AddMemberSerializer(serializers.Serializer):
    """
    POST body for adding a member: {email, role}.
    Validates:
    - email belongs to an existing account ("User not found" otherwise)
    - role is qa or developer (a Manager can't add another manager
      as a project member)
    - that user isn't already a member of this project
    """

    email = serializers.EmailField()
    role = serializers.ChoiceField(choices=ProjectMember.Role.choices)

    def validate_email(self, value):
        value = value.lower().strip()
        try:
            self._user = Profile.objects.get(email=value)
        except Profile.DoesNotExist:
            raise serializers.ValidationError("User not found")
        return value

    def validate(self, attrs):
        project = self.context["project"]
        user = self._user

        if user.role != attrs["role"]:
            raise serializers.ValidationError(
                {
                    "role": (
                        f"This account is registered as '{user.role}', "
                        f"not '{attrs['role']}'."
                    )
                }
            )

        if ProjectMember.objects.filter(project=project, user=user).exists():
            raise serializers.ValidationError("This user is already a member of this project.")

        attrs["user"] = user
        return attrs
