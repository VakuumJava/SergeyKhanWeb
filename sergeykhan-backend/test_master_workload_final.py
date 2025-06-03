#!/usr/bin/env python3
"""
Final End-to-End Test for Master Workload Schedule Feature
Tests the complete functionality including authentication, CRUD operations, and validation
"""

import os
import sys
import django
import requests
import json
from datetime import datetime, timedelta

# Setup Django
sys.path.append('/Users/bekzhan/Documents/projects/soso/sergeykhan-backend/app1')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app1.settings')
django.setup()

from django.test import TestCase
from django.contrib.auth.models import User
from api1.models import CustomUser, MasterAvailability, Order
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token

class MasterWorkloadEndToEndTest:
    def __init__(self):
        self.api_client = APIClient()
        self.base_url = 'http://localhost:8000'
        self.curator_token = None
        self.master_user = None
        
    def setup_test_data(self):
        """Create test users and authentication tokens"""
        print("🔧 Setting up test data...")
        
        # Create curator user
        curator = CustomUser.objects.create_user(
            username='test_curator',
            email='curator@test.com',
            password='testpass123',
            user_type='curator',
            first_name='Test',
            last_name='Curator'
        )
        
        # Create master user
        self.master_user = CustomUser.objects.create_user(
            username='test_master',
            email='master@test.com',
            password='testpass123',
            user_type='master',
            first_name='Test',
            last_name='Master'
        )
        
        # Create tokens
        curator_token, _ = Token.objects.get_or_create(user=curator)
        self.curator_token = curator_token.key
        
        print(f"✅ Created curator with token: {self.curator_token[:10]}...")
        print(f"✅ Created master user: {self.master_user.username}")
        
    def test_authentication(self):
        """Test API authentication"""
        print("\n🔐 Testing authentication...")
        
        headers = {'Authorization': f'Token {self.curator_token}'}
        response = requests.get(f'{self.base_url}/api/masters/workload/all/', headers=headers)
        
        if response.status_code == 200:
            print("✅ Authentication successful")
            return True
        else:
            print(f"❌ Authentication failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    def test_create_master_availability(self):
        """Test creating master availability slots"""
        print("\n📅 Testing master availability creation...")
        
        headers = {
            'Authorization': f'Token {self.curator_token}',
            'Content-Type': 'application/json'
        }
        
        # Create availability slot for today + 1 day
        tomorrow = datetime.now().date() + timedelta(days=1)
        availability_data = {
            'master': self.master_user.id,
            'date': tomorrow.isoformat(),
            'start_time': '09:00:00',
            'end_time': '17:00:00'
        }
        
        response = requests.post(
            f'{self.base_url}/api/masters/availability/',
            headers=headers,
            data=json.dumps(availability_data)
        )
        
        if response.status_code == 201:
            print("✅ Master availability created successfully")
            return response.json()
        else:
            print(f"❌ Failed to create availability: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    def test_get_master_workload(self):
        """Test retrieving master workload data"""
        print("\n📊 Testing master workload retrieval...")
        
        headers = {'Authorization': f'Token {self.curator_token}'}
        response = requests.get(
            f'{self.base_url}/api/masters/workload/{self.master_user.id}/',
            headers=headers
        )
        
        if response.status_code == 200:
            workload_data = response.json()
            print("✅ Master workload retrieved successfully")
            print(f"   Availability slots: {len(workload_data.get('availability', []))}")
            print(f"   Orders: {len(workload_data.get('orders', []))}")
            return workload_data
        else:
            print(f"❌ Failed to get workload: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    def test_all_masters_workload(self):
        """Test retrieving all masters workload summary"""
        print("\n👥 Testing all masters workload summary...")
        
        headers = {'Authorization': f'Token {self.curator_token}'}
        response = requests.get(f'{self.base_url}/api/masters/workload/all/', headers=headers)
        
        if response.status_code == 200:
            all_workload = response.json()
            print("✅ All masters workload retrieved successfully")
            print(f"   Total masters: {len(all_workload)}")
            for master_data in all_workload:
                print(f"   - {master_data['master_name']}: {master_data['total_availability_slots']} slots, {master_data['total_orders']} orders")
            return all_workload
        else:
            print(f"❌ Failed to get all masters workload: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    def test_order_scheduling_validation(self):
        """Test order scheduling validation"""
        print("\n⏰ Testing order scheduling validation...")
        
        headers = {
            'Authorization': f'Token {self.curator_token}',
            'Content-Type': 'application/json'
        }
        
        # Test valid scheduling (within availability)
        tomorrow = datetime.now().date() + timedelta(days=1)
        validation_data = {
            'master_id': self.master_user.id,
            'scheduled_date': tomorrow.isoformat(),
            'scheduled_time': '10:00:00'
        }
        
        response = requests.post(
            f'{self.base_url}/api/orders/validate-scheduling/',
            headers=headers,
            data=json.dumps(validation_data)
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('valid'):
                print("✅ Valid scheduling validated successfully")
            else:
                print("⚠️  Scheduling marked as invalid (expected if no availability)")
                print(f"   Reason: {result.get('message')}")
            return result
        else:
            print(f"❌ Failed to validate scheduling: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    def cleanup(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        try:
            # Delete created objects
            MasterAvailability.objects.filter(master=self.master_user).delete()
            Order.objects.filter(master=self.master_user).delete()
            CustomUser.objects.filter(username__startswith='test_').delete()
            print("✅ Cleanup completed")
        except Exception as e:
            print(f"⚠️  Cleanup warning: {e}")
            
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Master Workload End-to-End Tests")
        print("=" * 50)
        
        try:
            # Setup
            self.setup_test_data()
            
            # Test sequence
            auth_success = self.test_authentication()
            if not auth_success:
                print("❌ Authentication failed, stopping tests")
                return False
                
            availability = self.test_create_master_availability()
            workload = self.test_get_master_workload()
            all_workload = self.test_all_masters_workload()
            validation = self.test_order_scheduling_validation()
            
            # Summary
            print("\n" + "=" * 50)
            print("📋 TEST SUMMARY")
            print("=" * 50)
            print(f"✅ Authentication: {'PASS' if auth_success else 'FAIL'}")
            print(f"✅ Create Availability: {'PASS' if availability else 'FAIL'}")
            print(f"✅ Get Master Workload: {'PASS' if workload else 'FAIL'}")
            print(f"✅ Get All Masters Workload: {'PASS' if all_workload else 'FAIL'}")
            print(f"✅ Order Scheduling Validation: {'PASS' if validation else 'FAIL'}")
            
            success_count = sum([
                bool(auth_success),
                bool(availability),
                bool(workload),
                bool(all_workload),
                bool(validation)
            ])
            
            print(f"\n🎯 Overall Result: {success_count}/5 tests passed")
            
            if success_count == 5:
                print("🎉 ALL TESTS PASSED! Master Workload feature is working correctly.")
                return True
            else:
                print("⚠️  Some tests failed. Check the output above for details.")
                return False
                
        except Exception as e:
            print(f"❌ Test execution failed: {e}")
            import traceback
            traceback.print_exc()
            return False
        finally:
            self.cleanup()

if __name__ == '__main__':
    print("Master Workload Schedule - End-to-End Test")
    print("Testing backend API endpoints and functionality")
    print()
    
    # Check if Django server is running
    try:
        response = requests.get('http://localhost:8000/api/', timeout=5)
        print("✅ Django server is running")
    except requests.exceptions.RequestException:
        print("❌ Django server is not running. Please start it with: python manage.py runserver")
        sys.exit(1)
    
    # Run tests
    tester = MasterWorkloadEndToEndTest()
    success = tester.run_all_tests()
    
    if success:
        print("\n🚀 Ready for frontend testing!")
        print("   Open: http://localhost:3002/master-workload")
        sys.exit(0)
    else:
        sys.exit(1)
