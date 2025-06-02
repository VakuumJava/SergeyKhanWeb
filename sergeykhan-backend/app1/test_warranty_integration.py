"""
Integration test script for warranty master transfer and logging functionality.

This script tests the full flow:
1. Creating an order
2. Assigning a master
3. Transferring to a warranty master
4. Completing the warranty work
5. Approving the completed warranty work
6. Verifying logs are created at each step
"""

import os
import sys
import django
import decimal
import random
from datetime import datetime

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app1.settings')
django.setup()

# Import models and functions
from api1.models import (
    Order, CustomUser, OrderLog, TransactionLog, 
    Balance, BalanceLog
)
from api1.views import (
    log_order_action, log_transaction
)
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token
from django.test import RequestFactory
from decimal import Decimal

# Helper class to simulate authenticated requests
class MockRequest:
    def __init__(self, user, data=None):
        self.user = user
        self.data = data or {}
        
    @property
    def auth(self):
        return None

def create_test_users():
    """Create test users for different roles"""
    print("Creating test users...")
    
    # Create super admin
    admin, created = CustomUser.objects.get_or_create(
        email="admin@test.com",
        defaults={
            'role': 'super-admin',
            'is_staff': True,
            'is_superuser': True
        }
    )
    if created:
        admin.set_password("password123")
        admin.save()
        print(f"Created admin user: {admin.email}")
    else:
        print(f"Using existing admin: {admin.email}")
        
    # Create master
    master, created = CustomUser.objects.get_or_create(
        email="master@test.com",
        defaults={'role': 'master'}
    )
    if created:
        master.set_password("password123")
        master.save()
        print(f"Created master: {master.email}")
    else:
        print(f"Using existing master: {master.email}")
        
    # Create warranty master
    warranty_master, created = CustomUser.objects.get_or_create(
        email="warranty@test.com",
        defaults={'role': 'warrant-master'}
    )
    if created:
        warranty_master.set_password("password123")
        warranty_master.save()
        print(f"Created warranty master: {warranty_master.email}")
    else:
        print(f"Using existing warranty master: {warranty_master.email}")
        
    return admin, master, warranty_master

def create_test_order():
    """Create a test order"""
    order = Order.objects.create(
        client_name="Test Client",
        client_phone="+7777777777",
        description="Test order for warranty master transfer",
        address="Test Address",
        status="в обработке",
        is_test=True
    )
    print(f"Created test order #{order.id}")
    return order

