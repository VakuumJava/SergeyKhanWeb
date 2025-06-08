#!/usr/bin/env python3
"""
Create a test curator user for testing
"""

import os
import sys
import django

# Add the Django project to the path
sys.path.append('/Users/bekzhan/Documents/projects/soso/sergeykhan-backend/app1')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app1.settings')
django.setup()

from api1.models import CustomUser

def create_test_curator():
    """Create a test curator user"""
    
    # Check if curator already exists
    if CustomUser.objects.filter(email='test_curator@example.com').exists():
        print("✅ Test curator already exists")
        return True
    
    try:
        # Create test curator
        curator = CustomUser.objects.create_user(
            email='test_curator@example.com',
            password='test123',
            role='curator',
            first_name='Test',
            last_name='Curator'
        )
        
        print(f"✅ Created test curator: {curator.email}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to create test curator: {e}")
        return False

if __name__ == "__main__":
    create_test_curator()
