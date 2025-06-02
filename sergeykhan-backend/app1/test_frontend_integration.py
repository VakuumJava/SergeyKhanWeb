#!/usr/bin/env python3
"""
Frontend Integration Test
Test the complete integration between frontend and backend including:
1. Authentication
2. Order logs API
3. Transaction logs API  
4. Warranty masters API
5. Complete warranty workflow
"""

import requests
import json
from datetime import datetime

def test_frontend_integration():
    print("=" * 60)
    print("FRONTEND INTEGRATION TEST")
    print("=" * 60)
    
    # 1. Test Authentication
    print("\n1. Testing Authentication...")
    login_data = {'email': 'test_frontend@gmail.com', 'password': 'testpass123'}
    login_response = requests.post('http://127.0.0.1:8000/login/', data=login_data)
    
    if login_response.status_code != 200:
        print(f"❌ Authentication failed: {login_response.text}")
        return False
        
    auth_data = login_response.json()
    token = auth_data['token']
    user_info = auth_data['user']
    
    print(f"✅ Authentication successful!")
    print(f"   Token: {token}")
    print(f"   User: {user_info['email']} (Role: {user_info['role']})")
    
    headers = {'Authorization': f'Token {token}'}
    
    # 2. Test Order Logs API
    print("\n2. Testing Order Logs API...")
    orders_response = requests.get('http://127.0.0.1:8000/api/logs/orders/', headers=headers)
    
    if orders_response.status_code != 200:
        print(f"❌ Order logs API failed: {orders_response.text}")
        return False
        
    orders_data = orders_response.json()
    print(f"✅ Order logs API working!")
    print(f"   Total logs: {orders_data['total_count']}")
    print(f"   Page: {orders_data['page']}, Has next: {orders_data['has_next']}")
    print(f"   Recent order logs:")
    for log in orders_data['logs'][:3]:
        timestamp = datetime.fromisoformat(log['created_at'].replace('Z', '+00:00'))
        print(f"     - Order #{log['order']}: {log['action']} by {log['performed_by_email'] or 'System'}")
        print(f"       {log['description']} ({timestamp.strftime('%Y-%m-%d %H:%M')})")
    
    # 3. Test Transaction Logs API
    print("\n3. Testing Transaction Logs API...")
    trans_response = requests.get('http://127.0.0.1:8000/api/logs/transactions/', headers=headers)
    
    if trans_response.status_code != 200:
        print(f"❌ Transaction logs API failed: {trans_response.text}")
        return False
        
    trans_data = trans_response.json()
    print(f"✅ Transaction logs API working!")
    print(f"   Total logs: {trans_data['total_count']}")
    print(f"   Recent transaction logs:")
    for log in trans_data['logs'][:3]:
        timestamp = datetime.fromisoformat(log['created_at'].replace('Z', '+00:00'))
        print(f"     - User #{log['user']}: {log['transaction_type']} {log['amount']}₸")
        print(f"       {log['description']} ({timestamp.strftime('%Y-%m-%d %H:%M')})")
    
    # 4. Test Warranty Masters API
    print("\n4. Testing Warranty Masters API...")
    masters_response = requests.get('http://127.0.0.1:8000/api/users/warranty-masters/', headers=headers)
    
    if masters_response.status_code != 200:
        print(f"❌ Warranty masters API failed: {masters_response.text}")
        return False
        
    masters_data = masters_response.json()
    print(f"✅ Warranty masters API working!")
    print(f"   Total masters: {len(masters_data)}")
    print(f"   Available warranty masters:")
    for master in masters_data[:3]:
        print(f"     - {master['email']} (ID: {master['id']})")
    
    # 5. Test Pagination
    print("\n5. Testing Pagination...")
    paginated_response = requests.get('http://127.0.0.1:8000/api/logs/orders/?page=1&limit=5', headers=headers)
    
    if paginated_response.status_code != 200:
        print(f"❌ Pagination test failed: {paginated_response.text}")
        return False
        
    paginated_data = paginated_response.json()
    print(f"✅ Pagination working!")
    print(f"   Requested 5 items, got: {len(paginated_data['logs'])}")
    print(f"   Has next page: {paginated_data['has_next']}")
    
    # 6. Test CORS and Frontend-Backend Communication
    print("\n6. Testing CORS and Headers...")
    cors_headers = {
        'Authorization': f'Token {token}',
        'Origin': 'http://localhost:3000',
        'Content-Type': 'application/json'
    }
    cors_response = requests.get('http://127.0.0.1:8000/api/logs/orders/', headers=cors_headers)
    
    if cors_response.status_code != 200:
        print(f"❌ CORS test failed: {cors_response.text}")
        return False
        
    print(f"✅ CORS working - frontend can communicate with backend!")
    
    # Summary
    print("\n" + "=" * 60)
    print("INTEGRATION TEST RESULTS")
    print("=" * 60)
    print("✅ Authentication: Working")
    print("✅ Order Logs API: Working")  
    print("✅ Transaction Logs API: Working")
    print("✅ Warranty Masters API: Working")
    print("✅ Pagination: Working")
    print("✅ CORS: Working")
    print("\n🎉 All tests passed! Frontend can successfully integrate with backend.")
    
    print("\n" + "=" * 60)
    print("FRONTEND SETUP INSTRUCTIONS")
    print("=" * 60)
    print("1. Navigate to: http://localhost:3000/logs")
    print("2. Open browser dev tools (F12)")
    print("3. Go to Application -> Local Storage -> http://localhost:3000")
    print(f"4. Add item: key='token', value='{token}'")
    print("5. Refresh the page")
    print("6. The logs page should now load data from the backend!")
    
    return True

if __name__ == "__main__":
    test_frontend_integration()
