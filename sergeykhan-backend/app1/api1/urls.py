from django.urls import path
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from django.http import JsonResponse
from .models import CustomUser
from .serializers import CustomUserSerializer

def api_status(request):
    return JsonResponse({"status": "OK"})

@csrf_exempt
@require_http_methods(["POST"])
def create_user_simple(request):
    try:
        data = json.loads(request.body)
        serializer = CustomUserSerializer(data=data)
        if serializer.is_valid():
            user = serializer.save()
            return JsonResponse({
                "id": user.id,
                "email": user.email,
                "role": user.role
            }, status=201)
        return JsonResponse(serializer.errors, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

urlpatterns = [
    path("status/", api_status, name="api_status"),
    path("api/users/create/", create_user_simple, name="create_user"),
]
