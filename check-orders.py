#!/usr/bin/env python3
"""
Скрипт для проверки состояния заказов
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://127.0.0.1:8001"

def login():
    """Логин для получения токена"""
    login_data = {
        "email": "test_master@completion.com",
        "password": "test123"
    }
    
    print("🔑 Авторизуемся...")
    response = requests.post(f"{BASE_URL}/login/", json=login_data)
    
    if response.status_code == 200:
        token = response.json().get('token', '')[:20] + "..."
        print(f"✅ Авторизация успешна, токен: {token}")
        return response.json()['token']
    else:
        print(f"❌ Ошибка авторизации: {response.status_code}")
        print(f"Ответ: {response.text}")
        return None

def get_master_orders(token):
    """Получаем заказы мастера"""
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    print("📋 Получаем заказы мастера...")
    response = requests.get(f"{BASE_URL}/master/orders/", headers=headers)
    
    if response.status_code == 200:
        orders = response.json()
        print(f"✅ Найдено заказов: {len(orders)}")
        
        for order in orders:
            print(f"📄 Заказ ID: {order['id']}")
            print(f"   Статус: {order['status']}")
            print(f"   Назначен мастеру: {'Да' if order.get('assigned_master') else 'Нет'}")
            print(f"   Есть завершение: {'Да' if order.get('completion') else 'Нет'}")
            print()
        
        return orders
    else:
        print(f"❌ Ошибка получения заказов: {response.status_code}")
        print(f"Ответ: {response.text}")
        return []

def create_test_order(token):
    """Создаем тестовый заказ"""
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    order_data = {
        "contact_name": "Тестовый клиент",
        "contact_phone": "+77771234567",
        "address": "Тестовый адрес",
        "description": "Тестовый заказ для завершения",
        "urgency": "обычный",
        "status": "назначен"
    }
    
    print("🆕 Создаем тестовый заказ...")
    response = requests.post(f"{BASE_URL}/orders/", json=order_data, headers=headers)
    
    if response.status_code == 201:
        order = response.json()
        print(f"✅ Создан заказ ID: {order['id']}")
        return order
    else:
        print(f"❌ Ошибка создания заказа: {response.status_code}")
        print(f"Ответ: {response.text}")
        return None

if __name__ == "__main__":
    token = login()
    if token:
        print("\n" + "="*50)
        orders = get_master_orders(token)
        
        # Ищем подходящий заказ или создаем новый
        suitable_orders = [o for o in orders if o['status'] in ['назначен', 'выполняется'] and not o.get('completion')]
        
        if suitable_orders:
            print(f"🎯 Подходящих заказов для завершения: {len(suitable_orders)}")
            for order in suitable_orders:
                print(f"   Заказ ID: {order['id']} (статус: {order['status']})")
        else:
            print("⚠️  Нет подходящих заказов. Попробуем создать новый...")
            new_order = create_test_order(token)
