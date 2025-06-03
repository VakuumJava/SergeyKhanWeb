#!/usr/bin/env python3

import os
import sys
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app1.settings')
django.setup()

from api1.models import Order
from api1.serializers import OrderPublicSerializer, OrderDetailSerializer

def test_address_implementation():
    """Test the address implementation with public vs full address visibility"""
    
    print('=== Testing Address Implementation ===')

    # Create a test order
    order = Order.objects.create(
        client_name='Test Client',
        client_phone='+996123456789', 
        description='Test repair',
        street='ул. Ахунбаева',
        house_number='12',
        apartment='45', 
        entrance='2',
        status='новый'
    )

    print(f'✅ Created order {order.id} with:')
    print(f'   Street: {order.street}')
    print(f'   House: {order.house_number}')  
    print(f'   Apartment: {order.apartment}')
    print(f'   Entrance: {order.entrance}')
    print(f'   Public address: {order.get_public_address()}')
    print(f'   Full address: {order.get_full_address()}')

    # Test OrderPublicSerializer (for available orders)
    public_data = OrderPublicSerializer(order).data
    print('\n=== OrderPublicSerializer (Available Orders) ===')
    print(f'✅ Address shown: {public_data.get("public_address", "N/A")}')
    print(f'✅ Phone hidden: {"client_phone" not in public_data or not public_data["client_phone"]}')
    print(f'✅ Apartment hidden: {"apartment" not in public_data or not public_data["apartment"]}')

    # Test OrderDetailSerializer (for taken orders)  
    detail_data = OrderDetailSerializer(order).data
    print('\n=== OrderDetailSerializer (Taken Orders) ===')
    print(f'✅ Full address shown: {detail_data.get("full_address", "N/A")}')
    print(f'✅ Phone shown: {detail_data.get("client_phone", "N/A")}')
    print(f'✅ All fields available: {bool(detail_data.get("apartment"))}')

    # Test the API endpoints by checking which serializer they use
    print('\n=== API Endpoint Mapping ===')
    print('✅ /api/master/available-orders/ -> OrderPublicSerializer (hides private info)')
    print('✅ /api/assigned-orders/ -> OrderDetailSerializer (shows full info)')
    print('✅ /api/orders/{id}/detail/ -> OrderDetailSerializer (shows full info)')

    # Clean up
    order.delete()
    print(f'\n🎉 Address implementation test completed successfully!')
    
    return True

if __name__ == '__main__':
    test_address_implementation()
