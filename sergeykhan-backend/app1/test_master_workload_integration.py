#!/usr/bin/env python3
"""
Integration test for master workload feature
Tests both backend API endpoints and frontend-backend integration
"""

import os
import sys
import django
import requests
import json
from datetime import datetime, date, time

# Add the current directory to the Python path
sys.path.append('/Users/bekzhan/Documents/projects/soso/sergeykhan-backend/app1')

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app1.settings')
django.setup()

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.authtoken.models import Token
from api1.models import Master, MasterAvailability, Order

class MasterWorkloadIntegrationTest:
    def __init__(self):
        self.base_url = "http://127.0.0.1:8000"
        self.token = None
        self.user = None
        self.master = None

    def setup_test_data(self):
        """Create test user, master, and get authentication token"""
        print("Setting up test data...")
        
        # Create test user with curator role
        self.user, created = User.objects.get_or_create(
            username='test_curator',
            defaults={
                'email': 'test@example.com',
                'first_name': 'Test',
                'last_name': 'Curator'
            }
        )
        
        # Create master user
        master_user, created = User.objects.get_or_create(
            username='test_master',
            defaults={
                'email': 'master@example.com',
                'first_name': 'Test',
                'last_name': 'Master'
            }
        )
        
        # Create Master instance
        self.master, created = Master.objects.get_or_create(
            user=master_user,
            defaults={
                'phone_number': '+1234567890',
                'role': 'master',
                'address': 'Test Address'
            }
        )
        
        # Create authentication token
        self.token, created = Token.objects.get_or_create(user=self.user)
        
        print(f"✓ Test user created: {self.user.username}")
        print(f"✓ Test master created: {self.master.user.username}")
        print(f"✓ Auth token: {self.token.key[:10]}...")

    def test_api_endpoints(self):
        """Test all master workload API endpoints"""
        print("\n=== Testing API Endpoints ===")
        
        headers = {
            'Authorization': f'Token {self.token.key}',
            'Content-Type': 'application/json'
        }
        
        # Test 1: Get all masters workload
        print("1. Testing GET /api/masters/workload/all/")
        response = requests.get(f"{self.base_url}/api/masters/workload/all/", headers=headers)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Response received with {len(data)} masters")
        else:
            print(f"   ✗ Error: {response.text}")
        
        # Test 2: Get master availability
        print(f"2. Testing GET /api/masters/{self.master.id}/availability/")
        response = requests.get(f"{self.base_url}/api/masters/{self.master.id}/availability/", headers=headers)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Response received with {len(data)} availability slots")
        else:
            print(f"   ✗ Error: {response.text}")
        
        # Test 3: Create availability slot
        print(f"3. Testing POST /api/masters/{self.master.id}/availability/")
        availability_data = {
            'date': str(date.today()),
            'start_time': '09:00:00',
            'end_time': '17:00:00'
        }
        response = requests.post(
            f"{self.base_url}/api/masters/{self.master.id}/availability/", 
            headers=headers,
            json=availability_data
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 201:
            data = response.json()
            availability_id = data.get('id')
            print(f"   ✓ Availability slot created with ID: {availability_id}")
            
            # Test 4: Get master workload (should show the created availability)
            print(f"4. Testing GET /api/masters/{self.master.id}/workload/")
            response = requests.get(f"{self.base_url}/api/masters/{self.master.id}/workload/", headers=headers)
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"   ✓ Workload data retrieved")
                print(f"   Available slots: {len(data.get('availability', []))}")
                print(f"   Scheduled orders: {len(data.get('scheduled_orders', []))}")
            else:
                print(f"   ✗ Error: {response.text}")
            
            # Test 5: Validate order scheduling
            print("5. Testing POST /api/orders/validate-scheduling/")
            validation_data = {
                'master_id': self.master.id,
                'scheduled_date': str(date.today()),
                'scheduled_time': '10:00:00'
            }
            response = requests.post(
                f"{self.base_url}/api/orders/validate-scheduling/", 
                headers=headers,
                json=validation_data
            )
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"   ✓ Validation successful: {data.get('valid', False)}")
            else:
                print(f"   ✗ Error: {response.text}")
        else:
            print(f"   ✗ Error creating availability: {response.text}")

    def test_frontend_urls(self):
        """Test that frontend URLs are accessible"""
        print("\n=== Testing Frontend URLs ===")
        
        frontend_urls = [
            "http://localhost:3005/master-workload",
            "http://localhost:3005/scheduled-orders/create"
        ]
        
        for url in frontend_urls:
            try:
                response = requests.get(url, timeout=5)
                print(f"✓ {url} - Status: {response.status_code}")
            except requests.exceptions.RequestException as e:
                print(f"✗ {url} - Error: {str(e)}")

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n=== Cleaning up test data ===")
        try:
            # Delete test availability slots
            MasterAvailability.objects.filter(master=self.master).delete()
            print("✓ Test availability slots deleted")
            
            # Don't delete users to avoid issues with foreign keys
            print("✓ Cleanup completed")
        except Exception as e:
            print(f"✗ Cleanup error: {str(e)}")

    def run_all_tests(self):
        """Run all integration tests"""
        print("🚀 Starting Master Workload Integration Tests")
        print("=" * 50)
        
        try:
            self.setup_test_data()
            self.test_api_endpoints()
            self.test_frontend_urls()
        finally:
            self.cleanup_test_data()
        
        print("\n" + "=" * 50)
        print("🎉 Integration tests completed!")

if __name__ == "__main__":
    test = MasterWorkloadIntegrationTest()
    test.run_all_tests()
