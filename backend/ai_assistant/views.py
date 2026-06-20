from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .services import AIService
from bugs.models import Bug  
from projects.models import Project  
from .models import ChatConversation, ChatMessage
from bugs.models import Bug
from projects.models import Project, ProjectMember


class ImproveBugReportView(APIView):
    """
    POST /api/ai/improve-report
    body: {"title": "...", "description": "..."}
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        title = request.data.get("title", "")
        description = request.data.get("description", "")

        if not description:
            return Response({"detail": "Description is required."}, status=400)

        ai = AIService()
        suggestions = ai.improve_bug_report(title, description)

        if not suggestions:
            return Response({"detail": "AI service unavailable. Try again later."}, status=503)

        return Response(suggestions)


# ============================================
# AI Categorization View
# ============================================
class AICategorizeBugView(APIView):
    """
    POST /api/ai/categorize/
    body: {"title": "...", "description": "..."}
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        title = request.data.get("title", "").strip()
        description = request.data.get("description", "").strip()

        if not title or not description:
            return Response({
                "error": "Please provide title and description",
                "is_valid": False
            }, status=400)

        ai = AIService()

        # Check if valid input
        if not ai._is_valid_bug_report(title, description):
            return Response({
                "error": "Please provide more details for better categorization",
                "type": "bug",
                "priority": "medium",
                "category": "other",
                "is_valid": False
            })

        categories = ai.categorize_bug(title, description)

        if not categories:
            return Response({
                "error": "AI service unavailable. Try again later.",
                "is_valid": False
            }, status=503)

        categories["is_valid"] = True
        return Response(categories)


# ============================================
# Semantic Search View
# ============================================
class SemanticSearchView(APIView):
    """
    POST /api/ai/semantic-search/
    body: {"query": "...", "project_id": "..."}
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        query = request.data.get("query", "").strip()
        project_id = request.data.get("project_id")

        if not query:
            return Response({
                "error": "Please enter a search query",
                "results": []
            }, status=400)

        # Get bugs based on user's role
        user = request.user
        bugs = self._get_accessible_bugs(user, project_id)

        if not bugs:
            return Response({
                "results": [],
                "total": 0,
                "query": query,
                "method": "ai",
                "message": "No bugs found"
            })

        # Format bugs for AI search
        bug_list = [
            {
                "id": str(bug.id),
                "title": bug.title,
                "description": bug.description[:500] if bug.description else ""  # Limit description length
            }
            for bug in bugs
        ]

        # Perform semantic search -- now returns {"ids": [...], "method": "ai"|"fallback"}
        ai = AIService()
        search_result = ai.semantic_search(query, bug_list)
        ranked_ids = search_result["ids"]
        method = search_result["method"]

        # Order bugs by relevance
        if ranked_ids:
            # Create a dict for O(1) lookup
            bug_dict = {str(bug.id): bug for bug in bugs}
            ordered_bugs = []
            for bug_id in ranked_ids:
                if bug_id in bug_dict:
                    ordered_bugs.append(bug_dict[bug_id])
                    del bug_dict[bug_id]  # Remove to avoid duplicates
            # Add remaining bugs (not found by AI) at the end
            ordered_bugs.extend(bug_dict.values())
        else:
            # No ranked matches -- show nothing extra, just respect what AI/fallback decided
            ordered_bugs = []

        # Serialize bugs
        from bugs.serializers import BugSerializer  # Adjust import based on your app
        serializer = BugSerializer(ordered_bugs, many=True, context={'request': request})

        return Response({
            "results": serializer.data,
            "total": len(ordered_bugs),
            "query": query,
            "method": method,
        })

    # ============================================
    # Helper Methods (INDENTED INSIDE THE CLASS)
    # ============================================
    def _get_accessible_bugs(self, user, project_id=None):
        """Get bugs user can access based on their role"""
        try:
            # Get bugs based on role
            if user.role == 'manager':
                projects = Project.objects.filter(created_by=user)
                if project_id:
                    projects = projects.filter(id=project_id)
                bugs = Bug.objects.filter(project__in=projects)
                
            elif user.role == 'qa':
                projects = user.projects.all()
                if project_id:
                    projects = projects.filter(id=project_id)
                bugs = Bug.objects.filter(project__in=projects)
                
            elif user.role == 'developer':
                bugs = Bug.objects.filter(assigned_to=user)
                if project_id:
                    bugs = bugs.filter(project_id=project_id)
            else:
                return Bug.objects.none()
            
            # Filter out gibberish bugs
            # Only show bugs with meaningful content
            bugs = bugs.filter(
                title__length__gte=3,
                description__length__gte=5
            )
            
            # Also filter out common gibberish patterns
            valid_bugs = []
            for bug in bugs:
                if self._is_meaningful_bug(bug):
                    valid_bugs.append(bug)
            
            return valid_bugs
            
        except Exception as e:
            print(f"Error getting accessible bugs: {e}")
            return []

    def _is_meaningful_bug(self, bug) -> bool:
        """Check if a bug has meaningful content"""
        import re
        
        title = bug.title.strip()
        description = bug.description.strip() if bug.description else ""
        
        # Check minimum length
        if len(title) < 3 or len(description) < 5:
            return False
        
        # Check if it's random letters (gibberish)
        alpha_chars = sum(c.isalpha() for c in title)
        if alpha_chars > 0:
            alpha_ratio = alpha_chars / len(title)
            has_vowels = any(c in 'aeiouAEIOU' for c in title)
            
            # If it's mostly letters but has no vowels, it's gibberish
            if alpha_ratio > 0.6 and not has_vowels and len(title) > 3:
                return False
        
        # Check for common gibberish patterns
        gibberish_patterns = [
            r'^[a-z]{4,}$',      # All lowercase, no spaces, 4+ chars
            r'^[A-Z]{4,}$',      # All uppercase, no spaces, 4+ chars
            r'^[a-zA-Z]{5,}$',   # Only letters, no spaces, 5+ chars
            r'^[a-z]{3,}[0-9]*$', # Letters with optional numbers, no spaces
        ]
        
        for pattern in gibberish_patterns:
            if re.match(pattern, title):
                return False
        
        return True
    





class ChatMessageView(APIView):
    """
    POST /api/ai/chat/
    body: {"message": "...", "conversation_id": "<optional, omit to start new>"}
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        message = request.data.get("message", "").strip()
        conversation_id = request.data.get("conversation_id")

        if not message:
            return Response({"detail": "Message is required."}, status=400)

        user = request.user

        # Get or create conversation
        if conversation_id:
            conversation, _ = ChatConversation.objects.get_or_create(
                id=conversation_id, user=user
            )
        else:
            conversation = ChatConversation.objects.create(user=user)

        # Save user message
        ChatMessage.objects.create(conversation=conversation, role="user", content=message)

        # Gather context based on user's role/permissions -- same
        # visibility rules used everywhere else in the app
        if user.role == "manager":
            bugs = Bug.objects.filter(project__created_by=user)
        elif user.role == "qa":
            project_ids = ProjectMember.objects.filter(user=user).values_list("project_id", flat=True)
            bugs = Bug.objects.filter(project_id__in=project_ids)
        elif user.role == "developer":
            bugs = Bug.objects.filter(assigned_to=user)
        else:
            bugs = Bug.objects.none()

        bugs = bugs.select_related("project", "assigned_to")[:50]  # cap context size

        context_lines = []
        for bug in bugs:
            assignee = bug.assigned_to.full_name if bug.assigned_to else "Unassigned"
            context_lines.append(
                f"- [{bug.project.name}] {bug.title} | type: {bug.type} | "
                f"status: {bug.status} | priority: {bug.priority} | assigned to: {assignee}"
            )

        context_data = "\n".join(context_lines) if context_lines else "No bugs found."

        ai = AIService()
        reply = ai.answer_chat_message(message, context_data)

        # Save assistant reply
        ChatMessage.objects.create(conversation=conversation, role="assistant", content=reply)

        return Response({
            "conversation_id": str(conversation.id),
            "reply": reply,
        })


