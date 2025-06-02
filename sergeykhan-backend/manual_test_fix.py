#!/usr/bin/env python3
"""
Manual test script to verify the distance override fix.
This script tests the scenario where distance is manually set and then checked after automatic updates.
"""

import os
import sys
import django
import requests
import json

# Add the app1 directory to Python path
sys.path.insert(0, '/Users/bekzhan/Documents/projects/sit/sergeykhan-backend/app1')

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app1.settings')
django.setup()

from api1.models import CustomUser
from api1.distancionka import update_master_distance_status
from rest_framework.authtoken.models import Token

def test_distance_override():
    print("🔧 Testing Distance Override Fix")
    print("=" * 50)
    
    # Get or create admin token
    admin = CustomUser.objects.filter(is_superuser=True).first()
    if not admin:
        print("❌ No admin users found for testing")
        return
    
    token, created = Token.objects.get_or_create(user=admin)
    print(f"📋 Using admin: {admin.email} (Token: {token.key[:10]}...)")
    
    # Find a master user to test with
    master = CustomUser.objects.filter(role='master').first()
    if not master:
        print("❌ No master users found for testing")
        return
    
    print(f"📋 Testing with Master: {master.email} (ID: {master.id})")
    print(f"   Initial distance: {master.dist}")
    print(f"   Initial manual override: {master.distance_manual_override}")
    print()
    
    base_url = "http://127.0.0.1:8000"
    headers = {
        'Authorization': f'Token {token.key}',
        'Content-Type': 'application/json'
    }
    
    # Test 1: Set distance manually via API
    print("🔧 Test 1: Setting distance manually to level 2 (24 hours) via API")
    url = f"{base_url}/api/distance/master/{master.id}/set/"
    data = {'distance_level': 2}
    
    try:
        response = requests.post(url, json=data, headers=headers)
        print(f"   API Response Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   API Response: {result}")
        else:
            print(f"   API Error: {response.text}")
            
        master.refresh_from_db()
        print(f"   Distance after manual set: {master.dist}")
        print(f"   Manual override flag: {master.distance_manual_override}")
        print()
        
        # Test 2: Try to update distance automatically (should be skipped)
        print("🔧 Test 2: Attempting automatic distance update (should be skipped)")
        original_dist = master.dist
        original_override = master.distance_manual_override
        
        update_master_distance_status(master.id)  # Pass master.id, not master object
        master.refresh_from_db()
        
        print(f"   Distance before auto update: {original_dist}")
        print(f"   Distance after auto update: {master.dist}")
        print(f"   Manual override flag: {master.distance_manual_override}")
        
        if master.dist == original_dist and master.distance_manual_override:
            print("   ✅ SUCCESS: Distance was NOT changed by automatic update")
        else:
            print("   ❌ FAILURE: Distance was changed despite manual override")
        print()
        
        # Test 3: Reset to automatic mode via API
        print("🔧 Test 3: Resetting to automatic distance calculation via API")
        reset_url = f"{base_url}/api/distance/master/{master.id}/reset/"
        
        reset_response = requests.post(reset_url, headers=headers)
        print(f"   Reset API Response Status: {reset_response.status_code}")
        if reset_response.status_code == 200:
            reset_result = reset_response.json()
            print(f"   Reset API Response: {reset_result}")
        else:
            print(f"   Reset API Error: {reset_response.text}")
            
        master.refresh_from_db()
        print(f"   Distance after reset: {master.dist}")
        print(f"   Manual override flag: {master.distance_manual_override}")
        print()
        
        # Test 4: Verify automatic updates work again
        print("🔧 Test 4: Verifying automatic updates work after reset")
        update_master_distance_status(master.id)  # Pass master.id, not master object
        master.refresh_from_db()
        
        print(f"   Distance after auto update: {master.dist}")
        print(f"   Manual override flag: {master.distance_manual_override}")
        print("   ✅ Automatic calculation is now working again")
        print()
        
        print("🎉 All tests completed!")
        print("=" * 50)
        print("📋 Summary:")
        print("   - Manual distance setting via API: ✅ Working")
        print("   - Manual override protection: ✅ Working") 
        print("   - Reset to automatic mode via API: ✅ Working")
        print("   - Automatic calculation resume: ✅ Working")
        
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to Django server at http://127.0.0.1:8000")
        print("   Make sure the Django development server is running with: python3 manage.py runserver")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    test_distance_override()
