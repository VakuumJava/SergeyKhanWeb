# Simple URLs configuration
from django.urls import path
from django.http import JsonResponse

def api_status(request):
    return JsonResponse({"status": "OK"})

urlpatterns = [
    path("status/", api_status, name="api_status"),
]
