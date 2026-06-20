from rest_framework.permissions import BasePermission


class IsManager(BasePermission):
    message = "Only Managers can perform this action."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_manager


class IsQA(BasePermission):
    message = "Only QA can perform this action."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_qa


class IsDeveloper(BasePermission):
    message = "Only Developers can perform this action."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_developer
