from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from ai_assistant.services import AIService
from projects.models import Project, ProjectMember
from projects.permissions import IsDeveloper, IsQA

from .models import Bug, Notification
from .serializers import (
    BugAssignSerializer,
    BugCreateSerializer,
    BugSerializer,
    BugStatusUpdateSerializer,
    NotificationSerializer,
)


def _visible_projects(user):
    """Same visibility rule used in projects app, repeated here so bug
    queries can filter by it directly."""
    if user.is_manager:
        return Project.objects.filter(created_by=user)
    return Project.objects.filter(members__user=user).distinct()


class BugListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/bugs/?project=<id>   -- list bugs visible to this user
    POST /api/bugs/                -- create a bug (QA only)

    Visibility:
    - Manager: all bugs in projects he created (read-only, enforced
      via permission, not queryset, since he still needs to view them)
    - QA: bugs in projects she's a member of
    - Developer: only bugs assigned to him
    """

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsQA()]
        return super().get_permissions()

    def get_serializer_class(self):
        return BugCreateSerializer if self.request.method == "POST" else BugSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_developer:   # type: ignore[reportAttributeAccessIssue]
            qs = Bug.objects.filter(assigned_to=user)
        else:
            qs = Bug.objects.filter(project__in=_visible_projects(user))

        project_id = self.request.query_params.get("project")
        if project_id:
            qs = qs.filter(project_id=project_id)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        project_id = self.request.data.get("project")

        # QA must actually belong to the project she's reporting into
        is_member = ProjectMember.objects.filter(
            project_id=project_id, user=user, role=ProjectMember.Role.QA
        ).exists()
        if not is_member:
            raise ValidationError({"project": "You are not a QA member of this project."})

        bug = serializer.save(created_by=user)

        if bug.assigned_to_id:
            Notification.objects.create(
                user=bug.assigned_to,
                title="New bug assigned",
                message=f"New bug assigned: {bug.title}",
            )


class BugDetailView(generics.RetrieveUpdateAPIView):
    """
    GET  /api/bugs/<id>/  -- view bug detail (anyone with visibility)
    PUT/PATCH -- edit bug details (QA only, and only if she created it
    or is a QA member of the project)
    """

    serializer_class = BugSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_developer:   # type: ignore[reportAttributeAccessIssue]
            return Bug.objects.filter(assigned_to=user)
        return Bug.objects.filter(project__in=_visible_projects(user))

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return BugCreateSerializer
        return BugSerializer

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if request.method in ("PUT", "PATCH"):
            user = request.user
            is_qa_on_project = ProjectMember.objects.filter(
                project=obj.project, user=user, role=ProjectMember.Role.QA
            ).exists()
            if not (user.is_qa and is_qa_on_project):
                self.permission_denied(request, message="Only QA members of this project can edit this bug.")


class BugSearchView(APIView):
    """
    GET /api/bugs/search/?q=<query>&project=<id optional>

    Semantic search over bugs visible to the logged-in user, using the
    existing AIService.semantic_search() (LLM-ranking approach, already
    used elsewhere for bug report improvement / categorization).

    - project param is optional: omit it to search everything the user
      can see; include it to scope the search to one project.
    - Visibility follows the same rule as BugListCreateView: Developer
      only sees bugs assigned to them, Manager/QA see bugs in their
      visible projects.

    Response shape:
        {
          "results": [ ...BugSerializer data... ],
          "method": "ai" | "fallback"
        }
    "method" tells the frontend whether Gemini actually ranked these
    results, or whether quota was exhausted and a plain keyword match
    was used instead -- so the UI can be honest with the user about
    which one produced what they're looking at.
    """

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        if not query:
            return Response({"detail": "Query parameter 'q' is required."}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        if user.is_developer:
            qs = Bug.objects.filter(assigned_to=user)
        else:
            qs = Bug.objects.filter(project__in=_visible_projects(user))

        project_id = request.query_params.get("project")
        if project_id:
            qs = qs.filter(project_id=project_id)

        bugs = list(qs)
        if not bugs:
            return Response({"results": [], "method": "ai"})

        bug_dicts = [
            {"id": str(bug.id), "title": bug.title, "description": bug.description}
            for bug in bugs
        ]

        search_result = AIService().semantic_search(query, bug_dicts)
        ranked_ids = search_result["ids"]
        method = search_result["method"]

        bugs_by_id = {str(bug.id): bug for bug in bugs}
        ranked_bugs = [bugs_by_id[bug_id] for bug_id in ranked_ids if bug_id in bugs_by_id]

        return Response({
            "results": BugSerializer(ranked_bugs, many=True).data,
            "method": method,
        })


class BugAssignView(APIView):
    """
    POST /api/bugs/<id>/assign/
    body: {"assigned_to_id": "<developer uuid>"}
    QA-only. Used both for initial assignment and reassignment.
    """

    permission_classes = [IsQA]

    def post(self, request, bug_id):
        try:
            bug = Bug.objects.get(id=bug_id)
        except Bug.DoesNotExist:
            return Response({"detail": "Bug not found."}, status=status.HTTP_404_NOT_FOUND)

        is_qa_on_project = ProjectMember.objects.filter(
            project=bug.project, user=request.user, role=ProjectMember.Role.QA
        ).exists()
        if not is_qa_on_project:
            return Response(
                {"detail": "You are not a QA member of this project."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = BugAssignSerializer(data=request.data, context={"bug": bug})
        serializer.is_valid(raise_exception=True)

        bug.assigned_to_id = serializer.validated_data["assigned_to_id"]
        bug.save(update_fields=["assigned_to", "updated_at"])

        Notification.objects.create(
            user=bug.assigned_to,
            title="New bug assigned",
            message=f"New bug assigned: {bug.title}",
        )

        return Response(BugSerializer(bug).data)


class BugStatusUpdateView(generics.UpdateAPIView):
    """
    PATCH /api/bugs/<id>/status/
    Developer-only, and only for bugs assigned to them.
    """

    permission_classes = [IsDeveloper]
    serializer_class = BugStatusUpdateSerializer

    def get_queryset(self):
        return Bug.objects.filter(assigned_to=self.request.user)

    def update(self, request, *args, **kwargs):
        super().update(request, *args, **kwargs)
        bug = self.get_object()
        return Response(BugSerializer(bug).data)


class NotificationListView(generics.ListAPIView):
    """GET /api/notifications/ -- the logged-in user's own notifications."""

    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)