from django.urls import path
from .views import (
    ImproveBugReportView,
    AICategorizeBugView,
    SemanticSearchView,
    ChatMessageView,
    ChatHistoryView,
    SuggestResolutionView,
)

urlpatterns = [
    path("improve-report", ImproveBugReportView.as_view(), name="improve-report"),
    path("categorize/", AICategorizeBugView.as_view(), name="ai-categorize"),
    path("semantic-search/", SemanticSearchView.as_view(), name="semantic-search"),
    path("chat/", ChatMessageView.as_view(), name="chat-message"),
    path("chat/<uuid:conversation_id>/history/", ChatHistoryView.as_view(), name="chat-history"),
    path("suggest-resolution/<uuid:bug_id>/", SuggestResolutionView.as_view(), name="suggest-resolution"),
]