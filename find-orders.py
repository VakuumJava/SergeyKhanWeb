#!/usr/bin/env python3

import requests
import json

# Настройки
BASE_URL = "http://127.0.0.1:8000"
MASTER_EMAIL = "test_master@completion.com"
MASTER_PASSWORD = "test123"

def login_master():
    """Авторизация мастера"""
    login_data = {
        "email": MASTER_EMAIL,
        "password": MASTER_PASSWORD
    }
    
    response = requests.post(f"{BASE_URL}/login/", json=login_data)
    if response.status_code == 200:
        token = response.json().get("token")
        print(f"✅ Авторизация мастера успешна")
        return token
    else:
        print(f"❌ Ошибка авторизации мастера: {response.status_code}")
        print(response.text)
        return None

def get_master_orders(token):
    """Получаем заказы мастера"""
    headers = {"Authorization": f"Token {token}"}
    
    # Попробуем разные endpoint'ы для получения заказов
    endpoints = [
        "/api/orders/",
        "/api/orders/all/",
        "/orders/master/13/",
        "/api/orders/master/",
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
            print(f"\n🔍 Проверяем {endpoint}:")
            print(f"   Статус: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    print(f"   Найдено заказов: {len(data)}")
                    for order in data[:3]:  # Показываем первые 3
                        print(f"     ID: {order.get('id')}, Статус: {order.get('status')}")
                else:
                    print(f"   Ответ: {str(data)[:200]}...")
            else:
                print(f"   Ошибка: {response.text[:100]}...")
        except Exception as e:
            print(f"   Исключение: {e}")

if __name__ == "__main__":
    print("🔍 Поиск заказов мастера...")
    
    # Авторизация мастера
    token = login_master()
    if not token:
        exit(1)
    
    # Получаем заказы
    get_master_orders(token)
