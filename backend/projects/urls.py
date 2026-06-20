from django.urls import path

from .views import AddMemberView, ProjectDetailView, ProjectListCreateView

urlpatterns = [
    path("", ProjectListCreateView.as_view(), name="project-list-create"),
    path("<uuid:pk>/", ProjectDetailView.as_view(), name="project-detail"),
    path("<uuid:project_id>/add-member/", AddMemberView.as_view(), name="project-add-member"),
]