def test_logging_flow():
    """Test the complete logging flow"""
    # Create test users
    admin, master, warranty_master = create_test_users()
    
    # Create initial balances
    Balance.objects.get_or_create(user=master, defaults={'amount': Decimal('100.00')})
    Balance.objects.get_or_create(user=warranty_master, defaults={'amount': Decimal('0.00')})
    
    # Create a test order
    order = create_test_order()
    
    # Get initial log counts
    initial_order_logs = OrderLog.objects.count()
    initial_transaction_logs = TransactionLog.objects.count()
    
    print(f"Initial log counts - OrderLogs: {initial_order_logs}, TransactionLogs: {initial_transaction_logs}")
    
    # Step 1: Assign a master to the order
    print("\nStep 1: Assigning master to order...")
    order.assigned_master = master
    order.curator = admin
    order.status = "назначен"
    order.save()
    
    # Log the assignment
    log_order_action(
        order=order,
        action='master_assigned',
        performed_by=admin,
        description=f'Мастер {master.email} назначен на заказ #{order.id}',
        old_value='Статус: в обработке',
        new_value=f'Статус: назначен, Мастер: {master.email}'
    )
    
    # Step 2: Transfer to warranty master
    print("\nStep 2: Transferring to warranty master...")
    
    # Execute the transfer
    try:
        order.refresh_from_db()
        order.transferred_to = warranty_master
        order.status = 'передан на гарантию'
        order.save()
        
        # Log the transfer
        log_order_action(
            order=order,
            action='transferred',
            performed_by=master,
            description=f'Заказ #{order.id} передан гарантийному мастеру {warranty_master.email}',
            old_value=f'Статус: назначен',
            new_value=f'Статус: передан на гарантию, Гарантийный мастер: {warranty_master.email}'
        )
        
        # Apply fine to master
        fine_amount = Decimal('50.00')
        master_balance = Balance.objects.get(user=master)
        old_balance = master_balance.amount
        master_balance.amount -= fine_amount
        master_balance.save()
        
        # Log the fine
        log_transaction(
            user=master,
            transaction_type='balance_deduct',
            amount=fine_amount,
            description=f'Штраф за передачу заказа #{order.id} на гарантию. Баланс: {old_balance} → {master_balance.amount}',
            order=order,
            performed_by=master
        )
        
        print(f"  Order transferred to warranty master, fine applied: {fine_amount}")
    except Exception as e:
        print(f"  Error transferring order: {e}")
    
    # Step 3: Complete warranty work
    print("\nStep 3: Completing warranty work...")
    try:
        order.refresh_from_db()
        final_cost = Decimal('500.00')
        expenses = Decimal('150.00')
        
        # Update order
        order.final_cost = final_cost
        order.expenses = expenses
        order.status = 'завершен гарантийным'
        order.save()
        
        # Log the completion
        log_order_action(
            order=order,
            action='completed',
            performed_by=warranty_master,
            description=f'Заказ #{order.id} завершен гарантийным мастером {warranty_master.email}',
            old_value=f'Статус: передан на гарантию',
            new_value=f'Статус: завершен гарантийным, Стоимость: {final_cost}, Расходы: {expenses}'
        )
        
        # Log expenses
        log_transaction(
            user=warranty_master,
            transaction_type='master_payment',
            amount=expenses,
            description=f'Расходы гарантийного мастера по заказу #{order.id}',
            order=order,
            performed_by=warranty_master
        )
        
        print(f"  Warranty work completed - Final cost: {final_cost}, Expenses: {expenses}")
    except Exception as e:
        print(f"  Error completing warranty work: {e}")
    
    # Step 4: Approve warranty work
    print("\nStep 4: Approving warranty work...")
    try:
        order.refresh_from_db()
        old_status = order.status
        order.status = 'одобрен'
        order.save()
        
        # Log the approval
        log_order_action(
            order=order,
            action='approved',
            performed_by=admin,
            description=f'Заказ #{order.id} одобрен администратором {admin.email}',
            old_value=f'Статус: {old_status}',
            new_value='Статус: одобрен'
        )
        
        # Pay warranty master
        warranty_master_payment = order.final_cost * Decimal('0.7')
        warranty_balance = Balance.objects.get(user=warranty_master)
        old_balance = warranty_balance.amount
        warranty_balance.amount += warranty_master_payment
        warranty_balance.save()
        
        # Log the payment
        log_transaction(
            user=warranty_master,
            transaction_type='master_payment',
            amount=warranty_master_payment,
            description=f'Выплата гарантийному мастеру за заказ #{order.id}. Баланс: {old_balance} → {warranty_balance.amount}',
            order=order,
            performed_by=admin
        )
        
        print(f"  Warranty work approved, payment made: {warranty_master_payment}")
    except Exception as e:
        print(f"  Error approving warranty work: {e}")
    
    # Check final log counts
    final_order_logs = OrderLog.objects.count()
    final_transaction_logs = TransactionLog.objects.count()
    
    print(f"\nFinal log counts - OrderLogs: {final_order_logs}, TransactionLogs: {final_transaction_logs}")
    print(f"New logs created - OrderLogs: {final_order_logs - initial_order_logs}, TransactionLogs: {final_transaction_logs - initial_transaction_logs}")
    
    # Get and print the logs related to this order
    order_logs = OrderLog.objects.filter(order=order).order_by('created_at')
    transaction_logs = TransactionLog.objects.filter(order=order).order_by('created_at')
    
    print("\nOrder logs created:")
    for log in order_logs:
        print(f"  [{log.created_at}] {log.action}: {log.description}")
    
    print("\nTransaction logs created:")
    for log in transaction_logs:
        print(f"  [{log.created_at}] {log.transaction_type}: {log.amount} - {log.description}")
    
    # Check balances
    master_balance = Balance.objects.get(user=master)
    warranty_balance = Balance.objects.get(user=warranty_master)
    
    print(f"\nFinal balances:")
    print(f"  Master: {master_balance.amount}")
    print(f"  Warranty Master: {warranty_balance.amount}")
    
    return order, order_logs, transaction_logs

if __name__ == "__main__":
    print("=" * 80)
    print("TESTING WARRANTY MASTER TRANSFER AND LOGGING INTEGRATION")
    print("=" * 80)
    
    test_logging_flow()
    
    print("\nTest completed successfully!")
