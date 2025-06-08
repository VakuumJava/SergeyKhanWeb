#!/usr/bin/env python3

import requests
import json
from datetime import datetime

# Настройки
BASE_URL = "http://127.0.0.1:8000"
ADMIN_EMAIL = "admin@example.com"  # админ для создания заказа
ADMIN_PASSWORD = "admin123"
MASTER_EMAIL = "test_master@completion.com"  # наш тестовый мастер

def login_admin():
    """Авторизация админа"""
    login_data = {
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    }
    
    response = requests.post(f"{BASE_URL}/login/", json=login_data)
    if response.status_code == 200:
        token = response.json().get("token")
        print(f"✅ Авторизация админа успешна")
        return token
    else:
        print(f"❌ Ошибка авторизации админа: {response.status_code}")
        print(response.text)
        return None

def get_master_id(token):
    """Получаем ID мастера по email"""
    headers = {"Authorization": f"Token {token}"}
    
    # Попробуем получить всех пользователей и найти мастера
    response = requests.get(f"{BASE_URL}/api/users/", headers=headers)
    if response.status_code == 200:
        users = response.json()
        for user in users:
            if user.get('email') == MASTER_EMAIL:
                print(f"✅ Найден мастер: ID={user['id']}, email={user['email']}")
                return user['id']
    
    print(f"❌ Мастер с email {MASTER_EMAIL} не найден")
    return None

def create_test_order(token, master_id):
    """Создаем тестовый заказ"""
    headers = {"Authorization": f"Token {token}"}
    
    order_data = {
        "customer_name": "Тестовый клиент",
        "customer_phone": "+7777777777",
        "customer_email": "test@client.com",
        "device_type": "iPhone",
        "device_model": "iPhone 12",
        "problem_description": "Тестовая проблема для завершения",
        "estimated_cost": "1500.00",
        "assigned_master": master_id,
        "status": "выполняется"
    }
    
    response = requests.post(f"{BASE_URL}/api/orders/create/", headers=headers, json=order_data)
    if response.status_code == 201:
        order = response.json()
        order_id = order.get('id')
        print(f"✅ Создан тестовый заказ: ID={order_id}")
        print(f"   Статус: {order.get('status')}")
        print(f"   Мастер: {order.get('assigned_master_name')}")
        return order_id
    else:
        print(f"❌ Ошибка создания заказа: {response.status_code}")
        print(response.text)
        return None

if __name__ == "__main__":
    print("🏗️ Создание тестового заказа для завершения...")
    
    # Авторизация админа
    token = login_admin()
    if not token:
        exit(1)
    
    # Получаем ID мастера
    master_id = get_master_id(token)
    if not master_id:
        exit(1)
    
    # Создаем заказ
    order_id = create_test_order(token, master_id)
    if order_id:
        print(f"\n🎯 Новый тестовый заказ создан: {order_id}")
        print(f"Обновите ORDER_ID в test-completion-debug.py на {order_id}")
