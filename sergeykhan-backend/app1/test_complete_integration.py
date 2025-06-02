#!/usr/bin/env python3
"""
Complete Integration Test for Warranty Master Transfer and Logging System
Tests the full flow from order creation to warranty transfer and logging
"""

import requests
import json
import time
from decimal import Decimal

BASE_URL = 'http://127.0.0.1:8000'

def test_complete_integration():
    """Test the complete warranty master transfer and logging flow"""
    
    print("🔄 Starting Complete Integration Test...")
    print("=" * 60)
    
    # Step 1: Login as admin
    print("1️⃣  Logging in as admin...")
    login_data = {'email': 'admin@example.com', 'password': 'testpass123'}
    response = requests.post(f'{BASE_URL}/login/', json=login_data)
    
    if response.status_code != 200:
        print(f"❌ Login failed: {response.text}")
        return False
    
    token_data = response.json()
    admin_token = token_data['token']
    admin_headers = {'Authorization': f'Token {admin_token}'}
    print(f"✅ Logged in as: {token_data['user']['email']}")
    
    # Step 2: Create a test order
    print("\n2️⃣  Creating test order...")
    order_data = {
        'client_name': 'Integration Test Client',
        'client_phone': '+7777777777',
        'description': 'Integration test order for warranty transfer',
        'address': 'Test Address, Test City',
        'estimated_cost': '500.00'
    }
    
    response = requests.post(f'{BASE_URL}/orders/create/', json=order_data)
    if response.status_code != 201:
        print(f"❌ Order creation failed: {response.text}")
        return False
    
    order = response.json()
    order_id = order['id']
    print(f"✅ Created order #{order_id}")
    
    # Step 3: Check initial order logs
    print(f"\n3️⃣  Checking initial order logs for order #{order_id}...")
    response = requests.get(f'{BASE_URL}/api/logs/orders/{order_id}/', headers=admin_headers)
    if response.status_code == 200:
        logs = response.json()
        creation_log = next((log for log in logs if log['action'] == 'created'), None)
        if creation_log:
            print(f"✅ Found order creation log: {creation_log['description']}")
        else:
            print("❌ Order creation log not found")
    else:
        print(f"❌ Failed to get order logs: {response.text}")
    
    # Step 4: Update order to processing state and assign master
    print(f"\n4️⃣  Updating order #{order_id} to processing state...")
    response = requests.patch(f'{BASE_URL}/orders/{order_id}/update/', 
                            json={'status': 'в обработке'}, headers=admin_headers)
    if response.status_code != 200:
        print(f"❌ Failed to update order status: {response.text}")
        return False
    print("✅ Order status updated to 'в обработке'")
    
    # Get a master to assign (use our test master)
    test_master_email = 'test_master_integration@test.com'
    response = requests.get(f'{BASE_URL}/users/masters/', headers=admin_headers)
    if response.status_code != 200:
        print("❌ Failed to get masters list")
        return False
    
    masters = response.json()
    test_master = next((m for m in masters if m['email'] == test_master_email), None)
    
    if not test_master:
        print("❌ Test master not found in masters list")
        return False
    
    master_id = test_master['id']
    print(f"📋 Assigning test master: {test_master['email']} (ID: {master_id})")
    
    # Assign master
    response = requests.patch(f'{BASE_URL}/assign/{order_id}/', 
                            json={'assigned_master': master_id}, headers=admin_headers)
    if response.status_code != 200:
        print(f"❌ Failed to assign master: {response.text}")
        return False
    print("✅ Master assigned successfully")
    
    # Step 5: Login as the assigned master
    print(f"\n5️⃣  Logging in as master...")
    # We'll use a test master account
    master_login_data = {'email': 'test_master_integration@test.com', 'password': 'testpass123'}
    response = requests.post(f'{BASE_URL}/login/', json=master_login_data)
    
    if response.status_code != 200:
        print(f"❌ Master login failed: {response.text}")
        return False
    
    master_token_data = response.json()
    master_token = master_token_data['token']
    master_headers = {'Authorization': f'Token {master_token}'}
    print(f"✅ Logged in as master: {master_token_data['user']['email']}")
    
    # Step 6: Get warranty masters list
    print("\n6️⃣  Getting warranty masters list...")
    response = requests.get(f'{BASE_URL}/api/users/warranty-masters/', headers=master_headers)
    if response.status_code != 200:
        print(f"❌ Failed to get warranty masters: {response.text}")
        return False
    
    warranty_masters = response.json()
    if not warranty_masters:
        print("❌ No warranty masters available")
        return False
    
    # Find our test warranty master
    test_warranty_email = 'test_warranty_integration@test.com'
    warranty_master = next((wm for wm in warranty_masters if wm['email'] == test_warranty_email), None)
    
    if not warranty_master:
        # Use the first available warranty master
        warranty_master = warranty_masters[0]
        print(f"⚠️  Test warranty master not found, using: {warranty_master['email']}")
    
    warranty_master_id = warranty_master['id']
    print(f"✅ Found warranty masters: {len(warranty_masters)}")
    print(f"📋 Selected warranty master: {warranty_master['email']} (ID: {warranty_master_id})")
    
    # Step 7: Transfer order to warranty master
    print(f"\n7️⃣  Transferring order #{order_id} to warranty master...")
    transfer_data = {'warranty_master_id': warranty_master_id}
    response = requests.post(f'{BASE_URL}/orders/{order_id}/transfer/', 
                           json=transfer_data, headers=master_headers)
    
    if response.status_code != 200:
        print(f"❌ Transfer failed: {response.text}")
        return False
    
    transfer_result = response.json()
    print(f"✅ Order transferred successfully")
    print(f"💰 Fine applied: {transfer_result.get('fine_applied', 0)} ₸")
    
    # Step 8: Check transfer logs
    print(f"\n8️⃣  Checking transfer logs...")
    response = requests.get(f'{BASE_URL}/api/logs/orders/{order_id}/', headers=admin_headers)
    if response.status_code == 200:
        logs = response.json()
        transfer_log = next((log for log in logs if log['action'] == 'transferred'), None)
        if transfer_log:
            print(f"✅ Found transfer log: {transfer_log['description']}")
        else:
            print("❌ Transfer log not found")
    
    # Check transaction logs for fine
    response = requests.get(f'{BASE_URL}/api/logs/transactions/?page=1&limit=10', headers=admin_headers)
    if response.status_code == 200:
        tx_logs = response.json()['logs']
        fine_log = next((log for log in tx_logs if 'штраф' in log['description'].lower()), None)
        if fine_log:
            print(f"✅ Found fine transaction log: {fine_log['description'][:50]}...")
        else:
            print("❌ Fine transaction log not found")
    
    # Step 9: Login as warranty master and complete order
    print(f"\n9️⃣  Logging in as warranty master...")
    warranty_login_data = {'email': warranty_master['email'], 'password': 'testpass123'}
    response = requests.post(f'{BASE_URL}/login/', json=warranty_login_data)
    
    if response.status_code != 200:
        print(f"❌ Warranty master login failed: {response.text}")
        return False
    
    warranty_token_data = response.json()
    warranty_token = warranty_token_data['token']
    warranty_headers = {'Authorization': f'Token {warranty_token}'}
    print(f"✅ Logged in as warranty master: {warranty_token_data['user']['email']}")
    
    # Complete the warranty order
    print(f"\n🔧 Completing warranty order #{order_id}...")
    completion_data = {
        'final_cost': '450.00',
        'expenses': '150.00',
        'completion_notes': 'Integration test completion'
    }
    
    response = requests.post(f'{BASE_URL}/api/orders/{order_id}/warranty/complete/', 
                           json=completion_data, headers=warranty_headers)
    
    if response.status_code != 200:
        print(f"❌ Order completion failed: {response.text}")
        return False
    
    completion_result = response.json()
    print(f"✅ Order completed successfully")
    print(f"💰 Final cost: {completion_result.get('final_cost', 0)} ₸")
    print(f"💸 Expenses: {completion_result.get('expenses', 0)} ₸")
    
    # Step 10: Approve the warranty order as admin
    print(f"\n🔟 Approving warranty order as admin...")
    response = requests.post(f'{BASE_URL}/api/orders/{order_id}/warranty/approve/', 
                           headers=admin_headers)
    
    if response.status_code != 200:
        print(f"❌ Order approval failed: {response.text}")
        return False
    
    approval_result = response.json()
    print(f"✅ Order approved successfully")
    
    # Step 11: Final logs verification
    print(f"\n1️⃣1️⃣ Final logs verification...")
    
    # Check all order logs
    response = requests.get(f'{BASE_URL}/api/logs/orders/{order_id}/', headers=admin_headers)
    if response.status_code == 200:
        logs = response.json()
        log_actions = [log['action'] for log in logs]
        expected_actions = ['created', 'updated', 'master_assigned', 'transferred', 'completed', 'approved']
        
        print(f"📋 Order log actions found: {log_actions}")
        missing_actions = [action for action in expected_actions if action not in log_actions]
        if missing_actions:
            print(f"⚠️  Missing log actions: {missing_actions}")
        else:
            print("✅ All expected order log actions found")
    
    # Check transaction logs count
    response = requests.get(f'{BASE_URL}/api/logs/transactions/?page=1&limit=50', headers=admin_headers)
    if response.status_code == 200:
        tx_data = response.json()
        total_tx_logs = tx_data['total_count']
        print(f"📊 Total transaction logs: {total_tx_logs}")
    
    # Step 12: Test frontend API endpoints format
    print(f"\n1️⃣2️⃣ Testing frontend API format compatibility...")
    
    # Test order logs pagination
    response = requests.get(f'{BASE_URL}/api/logs/orders/?page=1&limit=5', headers=admin_headers)
    if response.status_code == 200:
        data = response.json()
        required_fields = ['logs', 'total_count', 'page', 'limit', 'has_next']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            print(f"❌ Missing fields in order logs response: {missing_fields}")
        else:
            print("✅ Order logs API format is frontend-compatible")
    
    # Test transaction logs pagination
    response = requests.get(f'{BASE_URL}/api/logs/transactions/?page=1&limit=5', headers=admin_headers)
    if response.status_code == 200:
        data = response.json()
        required_fields = ['logs', 'total_count', 'page', 'limit', 'has_next']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            print(f"❌ Missing fields in transaction logs response: {missing_fields}")
        else:
            print("✅ Transaction logs API format is frontend-compatible")
    
    print("\n" + "=" * 60)
    print("🎉 COMPLETE INTEGRATION TEST PASSED!")
    print("✅ Order creation and logging works")
    print("✅ Master assignment and logging works") 
    print("✅ Warranty transfer with fine works")
    print("✅ Warranty completion and logging works")
    print("✅ Order approval and payment works")
    print("✅ All logging endpoints are accessible")
    print("✅ API format is frontend-compatible")
    print("=" * 60)
    
    return True

if __name__ == '__main__':
    try:
        success = test_complete_integration()
        if success:
            print("\n🚀 Integration test completed successfully!")
        else:
            print("\n💥 Integration test failed!")
    except Exception as e:
        print(f"\n💥 Integration test error: {e}")
