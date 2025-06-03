#!/usr/bin/env python3
import requests

print("🔍 Testing Master Workload Integration...")

# Test backend API
try:
    response = requests.get('http://127.0.0.1:8000/api/masters/workload/all/')
    print(f"Backend API status: {response.status_code}")
    if response.status_code == 401:
        print("✅ Backend API is working (requires authentication)")
    else:
        print(f"❌ Unexpected response: {response.text[:100]}")
except Exception as e:
    print(f"❌ Backend API error: {e}")

# Test frontend
try:
    response = requests.get('http://localhost:3000/', timeout=3)
    print(f"Frontend status: {response.status_code}")
    if response.status_code == 200:
        print("✅ Frontend is accessible")
    else:
        print(f"❌ Frontend error: {response.status_code}")
except Exception as e:
    print(f"❌ Frontend error: {e}")

print("\n✅ Integration test completed!")
print("🌐 Frontend: http://localhost:3000/master-workload/")
print("🔧 Backend: http://127.0.0.1:8000/api/masters/workload/all/")
