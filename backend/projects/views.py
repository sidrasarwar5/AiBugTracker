from enum import member

from django.db.models import Q
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.core.mail import send_mail

from accounts.models import Profile
from bugs.models import Notification

from .models import Project, ProjectMember
from .permissions import IsManager
from .serializers import (
    AddMemberSerializer,
    ProjectListSerializer,
    ProjectMemberSerializer,
    ProjectSerializer,
)


class ProjectListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/projects/   -> projects visible to the logged-in user
    POST /api/projects/   -> create a project (Manager only)

    Visibility rule from the spec:
    - Manager sees only projects HE created
    - QA / Developer see only projects they were added to
    """

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsManager()]
        return super().get_permissions()

    def get_serializer_class(self):
        return ProjectSerializer if self.request.method == "POST" else ProjectListSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_manager:
            return Project.objects.filter(created_by=user)
        # qa / developer
        return Project.objects.filter(members__user=user).distinct()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ProjectDetailView(generics.RetrieveAPIView):
    """
    GET /api/projects/<id>/
    Same visibility rule as the list view -- a QA/Dev can't fetch a
    project they're not part of, and a Manager can't fetch another
    manager's project, just by guessing the UUID.
    """

    serializer_class = ProjectSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_manager:
            return Project.objects.filter(created_by=user)
        return Project.objects.filter(members__user=user).distinct()


class AddMemberView(APIView):
    """
    POST /api/projects/<id>/add-member/
    body: {"email": "sarah@gmail.com", "role": "qa"}

    Manager-only, and only for a project the manager themself created.
    """

    permission_classes = [IsManager]

    def post(self, request, project_id):
        try:
            project = Project.objects.get(id=project_id, created_by=request.user)
        except Project.DoesNotExist:
            return Response(
                {"detail": "Project not found."}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = AddMemberSerializer(data=request.data, context={"project": project})
        serializer.is_valid(raise_exception=True)

        member = ProjectMember.objects.create(
            project=project,
            user=serializer.validated_data["user"],
            role=serializer.validated_data["role"],
        )

        Notification.objects.create(
    user=member.user,
    title="Added to project",
    message=f"You were added to '{project.name}' as {member.role}.",
)
        send_mail(
            subject=f"You've been added to '{project.name}'",
            message=f"Hi {member.user.full_name},\n\nYou've been added to '{project.name}' as {member.get_role_display()}.\n\nLog in to view your project.",
            from_email=None,  # uses DEFAULT_FROM_EMAIL from settings
            recipient_list=[member.user.email],
            fail_silently=True,
)
        

        return Response(ProjectMemberSerializer(member).data, status=status.HTTP_201_CREATED)
