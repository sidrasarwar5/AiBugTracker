import uuid

from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.db import models


class UserManager(BaseUserManager):
    """
    Custom manager because we use email as the login field
    instead of username.
    """

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        email = self.normalize_email(email)
        extra_fields.setdefault("role", Profile.Role.DEVELOPER)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", Profile.Role.MANAGER)
        return self.create_user(email, password, **extra_fields)


class Profile(AbstractUser):
    """
    Custom user model. We keep Django's AbstractUser (so we get
    password hashing, permissions, is_active, etc. for free) but:
    - login is by email, not username
    - we add a `role` field (manager / qa / developer)
    - id is a UUID instead of an auto-increment int, since the
      spec calls every FK a uuid.
    """

    class Role(models.TextChoices):
        MANAGER = "manager", "Manager"
        QA = "qa", "QA"
        DEVELOPER = "developer", "Developer"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Username is no longer required/used for login, but Django's
    # AbstractUser still defines it. We keep it (auto-filled from email)
    # to avoid fighting the framework, but it's not what people log in with.
    username = models.CharField(max_length=150, unique=True, blank=True)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=Role.choices)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name", "role"]

    objects = UserManager() # type: ignore[reportAssignmentType]

    def save(self, *args, **kwargs):
        # keep `username` populated so AbstractUser internals don't choke,
        # without ever exposing it as something the user picks
        if not self.username:
            self.username = self.email
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.full_name} ({self.role})"

    @property
    def is_manager(self):
        return self.role == self.Role.MANAGER

    @property
    def is_qa(self):
        return self.role == self.Role.QA

    @property
    def is_developer(self):
        return self.role == self.Role.DEVELOPER
