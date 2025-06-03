#!/usr/bin/env python3
"""
Complete integration test for Master Workload functionality
Tests the complete flow from API to frontend communication
"""

import os
import sys
import django
import requests
import json
from datetime import datetime, date, time

# Setup Django
sys.path.append('/Users/bekzhan/Documents/projects/soso/sergeykhan-backend/app1')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app1.settings')
django.setup()

from django.contrib.auth import get_user_model
from api1.models import MasterAvailability

User = get_user_model()

def test_api_endpoints():
    """Test all master workload API endpoints"""
    print("🔍 Testing Master Workload API Endpoints...")
    
    # Create test user and get token
    try:
        curator_user, created = User.objects.get_or_create(
            email='test_curator@example.com',
            defaults={
                'role': 'curator',
                'first_name': 'Test',
                'last_name': 'Curator'
            }
        )
        if created:
            curator_user.set_password('testpass')
            curator_user.save()
            print(f"✅ Created test curator: {curator_user.email}")
        else:
            print(f"✅ Using existing curator: {curator_user.email}")
            
        # Create test master
        master_user, created = User.objects.get_or_create(
            email='test_master@example.com',
            defaults={
                'role': 'master',
                'first_name': 'Test',
                'last_name': 'Master'
            }
        )
        if created:
            master_user.set_password('testpass')
            master_user.save()
            print(f"✅ Created test master: {master_user.email}")
        else:
            print(f"✅ Using existing master: {master_user.email}")
            
    except Exception as e:
        print(f"❌ Error creating test users: {e}")
        return False
    
    # Test login to get token
    try:
        login_response = requests.post('http://127.0.0.1:8000/login/', {
            'email': 'test_curator@example.com',
            'password': 'testpass'
        })
        
        if login_response.status_code == 200:
            token = login_response.json().get('token')
            print(f"✅ Login successful, got token")
        else:
            print(f"❌ Login failed: {login_response.status_code} - {login_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Login error: {e}")
        return False
    
    headers = {'Authorization': f'Token {token}'}
    
    # Test API endpoints
    endpoints_to_test = [
        {
            'url': 'http://127.0.0.1:8000/api/masters/workload/all/',
            'method': 'GET',
            'description': 'Get all masters workload'
        },
        {
            'url': f'http://127.0.0.1:8000/api/masters/{master_user.id}/workload/',
            'method': 'GET', 
            'description': f'Get workload for master {master_user.id}'
        },
        {
            'url': f'http://127.0.0.1:8000/api/masters/{master_user.id}/availability/',
            'method': 'GET',
            'description': f'Get availability for master {master_user.id}'
        },
        {
            'url': 'http://127.0.0.1:8000/api/orders/validate-scheduling/',
            'method': 'POST',
            'description': 'Validate order scheduling',
            'data': {
                'master_id': master_user.id,
                'scheduled_date': str(date.today()),
                'scheduled_time': '10:00'
            }
        }
    ]
    
    success_count = 0
    total_count = len(endpoints_to_test)
    
    for endpoint in endpoints_to_test:
        try:
            if endpoint['method'] == 'GET':
                response = requests.get(endpoint['url'], headers=headers)
            elif endpoint['method'] == 'POST':
                response = requests.post(endpoint['url'], 
                                       headers=headers, 
                                       json=endpoint.get('data'))
            
            if response.status_code in [200, 201]:
                print(f"✅ {endpoint['description']}: {response.status_code}")
                success_count += 1
            else:
                print(f"❌ {endpoint['description']}: {response.status_code} - {response.text[:100]}")
                
        except Exception as e:
            print(f"❌ {endpoint['description']}: Error - {e}")
    
    print(f"\n📊 API Test Results: {success_count}/{total_count} endpoints working")
    return success_count == total_count

def test_frontend_urls():
    """Test if frontend is accessible"""
    print("\n🌐 Testing Frontend URLs...")
    
    frontend_urls = [
        'http://localhost:3000/',
        'http://localhost:3000/master-workload/',
        'http://localhost:3000/scheduled-orders/create/'
    ]
    
    success_count = 0
    
    for url in frontend_urls:
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print(f"✅ Frontend accessible: {url}")
                success_count += 1
            else:
                print(f"❌ Frontend error: {url} - {response.status_code}")
        except Exception as e:
            print(f"❌ Frontend unreachable: {url} - {e}")
    
    print(f"\n📊 Frontend Test Results: {success_count}/{len(frontend_urls)} URLs accessible")
    return success_count > 0

def create_sample_data():
    """Create sample availability data for testing"""
    print("\n📊 Creating sample availability data...")
    
    try:
        master_user = User.objects.get(email='test_master@example.com')
        
        # Create sample availability slots
        sample_slots = [
            {
                'date': date.today(),
                'start_time': time(9, 0),
                'end_time': time(12, 0)
            },
            {
                'date': date.today(),
                'start_time': time(14, 0),
                'end_time': time(18, 0)
            }
        ]
        
        created_count = 0
        for slot in sample_slots:
            availability, created = MasterAvailability.objects.get_or_create(
                master=master_user,
                date=slot['date'],
                start_time=slot['start_time'],
                defaults={'end_time': slot['end_time']}
            )
            if created:
                created_count += 1
                print(f"✅ Created availability: {slot['date']} {slot['start_time']}-{slot['end_time']}")
        
        print(f"📊 Created {created_count} new availability slots")
        return True
        
    except Exception as e:
        print(f"❌ Error creating sample data: {e}")
        return False

def main():
    """Run complete integration test"""
    print("🚀 Starting Master Workload Complete Integration Test")
    print("=" * 60)
    
    # Test database and create sample data
    sample_data_ok = create_sample_data()
    
    # Test API endpoints
    api_ok = test_api_endpoints()
    
    # Test frontend
    frontend_ok = test_frontend_urls()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 INTEGRATION TEST SUMMARY")
    print("=" * 60)
    print(f"Sample Data: {'✅ OK' if sample_data_ok else '❌ FAILED'}")
    print(f"Backend API: {'✅ OK' if api_ok else '❌ FAILED'}")
    print(f"Frontend:    {'✅ OK' if frontend_ok else '❌ FAILED'}")
    
    if api_ok and frontend_ok:
        print("\n🎉 INTEGRATION TEST PASSED!")
        print("Master Workload feature is ready for use.")
        print("\nNext steps:")
        print("1. Open http://localhost:3000/master-workload/ to view master workload table")
        print("2. Open http://localhost:3000/scheduled-orders/create/ to create scheduled orders")
        print("3. Login as curator to access the features")
    else:
        print("\n❌ INTEGRATION TEST FAILED!")
        print("Please check the issues above.")
    
    return api_ok and frontend_ok

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
