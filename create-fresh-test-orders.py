#!/usr/bin/env python3

import requests
import json
from datetime import datetime

# Настройки
BASE_URL = "http://127.0.0.1:8000"
ADMIN_EMAIL = "test_photo_admin@example.com"
ADMIN_PASSWORD = "test123"
MASTER_EMAIL = "test_photo_master@example.com"

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
    
    response = requests.get(f"{BASE_URL}/api/users/", headers=headers)
    if response.status_code == 200:
        users = response.json()
        for user in users:
            if user.get('email') == MASTER_EMAIL:
                print(f"✅ Найден мастер: ID={user['id']}, email={user['email']}")
                return user['id']
    
    print(f"❌ Мастер с email {MASTER_EMAIL} не найден")
    return None

def create_order(token):
    """Создаем новый заказ"""
    headers = {"Authorization": f"Token {token}"}
    
    order_data = {
        "customer_name": "Тестовый клиент",
        "phone": "+7123456789",
        "address": "Тестовый адрес",
        "description": "Тестовый заказ для проверки фото загрузки",
        "price": "2000.00",
        "service": 1,  # Предполагаем ID услуги
        "status": "новый"
    }
    
    response = requests.post(f"{BASE_URL}/api/orders/", headers=headers, json=order_data)
    if response.status_code == 201:
        order = response.json()
        print(f"✅ Создан заказ ID: {order['id']}")
        return order['id']
    else:
        print(f"❌ Ошибка создания заказа: {response.status_code}")
        print(response.text)
        return None

def assign_order(token, order_id, master_id):
    """Назначаем заказ мастеру"""
    headers = {"Authorization": f"Token {token}"}
    
    update_data = {
        "assigned_master": master_id,
        "status": "назначен"
    }
    
    response = requests.patch(f"{BASE_URL}/api/orders/{order_id}/", headers=headers, json=update_data)
    if response.status_code == 200:
        print(f"✅ Заказ {order_id} назначен мастеру и установлен статус 'назначен'")
        return True
    else:
        print(f"❌ Ошибка назначения заказа: {response.status_code}")
        print(response.text)
        return False

def main():
    print("🔧 Создание свежих тестовых заказов для проверки фото загрузки...\n")
    
    # Авторизация
    admin_token = login_admin()
    if not admin_token:
        return
    
    # Получаем ID мастера
    master_id = get_master_id(admin_token)
    if not master_id:
        return
    
    # Создаем 2 новых заказа
    print("\n📝 Создаем новые заказы...")
    
    order1_id = create_order(admin_token)
    if order1_id:
        if assign_order(admin_token, order1_id, master_id):
            print(f"✅ Заказ {order1_id} готов для тестирования С фотографиями")
    
    order2_id = create_order(admin_token)
    if order2_id:
        if assign_order(admin_token, order2_id, master_id):
            print(f"✅ Заказ {order2_id} готов для тестирования БЕЗ фотографий")
    
    print(f"\n🎯 Обновите ORDER_ID в test-photo-upload-completion.py:")
    print(f"ORDER_ID = {order1_id}  # для теста с фотографиями")
    print(f"ORDER_ID_2 = {order2_id}  # для теста без фотографий")

if __name__ == "__main__":
    main()
