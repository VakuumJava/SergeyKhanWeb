#!/usr/bin/env python3
"""
Script to test completion review endpoint with our dynamic percentage distribution fix
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def login_user(email, password):
    """Login and get token"""
    login_data = {
        "email": email,
        "password": password
    }
    
    print(f"🔑 Logging in as {email}...")
    response = requests.post(f"{BASE_URL}/login/", json=login_data)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Login successful")
        return data.get('access_token')
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(f"Response: {response.text}")
        return None

def get_completions(token):
    """Get all completions"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("📋 Getting completions...")
    response = requests.get(f"{BASE_URL}/api/completions/", headers=headers)
    
    if response.status_code == 200:
        completions = response.json()
        print(f"✅ Found {len(completions)} completions")
        return completions
    else:
        print(f"❌ Failed to get completions: {response.status_code}")
        print(f"Response: {response.text}")
        return []

def create_test_completion(token):
    """Create a test completion"""
    headers = {"Authorization": f"Bearer {token}"}
    
    # First get an order to complete
    print("📦 Getting orders...")
    response = requests.get(f"{BASE_URL}/api/orders/", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Failed to get orders: {response.status_code}")
        return None
    
    orders = response.json()
    if not orders:
        print("❌ No orders found")
        return None
    
    # Find an order that can be completed
    order = orders[0]  # Use first order
    print(f"📦 Using order ID: {order['id']}")
    
    # Create completion data
    completion_data = {
        "actual_cost": 1000.0,
        "time_spent": 120,
        "completion_notes": "Test completion for dynamic percentage distribution",
        "photo_urls": ["http://example.com/test1.jpg", "http://example.com/test2.jpg"]
    }
    
    print(f"🏗️ Creating completion for order {order['id']}...")
    response = requests.post(
        f"{BASE_URL}/api/orders/{order['id']}/complete/",
        json=completion_data,
        headers=headers
    )
    
    if response.status_code == 201:
        completion = response.json()
        print(f"✅ Completion created with ID: {completion['id']}")
        return completion
    else:
        print(f"❌ Failed to create completion: {response.status_code}")
        print(f"Response: {response.text}")
        return None

def test_completion_review(token, completion_id):
    """Test the completion review endpoint with our fixes"""
    headers = {"Authorization": f"Bearer {token}"}
    
    review_data = {
        "status": "одобрен",
        "review_notes": "Testing dynamic percentage distribution system"
    }
    
    print(f"⚖️ Reviewing completion {completion_id}...")
    print(f"Review data: {json.dumps(review_data, indent=2)}")
    
    response = requests.post(
        f"{BASE_URL}/api/completions/{completion_id}/review/",
        json=review_data,
        headers=headers
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("✅ Review successful!")
        return response.json()
    else:
        print("❌ Review failed!")
        return None

def check_profit_distribution_settings(token):
    """Check current profit distribution settings"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("📊 Checking profit distribution settings...")
    response = requests.get(f"{BASE_URL}/api/profit-distribution/", headers=headers)
    
    if response.status_code == 200:
        settings = response.json()
        print("✅ Current settings:")
        print(f"Master percentage: {settings.get('master_percentage', 'N/A')}%")
        print(f"Curator percentage: {settings.get('curator_percentage', 'N/A')}%")
        print(f"Company percentage: {settings.get('company_percentage', 'N/A')}%")
        print(f"Platform percentage: {settings.get('platform_percentage', 'N/A')}%")
        return settings
    else:
        print(f"❌ Failed to get settings: {response.status_code}")
        print(f"Response: {response.text}")
        return None

def main():
    # Test with different users
    print("=== Testing Completion Review with Dynamic Percentage Distribution ===\n")
    
    # Try to login as curator (for reviewing)
    curator_token = login_user("curator@test.com", "test123")
    if not curator_token:
        curator_token = login_user("curator@gmail.com", "test123")
    
    if not curator_token:
        print("❌ Could not login as curator, trying admin...")
        admin_token = login_user("admin@gmail.com", "admin123")
        if not admin_token:
            admin_token = login_user("admin@admin.com", "admin123")
        
        if admin_token:
            curator_token = admin_token
        else:
            print("❌ Could not login as any user")
            return
    
    # Check profit distribution settings
    check_profit_distribution_settings(curator_token)
    
    # Get existing completions
    completions = get_completions(curator_token)
    
    if completions:
        # Find a pending completion or use the first one
        test_completion = None
        for comp in completions:
            if comp.get('status') == 'pending':
                test_completion = comp
                break
        
        if not test_completion:
            print("📝 No pending completions found, using first available...")
            test_completion = completions[0]
        
        print(f"🧪 Testing with completion ID: {test_completion['id']}")
        
        # Test the review endpoint
        result = test_completion_review(curator_token, test_completion['id'])
        
        if result:
            print(f"\n✅ Test completed successfully!")
            print(f"Final result: {json.dumps(result, indent=2)}")
        else:
            print(f"\n❌ Test failed!")
    else:
        print("❌ No completions found to test with")

if __name__ == "__main__":
    main()
