#!/usr/bin/env python3

import requests
import json

# Настройки
BASE_URL = "http://127.0.0.1:8000"
ADMIN_EMAIL = "admin@gmail.com"
ADMIN_PASSWORD = "12345"
MASTER_EMAIL = "test_master@completion.com"
ORDER_ID = 3

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

def assign_order_to_master(token, order_id, master_id):
    """Назначаем заказ мастеру"""
    headers = {"Authorization": f"Token {token}"}
    
    # Сначала обновляем статус заказа на "назначен"
    update_data = {
        "assigned_master": master_id,
        "status": "назначен"
    }
    
    response = requests.patch(f"{BASE_URL}/api/orders/{order_id}/", headers=headers, json=update_data)
    if response.status_code == 200:
        print(f"✅ Заказ {order_id} назначен мастеру {master_id}")
        return True
    else:
        print(f"❌ Ошибка назначения заказа: {response.status_code}")
        print(response.text)
        return False

def check_order_status(token, order_id):
    """Проверяем статус заказа"""
    headers = {"Authorization": f"Token {token}"}
    
    response = requests.get(f"{BASE_URL}/api/orders/{order_id}/detail/", headers=headers)
    if response.status_code == 200:
        order_data = response.json()
        print(f"\n📊 Заказ {order_id}:")
        print(f"  Статус: {order_data.get('status')}")
        print(f"  Назначенный мастер: {order_data.get('assigned_master_name', 'Не назначен')}")
        return order_data
    else:
        print(f"❌ Ошибка получения заказа: {response.status_code}")
        return None

if __name__ == "__main__":
    print("🔧 Подготовка заказа для тестирования...")
    
    # Авторизация админа
    admin_token = login_admin()
    if not admin_token:
        exit(1)
    
    # Получаем ID мастера
    master_id = get_master_id(admin_token)
    if not master_id:
        exit(1)
    
    # Проверяем текущий статус заказа
    print(f"\n📋 Проверяем заказ {ORDER_ID} до изменений:")
    check_order_status(admin_token, ORDER_ID)
    
    # Назначаем заказ мастеру
    if assign_order_to_master(admin_token, ORDER_ID, master_id):
        # Проверяем результат
        print(f"\n📋 Проверяем заказ {ORDER_ID} после назначения:")
        check_order_status(admin_token, ORDER_ID)
        print(f"\n✅ Заказ {ORDER_ID} готов для тестирования завершения!")
    else:
        print(f"\n❌ Не удалось подготовить заказ {ORDER_ID}")
