#!/usr/bin/env python3
"""
Test script for Order Completion Workflow
Tests the complete flow from master completion to curator approval and fund distribution
"""

import requests
import json
import django
import os
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app1.settings')
django.setup()

from api1.models import CustomUser, Order, Balance, OrderCompletion, FinancialTransaction

BASE_URL = 'http://127.0.0.1:8000'

def create_test_data():
    """Create test users and orders for testing"""
    print("=== Creating Test Data ===")
    
    # Clear existing test completion data
    OrderCompletion.objects.filter(order__id=1).delete()
    
    # Create custom users
    master, created = CustomUser.objects.get_or_create(
        email='master@test.com',
        defaults={
            'first_name': 'Test',
            'last_name': 'Master',
            'role': 'master'
        }
    )
    if created:
        master.set_password('testpass123')
        master.save()
    
    curator, created = CustomUser.objects.get_or_create(
        email='curator@test.com',
        defaults={
            'first_name': 'Test',
            'last_name': 'Curator',
            'role': 'curator'
        }
    )
    if created:
        curator.set_password('testpass123')
        curator.save()
    
    # Create balance for master
    Balance.objects.get_or_create(
        user=master,
        defaults={'amount': 0, 'paid_amount': 0}
    )
    
    # Create balance for curator
    Balance.objects.get_or_create(
        user=curator,
        defaults={'amount': 0, 'paid_amount': 0}
    )
    
    # Create test order
    order, created = Order.objects.get_or_create(
        id=1,
        defaults={
            'client_name': 'Test Client',
            'client_phone': '+77777777779',
            'description': 'Разбитый экран iPhone 12',
            'status': 'выполняется',
            'assigned_master': master,
            'curator': curator
        }
    )
    
    # Ensure the order is assigned to the master if it already exists
    if not created:
        order.assigned_master = master
        order.status = 'выполняется'
        order.curator = curator
        order.save()
    elif order.assigned_master != master:
        order.assigned_master = master
        order.status = 'выполняется'
        order.curator = curator
        order.save()
    
    print(f"Created/Found Master: {master.first_name} {master.last_name}")
    print(f"Created/Found Curator: {curator.first_name} {curator.last_name}")
    print(f"Created/Found Order: {order.id} - {order.description}")
    
    return master, curator, order

def get_auth_token(email, password):
    """Get authentication token for user"""
    response = requests.post(f'{BASE_URL}/login/', {
        'email': email,
        'password': password
    })
    
    if response.status_code == 200:
        data = response.json()
        return data.get('token')
    else:
        print(f"Failed to get token for {email}: {response.status_code} - {response.text}")
        return None

def test_master_completion(master_token, order_id):
    """Test master completing an order"""
    print("\n=== Testing Master Order Completion ===")
    
    completion_data = {
        'order': order_id,
        'work_description': 'Заменен экран iPhone 12. Проведена диагностика, замена дисплейного модуля, проверка всех функций.',
        'completion_photos': [
            'photo1.jpg',
            'photo2.jpg',
            'photo3.jpg'
        ],
        'parts_expenses': 15000,
        'transport_costs': 2000,
        'total_received': 25000,
        'completion_date': '2025-06-03'
    }
    
    headers = {'Authorization': f'Token {master_token}'}
    
    response = requests.post(
        f'{BASE_URL}/api/orders/{order_id}/complete/',
        json=completion_data,
        headers=headers
    )
    
    print(f"Master completion response: {response.status_code}")
    print(f"Response data: {response.text}")
    
    if response.status_code == 201:
        completion = response.json()
        print(f"✅ Order completion created successfully!")
        print(f"   Total expenses: {completion['total_expenses']} ₸")
        print(f"   Net profit: {completion['net_profit']} ₸")
        return completion['id']
    else:
        print(f"❌ Failed to create completion")
        return None

def test_curator_review(curator_token, completion_id):
    """Test curator reviewing and approving completion"""
    print("\n=== Testing Curator Review ===")
    
    # First, get pending completions
    headers = {'Authorization': f'Token {curator_token}'}
    
    response = requests.get(
        f'{BASE_URL}/api/completions/pending/',
        headers=headers
    )
    
    print(f"Pending completions response: {response.status_code}")
    print(f"Pending completions: {response.text}")
    
    # Now approve the completion
    review_data = {
        'status': 'одобрен',
        'curator_notes': 'Работа выполнена качественно. Все фотографии предоставлены. Расходы обоснованы.'
    }
    
    response = requests.post(
        f'{BASE_URL}/api/completions/{completion_id}/review/',
        json=review_data,
        headers=headers
    )
    
    print(f"Curator review response: {response.status_code}")
    print(f"Review data: {response.text}")
    
    if response.status_code == 200:
        print("✅ Completion approved successfully!")
        return True
    else:
        print("❌ Failed to approve completion")
        return False

def check_financial_transactions():
    """Check if financial transactions were created correctly"""
    print("\n=== Checking Financial Transactions ===")
    
    transactions = FinancialTransaction.objects.all()
    print(f"Total transactions created: {transactions.count()}")
    
    for transaction in transactions:
        print(f"  - {transaction.transaction_type}: {transaction.amount} ₸ for {transaction.user.email}")
        print(f"    Description: {transaction.description}")
    
    # Check balances
    print("\n=== Checking Balances ===")
    balances = Balance.objects.all()
    for balance in balances:
        print(f"  - {balance.user.email}: Current: {balance.amount} ₸, Paid: {balance.paid_amount} ₸")

def main():
    """Main test function"""
    print("🧪 Starting Order Completion Workflow Test")
    
    # Create test data
    master, curator, order = create_test_data()
    
    # Get authentication tokens
    print("\n=== Getting Authentication Tokens ===")
    master_token = get_auth_token('master@test.com', 'testpass123')
    curator_token = get_auth_token('curator@test.com', 'testpass123')
    
    if not master_token or not curator_token:
        print("❌ Failed to get authentication tokens")
        return
    
    print(f"✅ Got tokens for master and curator")
    
    # Test master completion
    completion_id = test_master_completion(master_token, order.id)
    
    if not completion_id:
        print("❌ Test failed at master completion step")
        return
    
    # Test curator review
    success = test_curator_review(curator_token, completion_id)
    
    if not success:
        print("❌ Test failed at curator review step")
        return
    
    # Check financial transactions
    check_financial_transactions()
    
    print("\n🎉 Order Completion Workflow Test Completed Successfully!")

if __name__ == '__main__':
    main()
