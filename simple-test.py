#!/usr/bin/env python3
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

try:
    print("=== Testing Django Backend ===")
    
    # Test basic connection
    response = requests.get(f"{BASE_URL}/admin/")
    print(f"Admin page status: {response.status_code}")
    
    # Try login
    print("\n=== Testing Login ===")
    login_data = {"email": "test_api@example.com", "password": "test123"}
    response = requests.post(f"{BASE_URL}/login/", json=login_data)
    print(f"Login status: {response.status_code}")
    print(f"Login response: {response.text[:200]}")
    
    if response.status_code == 200:
        token = response.json().get('token')
        if token:
            print(f"✅ Got token: {token[:50]}...")
            
            # Test completions endpoint
            headers = {"Authorization": f"Token {token}"}
            response = requests.get(f"{BASE_URL}/api/completions/pending/", headers=headers)
            print(f"\nPending completions status: {response.status_code}")
            
            if response.status_code == 200:
                completions = response.json()
                print(f"Found {len(completions)} pending completions")
                
                if completions:
                    completion_id = completions[0]['id']
                    print(f"Testing review with completion ID: {completion_id}")
                    
                    # Test review endpoint
                    review_data = {
                        "action": "approve",
                        "review_notes": "Test review - testing dynamic percentage distribution"
                    }
                    
                    response = requests.post(
                        f"{BASE_URL}/api/completions/{completion_id}/review/",
                        json=review_data,
                        headers=headers
                    )
                    
                    print(f"Review status: {response.status_code}")
                    print(f"Review response: {response.text}")
                    
                    if response.status_code == 200:
                        print("✅ SUCCESS: Review endpoint working! Our 500 error fix works!")
                        
                        # Check if distribution was created
                        dist_response = requests.get(
                            f"{BASE_URL}/api/completions/{completion_id}/distribution/",
                            headers=headers
                        )
                        if dist_response.status_code == 200:
                            dist_data = dist_response.json()
                            print("\n📊 Distribution data:")
                            print(f"Master percentage: {dist_data.get('master_percentage', 'N/A')}%")
                            print(f"Curator percentage: {dist_data.get('curator_percentage', 'N/A')}%")
                            print(f"Company percentage: {dist_data.get('company_percentage', 'N/A')}%")
                            print(f"Platform percentage: {dist_data.get('platform_percentage', 'N/A')}%")
                    else:
                        print("❌ Review failed!")
                else:
                    print("No pending completions found, let's check all completions...")
                    # Try to get all completions for masters
                    response = requests.get(f"{BASE_URL}/api/completions/master/", headers=headers)
                    if response.status_code == 200:
                        all_completions = response.json()
                        print(f"Found {len(all_completions)} total completions for masters")
            else:
                print(f"Completions error: {response.text}")
        else:
            print("❌ No token received")
    else:
        print("❌ Login failed")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
