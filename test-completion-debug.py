#!/usr/bin/env python3

import requests
import json
from datetime import datetime

# Настройки
BASE_URL = "http://127.0.0.1:8000"
EMAIL = "test_master@completion.com"  # тестовый мастер
PASSWORD = "test123"                  # пароль тестового мастера
ORDER_ID = 19                         # ID созданного тестового заказа

def login():
    """Авторизация и получение токена"""
    login_data = {
        "email": EMAIL,     # используем email вместо username
        "password": PASSWORD
    }
    
    response = requests.post(f"{BASE_URL}/login/", json=login_data)
    if response.status_code == 200:
        token = response.json().get("token")
        print(f"✅ Авторизация успешна, токен: {token[:20]}...")
        return token
    else:
        print(f"❌ Ошибка авторизации: {response.status_code}")
        print(response.text)
        return None

def test_completion(token):
    """Тестируем завершение заказа"""
    headers = {
        "Authorization": f"Token {token}"
    }
    
    # Данные для завершения заказа - точно такие же поля, как в фронтенде
    completion_data = {
        "order": str(ORDER_ID),
        "work_description": "Тестовое описание работы",
        "parts_expenses": "100.50",
        "transport_costs": "50.00", 
        "total_received": "2000.00",
        "completion_date": datetime.now().isoformat()
    }
    
    print(f"\n🔄 Отправляем данные завершения заказа {ORDER_ID}:")
    print(json.dumps(completion_data, indent=2, ensure_ascii=False))
    
    # Пробуем с JSON данными
    response = requests.post(
        f"{BASE_URL}/api/orders/{ORDER_ID}/complete/",
        headers={**headers, "Content-Type": "application/json"},
        json=completion_data
    )
    
    print(f"\n📋 Результат JSON запроса:")
    print(f"Статус: {response.status_code}")
    print(f"Ответ: {response.text}")
    
    if response.status_code != 201:
        print("\n🔄 Пробуем с FormData...")
        
        # Пробуем с FormData
        form_data = {
            "order": str(ORDER_ID),
            "work_description": "Тестовое описание работы",
            "parts_expenses": "100.50",
            "transport_costs": "50.00",
            "total_received": "2000.00",
            "completion_date": datetime.now().isoformat()
        }
        
        response = requests.post(
            f"{BASE_URL}/api/orders/{ORDER_ID}/complete/",
            headers={"Authorization": f"Token {token}"},
            data=form_data
        )
        
        print(f"\n📋 Результат FormData запроса:")
        print(f"Статус: {response.status_code}")
        print(f"Ответ: {response.text}")

def check_order_status(token):
    """Проверяем статус заказа"""
    headers = {
        "Authorization": f"Token {token}"
    }
    
    response = requests.get(f"{BASE_URL}/api/orders/{ORDER_ID}/detail/", headers=headers)
    if response.status_code == 200:
        order_data = response.json()
        print(f"\n📊 Информация о заказе {ORDER_ID}:")
        print(f"Статус: {order_data.get('status')}")
        print(f"Назначенный мастер: {order_data.get('assigned_master_name', 'Не назначен')}")
        print(f"Есть завершение: {'Да' if 'completion' in order_data else 'Нет'}")
        return order_data
    else:
        print(f"❌ Ошибка получения заказа: {response.status_code}")
        print(response.text)
        return None

if __name__ == "__main__":
    print("🧪 Тестирование завершения заказа...")
    
    # Авторизация
    token = login()
    if not token:
        exit(1)
    
    # Проверяем статус заказа
    order_data = check_order_status(token)
    if not order_data:
        exit(1)
    
    # Тестируем завершение
    test_completion(token)
