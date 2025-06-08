#!/usr/bin/env python3
"""
Test script to verify that photo URLs are now properly returned for curator panel viewing.
Tests the photo URL fix in the serializers.
"""

import requests
import json

# Configuration
BASE_URL = "http://127.0.0.1:8000"
MASTER_EMAIL = "test_photo_master@example.com"
MASTER_PASSWORD = "test123"

def login_master():
    """Login as test master user"""
    print("🔐 Logging in as master...")
    response = requests.post(f"{BASE_URL}/login/", json={
        "email": MASTER_EMAIL,
        "password": MASTER_PASSWORD
    })
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Login successful! Response: {data}")
        # Check if it contains access token or session info
        token = data.get('access') or data.get('token') or data.get('user', {}).get('token')
        if token:
            print(f"Access token: {token[:20]}...")
            return token
        else:
            print("❌ No access token found in response")
            return None
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(f"Response: {response.text}")
        return None

def get_completed_orders_with_photos(token):
    """Get completed orders that have photos to verify URL format"""
    print("\n📋 Fetching completed orders with photos...")
    headers = {"Authorization": f"Token {token}"}  # Use Token instead of Bearer
    
    # Get all orders
    response = requests.get(f"{BASE_URL}/api/orders/all/", headers=headers)
    
    if response.status_code == 200:
        orders = response.json()
        print(f"✅ Found {len(orders)} total orders")
        
        # Filter completed orders with photos
        completed_with_photos = []
        for order in orders:
            if order.get('completion') and order['completion'].get('completion_photos'):
                completed_with_photos.append(order)
                print(f"\n📸 Order {order['id']} - Completed with photos:")
                print(f"   Status: {order['status']}")
                print(f"   Completion ID: {order['completion']['id']}")
                print(f"   Photos count: {len(order['completion']['completion_photos'])}")
                
                # Check photo URL format
                for i, photo in enumerate(order['completion']['completion_photos']):
                    print(f"   Photo {i+1}: {photo}")
                    
                    # Verify it's a full URL (should start with http)
                    if photo.startswith('http'):
                        print(f"     ✅ Full URL format detected")
                    else:
                        print(f"     ❌ Relative path detected - needs fixing")
        
        return completed_with_photos
    else:
        print(f"❌ Failed to get orders: {response.status_code}")
        print(f"Response: {response.text}")
        return []

def test_order_detail_view(token, order_id):
    """Test the order detail view to verify photo URLs"""
    print(f"\n🔍 Testing order detail view for order {order_id}...")
    headers = {"Authorization": f"Token {token}"}  # Use Token instead of Bearer
    
    response = requests.get(f"{BASE_URL}/api/orders/{order_id}/detail/", headers=headers)
    
    if response.status_code == 200:
        order = response.json()
        print(f"✅ Order detail retrieved successfully")
        
        if order.get('completion') and order['completion'].get('completion_photos'):
            print(f"📸 Order has {len(order['completion']['completion_photos'])} photos:")
            for i, photo in enumerate(order['completion']['completion_photos']):
                print(f"   Photo {i+1}: {photo}")
                
                # Test if the URL is accessible
                try:
                    photo_response = requests.head(photo, timeout=5)
                    if photo_response.status_code == 200:
                        print(f"     ✅ Photo URL is accessible")
                    else:
                        print(f"     ❌ Photo URL returned {photo_response.status_code}")
                except requests.RequestException as e:
                    print(f"     ❌ Photo URL not accessible: {e}")
        else:
            print("❌ No completion photos found in order detail")
    else:
        print(f"❌ Failed to get order detail: {response.status_code}")
        print(f"Response: {response.text}")

def main():
    print("🧪 Testing Photo URL Functionality for Curator Panel")
    print("="*50)
    
    # Login
    token = login_master()
    if not token:
        return
    
    # Get completed orders with photos
    completed_orders = get_completed_orders_with_photos(token)
    
    if completed_orders:
        # Test order detail view for the first completed order with photos
        test_order_detail_view(token, completed_orders[0]['id'])
        
        print(f"\n📊 Summary:")
        print(f"   Found {len(completed_orders)} completed orders with photos")
        print(f"   Photo URL format should now include full HTTP URLs")
        print(f"   This allows curator panel to properly display images")
    else:
        print("\n❌ No completed orders with photos found")
        print("   You may need to complete some test orders with photos first")

if __name__ == "__main__":
    main()
