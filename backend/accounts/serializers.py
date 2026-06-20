from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Profile


class SignupSerializer(serializers.ModelSerializer):
    """
    Used on /signup. Person provides full_name, email, password, role.
    Role is restricted to the three valid choices via the model field
    itself, so an invalid role string is rejected automatically.
    """

    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Profile
        fields = ["id", "full_name", "email", "password", "role"]
        read_only_fields = ["id"]

    def validate_email(self, value):
        value = value.lower().strip()
        if Profile.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def create(self, validated_data):
        return Profile.objects.create_user(**validated_data)


class ProfileSerializer(serializers.ModelSerializer):
    """Read-only representation of a user, used to display 'who is this'."""

    class Meta:
        model = Profile
        fields = ["id", "full_name", "email", "role", "created_at"]
        read_only_fields = fields


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Default SimpleJWT serializer expects `username`. We override the
    username field name to `email` since that's our USERNAME_FIELD,
    and we attach role/profile info onto the token response so the
    frontend immediately knows which dashboard to redirect to,
    without a second API call.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["full_name"] = user.full_name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = ProfileSerializer(self.user).data
        return data
