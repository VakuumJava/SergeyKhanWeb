#!/usr/bin/env python3
"""
Script to populate separated address fields from existing address field
"""

import os
import sys
import django
import re

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app1.settings')
django.setup()

from api1.models import Order
from django.db import models

def parse_address(address_str):
    """
    Parse address string to extract street, house_number, apartment, entrance
    Examples:
    - "Московская 123, кв. 45, подъезд 2" 
    - "ул. Ленина д. 10 кв 5"
    - "Абая 55"
    """
    if not address_str:
        return {'street': '', 'house_number': '', 'apartment': '', 'entrance': ''}
    
    # Clean up the address
    address = address_str.strip()
    
    # Initialize result
    result = {'street': '', 'house_number': '', 'apartment': '', 'entrance': ''}
    
    # Remove common prefixes
    address = re.sub(r'^(ул\.|улица|пр\.|проспект|пл\.|площадь)\s*', '', address, flags=re.IGNORECASE)
    
    # Extract apartment info
    apt_match = re.search(r'кв\.?\s*(\d+)|квартира\s*(\d+)', address, re.IGNORECASE)
    if apt_match:
        result['apartment'] = apt_match.group(1) or apt_match.group(2)
        # Remove apartment info from address
        address = re.sub(r',?\s*(кв\.?\s*\d+|квартира\s*\d+)', '', address, flags=re.IGNORECASE)
    
    # Extract entrance info
    ent_match = re.search(r'подъезд\s*(\d+)|под\.\s*(\d+)', address, re.IGNORECASE)
    if ent_match:
        result['entrance'] = ent_match.group(1) or ent_match.group(2)
        # Remove entrance info from address
        address = re.sub(r',?\s*(подъезд\s*\d+|под\.\s*\d+)', '', address, flags=re.IGNORECASE)
    
    # Extract house number and street
    # Pattern: street + house number
    house_match = re.search(r'(.+?)\s+д\.?\s*(\d+[а-я]?)|(.+?)\s+(\d+[а-я]?)$', address.strip(), re.IGNORECASE)
    
    if house_match:
        if house_match.group(1) and house_match.group(2):
            result['street'] = house_match.group(1).strip()
            result['house_number'] = house_match.group(2)
        elif house_match.group(3) and house_match.group(4):
            result['street'] = house_match.group(3).strip()
            result['house_number'] = house_match.group(4)
    else:
        # If no house number found, treat entire string as street
        result['street'] = address.strip()
    
    # Clean up results
    for key in result:
        result[key] = result[key].strip(',. ')
    
    return result

def migrate_addresses():
    """Migrate existing addresses to separated fields"""
    orders = Order.objects.filter(
        models.Q(street='') | models.Q(street__isnull=True)
    ).exclude(
        models.Q(address='') | models.Q(address__isnull=True)
    )
    
    updated_count = 0
    
    for order in orders:
        if order.address:
            parsed = parse_address(order.address)
            
            order.street = parsed['street']
            order.house_number = parsed['house_number']
            order.apartment = parsed['apartment']
            order.entrance = parsed['entrance']
            
            order.save(update_fields=['street', 'house_number', 'apartment', 'entrance'])
            updated_count += 1
            
            print(f"Order {order.id}: '{order.address}' -> {parsed}")
    
    print(f"\n✅ Migrated {updated_count} orders")

if __name__ == "__main__":
    migrate_addresses()
