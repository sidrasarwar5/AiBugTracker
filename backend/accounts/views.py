from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Profile
from .serializers import ProfileSerializer, SignupSerializer


class SignupView(generics.CreateAPIView):
    """
    POST /api/auth/signup/
    Open to anyone. Creates the account immediately with whichever
    role was chosen on the dropdown. As per the spec: having an
    account does not grant project access -- that's a separate step
    a Manager does later.
    """

    queryset = Profile.objects.all()
    serializer_class = SignupSerializer
    permission_classes = [permissions.AllowAny]


class MeView(APIView):
    """
    GET /api/auth/me/
    Returns the logged-in user's own profile. Useful for the frontend
    to re-check role/identity on page refresh without re-decoding the
    JWT itself.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(ProfileSerializer(request.user).data)