class ChatHistoryView(APIView):
    """GET /api/ai/chat/<conversation_id>/history/"""

    permission_classes = [IsAuthenticated]

    def get(self, request, conversation_id):
        try:
            conversation = ChatConversation.objects.get(id=conversation_id, user=request.user)
        except ChatConversation.DoesNotExist:
            return Response({"detail": "Conversation not found."}, status=404)

        messages = conversation.messages.all()
        return Response([
            {"role": m.role, "content": m.content, "created_at": m.created_at}
            for m in messages
        ])
    
class SuggestResolutionView(APIView):
    """
    GET /api/ai/suggest-resolution/<bug_id>/

    Developer or QA only. Finds similar RESOLVED/COMPLETED items
    (Bug or Feature, any project visible to the user) and asks the AI
    to suggest a resolution approach grounded in how those were
    actually fixed.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, bug_id):
        user = request.user

        if user.role not in ("developer", "qa"):
            return Response({"detail": "Not available for your role."}, status=403)

        # Fetch the target bug, scoped to what this user can see --
        # same visibility rules used everywhere else in the app.
        if user.role == "developer":
            visible_bugs = Bug.objects.filter(assigned_to=user)
        else:  # qa
            project_ids = ProjectMember.objects.filter(user=user).values_list("project_id", flat=True)
            visible_bugs = Bug.objects.filter(project_id__in=project_ids)

        try:
            bug = visible_bugs.get(id=bug_id)
        except Bug.DoesNotExist:
            return Response({"detail": "Bug not found."}, status=404)

        # Gather candidate "similar resolved items" -- across ALL
        # projects this user can see (not just this bug's project),
        # any type (bug or feature), status resolved/completed, and
        # with actual resolution notes written (an empty notes field
        # gives the AI nothing useful to learn from).
        if user.role == "developer":
            candidate_qs = Bug.objects.filter(assigned_to=user)
        else:
            project_ids = ProjectMember.objects.filter(user=user).values_list("project_id", flat=True)
            candidate_qs = Bug.objects.filter(project_id__in=project_ids)

        resolved_bugs = (
            candidate_qs
            .filter(status__in=[Bug.Status.RESOLVED, Bug.Status.COMPLETED])
            .exclude(id=bug.id)
            .exclude(resolution_notes="")
        )

        resolved_dicts = [
            {
                "id": str(b.id),
                "title": b.title,
                "description": b.description,
                "type": b.type,
                "resolution_notes": b.resolution_notes,
            }
            for b in resolved_bugs
        ]

        ai = AIService()
        result = ai.suggest_resolution(
            title=bug.title,
            description=bug.description,
            bug_type=bug.type,
            resolved_bugs=resolved_dicts,
        )

        return Response(result)