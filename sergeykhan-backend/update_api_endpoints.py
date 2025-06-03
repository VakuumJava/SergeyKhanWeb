#!/usr/bin/env python3
"""
Script to update API endpoints to use new serializers for address field separation
"""

import re

def update_views_file():
    """Update views.py with new serializers"""
    views_file = '/Users/bekzhan/Documents/projects/soso/sergeykhan-backend/app1/api1/views.py'
    
    # Read the file
    with open(views_file, 'r') as f:
        content = f.read()
    
    # Update import statement
    content = re.sub(
        r'from \.serializers import \(\n\s*OrderSerializer,\n\s*CustomUserSerializer,\n\s*BalanceSerializer,\n\s*BalanceLogSerializer, CalendarEventSerializer, ContactSerializer,\n\s*OrderLogSerializer, TransactionLogSerializer, OrderDetailSerializer\n\)',
        '''from .serializers import (
    OrderSerializer,
    CustomUserSerializer,
    BalanceSerializer,
    BalanceLogSerializer, CalendarEventSerializer, ContactSerializer,
    OrderLogSerializer, TransactionLogSerializer, OrderDetailSerializer,
    OrderPublicSerializer
)''',
        content,
        flags=re.MULTILINE
    )
    
    # Update get_master_available_orders - first occurrence only
    pattern = r'(def get_master_available_orders\(request\):.*?)(\n\s+serializer = OrderSerializer\(orders, many=True\))'
    replacement = r'\1\n    # Use OrderPublicSerializer to hide private info (apartment/entrance/phone)\n    serializer = OrderPublicSerializer(orders, many=True)'
    content = re.sub(pattern, replacement, content, count=1, flags=re.DOTALL)
    
    # Update get_assigned_orders - first occurrence only
    pattern = r'(def get_assigned_orders\(request\):.*?assigned_master=request\.user\))(\n\s+serializer = OrderSerializer\(orders, many=True\))'
    replacement = r'\1\n    # Use OrderDetailSerializer to show full address and details for taken orders\n    serializer = OrderDetailSerializer(orders, many=True)'
    content = re.sub(pattern, replacement, content, count=1, flags=re.DOTALL)
    
    # Update get_orders_by_master - first occurrence only  
    pattern = r'(def get_orders_by_master\(request, master_id\):.*?assigned_master=master\))(\n\s+serializer = OrderSerializer\(orders, many=True\))'
    replacement = r'\1\n    # Use OrderDetailSerializer to show full address and details for taken orders\n    serializer = OrderDetailSerializer(orders, many=True)'
    content = re.sub(pattern, replacement, content, count=1, flags=re.DOTALL)
    
    # Write back the file
    with open(views_file, 'w') as f:
        f.write(content)
    
    print("✅ Updated views.py API endpoints")

if __name__ == "__main__":
    update_views_file()
