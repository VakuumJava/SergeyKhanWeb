#!/usr/bin/env python3
"""
Test script to verify that photo URL fix is working properly
"""

import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def test_order_with_photos():
    """Test getting an order that has completion photos"""
    
    # Get auth token for test master
    login_response = requests.post(f"{BASE_URL}/login/", {
        "email": "test_photo_master@example.com", 
        "password": "test123"
    })
    
    if login_response.status_code != 200:
        print("❌ Failed to login")
        return False
        
    token = login_response.json()['token']
    headers = {'Authorization': f'Token {token}'}
    
    print("✅ Successfully logged in as test master")
    
    # Get all orders to find one with completion
    print("\n📋 Testing get_all_orders with photo URLs...")
    response = requests.get(f"{BASE_URL}/api/orders/all/", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Failed to get orders: {response.status_code}")
        return False
    
    orders = response.json()
    print(f"✅ Retrieved {len(orders)} orders")
    
    # Find an order with completion photos
    order_with_photos = None
    for order in orders:
        if order.get('completion') and order['completion'].get('completion_photos'):
            order_with_photos = order
            break
    
    if not order_with_photos:
        print("❌ No orders found with completion photos")
        return False
    
    print(f"✅ Found order #{order_with_photos['id']} with completion photos")
    
    # Check photo URLs
    photos = order_with_photos['completion']['completion_photos']
    print(f"📸 Found {len(photos)} photos:")
    
    all_full_urls = True
    for i, photo in enumerate(photos, 1):
        print(f"  Photo {i}: {photo}")
        if not photo.startswith('http://'):
            print(f"    ❌ Photo {i} is not a full URL")
            all_full_urls = False
        else:
            print(f"    ✅ Photo {i} is a full URL")
    
    # Test get_order_detail endpoint
    print(f"\n🔍 Testing get_order_detail for order #{order_with_photos['id']}...")
    detail_response = requests.get(
        f"{BASE_URL}/api/orders/{order_with_photos['id']}/detail/", 
        headers=headers
    )
    
    if detail_response.status_code != 200:
        print(f"❌ Failed to get order detail: {detail_response.status_code}")
        return False
    
    detail_order = detail_response.json()
    if detail_order.get('completion') and detail_order['completion'].get('completion_photos'):
        detail_photos = detail_order['completion']['completion_photos']
        print(f"✅ Order detail has {len(detail_photos)} photos")
        
        for i, photo in enumerate(detail_photos, 1):
            print(f"  Detail Photo {i}: {photo}")
            if not photo.startswith('http://'):
                print(f"    ❌ Detail Photo {i} is not a full URL")
                all_full_urls = False
            else:
                print(f"    ✅ Detail Photo {i} is a full URL")
    
    # Test assigned orders endpoint
    print(f"\n👷 Testing get_assigned_orders...")
    assigned_response = requests.get(f"{BASE_URL}/orders/assigned/", headers=headers)
    
    if assigned_response.status_code == 200:
        assigned_orders = assigned_response.json()
        print(f"✅ Retrieved {len(assigned_orders)} assigned orders")
        
        for order in assigned_orders:
            if order.get('completion') and order['completion'].get('completion_photos'):
                photos = order['completion']['completion_photos']
                print(f"  Order #{order['id']} has {len(photos)} photos")
                for photo in photos:
                    if not photo.startswith('http://'):
                        all_full_urls = False
    
    return all_full_urls

def test_completion_endpoints():
    """Test completion-specific endpoints"""
    
    # Get auth token for test curator
    login_response = requests.post(f"{BASE_URL}/login/", {
        "email": "test_curator@example.com", 
        "password": "test123"
    })
    
    if login_response.status_code != 200:
        print("❌ Failed to login as curator")
        return False
        
    token = login_response.json()['token']
    headers = {'Authorization': f'Token {token}'}
    
    print("✅ Successfully logged in as test curator")
    
    # Test pending completions
    print("\n⏳ Testing get_pending_completions...")
    response = requests.get(f"{BASE_URL}/api/completions/pending/", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Failed to get pending completions: {response.status_code}")
        return False
    
    completions = response.json()
    print(f"✅ Retrieved {len(completions)} pending completions")
    
    all_full_urls = True
    for completion in completions:
        if completion.get('completion_photos'):
            photos = completion['completion_photos']
            print(f"  Completion #{completion['id']} has {len(photos)} photos")
            for photo in photos:
                if not photo.startswith('http://'):
                    print(f"    ❌ Photo is not a full URL: {photo}")
                    all_full_urls = False
    
    return all_full_urls

def main():
    print("🧪 Testing Photo URL Fix")
    print("=" * 50)
    
    success = True
    
    # Test order endpoints
    if not test_order_with_photos():
        success = False
    
    print("\n" + "=" * 50)
    
    # Test completion endpoints
    if not test_completion_endpoints():
        success = False
    
    print("\n" + "=" * 50)
    
    if success:
        print("🎉 ALL TESTS PASSED! Photo URLs are working correctly.")
        return 0
    else:
        print("❌ SOME TESTS FAILED! Photo URLs are not working properly.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
