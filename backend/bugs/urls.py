from django.urls import path

from .views import (
    BugAssignView,
    BugDetailView,
    BugListCreateView,
    BugSearchView,
    BugStatusUpdateView,
    NotificationListView,
)

urlpatterns = [
    path("", BugListCreateView.as_view(), name="bug-list-create"),
    path("search/", BugSearchView.as_view(), name="bug-search"),
    path("<uuid:pk>/", BugDetailView.as_view(), name="bug-detail"),
    path("<uuid:bug_id>/assign/", BugAssignView.as_view(), name="bug-assign"),
    path("<uuid:pk>/status/", BugStatusUpdateView.as_view(), name="bug-status-update"),
]