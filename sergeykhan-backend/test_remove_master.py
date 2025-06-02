#!/usr/bin/env python3
"""
Test script for the new remove_master endpoint
"""
import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"

def test_remove_master_endpoint():
    """Test the remove_master endpoint"""
    
    print("Testing remove_master endpoint...")
    
    # First, let's get a list of orders to find one with an assigned master
    print("\n1. Getting orders list...")
    try:
        response = requests.get(f"{API_URL}/orders/")
        if response.status_code == 200:
            orders = response.json()
            print(f"Found {len(orders)} orders")
            
            # Find an order with assigned master
            order_with_master = None
            for order in orders:
                if order.get('assigned_master'):
                    order_with_master = order
                    break
            
            if order_with_master:
                print(f"Found order with assigned master: Order #{order_with_master['id']}")
                print(f"Assigned master: {order_with_master['assigned_master']}")
                
                # Test the remove endpoint (this will fail without authentication, but we can see if the endpoint exists)
                print(f"\n2. Testing remove endpoint for order #{order_with_master['id']}...")
                remove_response = requests.patch(f"{API_URL}/assign/{order_with_master['id']}/remove/")
                print(f"Response status: {remove_response.status_code}")
                print(f"Response text: {remove_response.text}")
                
                if remove_response.status_code == 401:
                    print("✅ Endpoint exists but requires authentication (expected)")
                elif remove_response.status_code == 404:
                    print("❌ Endpoint not found - there might be an issue with URL routing")
                else:
                    print(f"Unexpected response: {remove_response.status_code}")
            else:
                print("No orders with assigned masters found")
        else:
            print(f"Failed to get orders: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to the server. Make sure Django is running on localhost:8000")
    except Exception as e:
        print(f"❌ Error: {e}")

    # Test if the endpoint structure is correct
    print("\n3. Testing endpoint URL structure...")
    try:
        # This should return 401 (unauthorized) if endpoint exists, 404 if it doesn't
        response = requests.patch(f"{API_URL}/assign/999/remove/")
        if response.status_code == 401:
            print("✅ remove_master endpoint is accessible (returns 401 - needs authentication)")
        elif response.status_code == 404:
            print("❌ remove_master endpoint not found (404 error)")
        else:
            print(f"Endpoint response: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error testing endpoint: {e}")

if __name__ == "__main__":
    test_remove_master_endpoint()
