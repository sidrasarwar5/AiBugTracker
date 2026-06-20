from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .serializers import EmailTokenObtainPairSerializer
from .views import MeView, SignupView
from rest_framework_simplejwt.views import TokenObtainPairView


class EmailTokenObtainPairView(TokenObtainPairView):
    """POST /api/auth/login/  body: {email, password} -> {access, refresh, user}"""

    serializer_class = EmailTokenObtainPairSerializer


urlpatterns = [
    path("signup/", SignupView.as_view(), name="signup"),
    path("login/", EmailTokenObtainPairView.as_view(), name="login"),
    path("login/refresh/", TokenRefreshView.as_view(), name="login_refresh"),
    path("me/", MeView.as_view(), name="me"),
]
