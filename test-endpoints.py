#!/usr/bin/env python3
"""
Улучшенная проверка заказов
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8001"

def login():
    """Логин для получения токена"""
    login_data = {
        "email": "test_master@completion.com",
        "password": "test123"
    }
    
    response = requests.post(f"{BASE_URL}/login/", json=login_data)
    
    if response.status_code == 200:
        token = response.json().get('token', '')[:20] + "..."
        print(f"✅ Авторизация успешна, токен: {token}")
        return response.json()['token']
    else:
        print(f"❌ Ошибка авторизации: {response.status_code}")
        print(f"Ответ: {response.text}")
        return None

def test_endpoints(token):
    """Тестируем различные endpoints"""
    headers = {
        'Authorization': f'Token {token}',
        'Content-Type': 'application/json'
    }
    
    endpoints_to_test = [
        "api/orders/all/",
        "orders/master/13/",  # ID тестового мастера
        "orders/assigned/",
        "api/orders/master/available/"
    ]
    
    for endpoint in endpoints_to_test:
        print(f"\n🔍 Тестируем: {endpoint}")
        response = requests.get(f"{BASE_URL}/{endpoint}", headers=headers)
        print(f"   Статус: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                if isinstance(data, list):
                    print(f"   Найдено записей: {len(data)}")
                    for item in data[:3]:  # показываем первые 3
                        if 'id' in item:
                            print(f"     ID: {item['id']}, Статус: {item.get('status', 'N/A')}")
                else:
                    print(f"   Ответ: {str(data)[:100]}...")
            except:
                print(f"   Ответ: {response.text[:100]}...")
        else:
            print(f"   Ошибка: {response.text[:100]}...")

def change_order_status(token, order_id, new_status):
    """Изменяем статус заказа"""
    headers = {
        'Authorization': f'Token {token}',
        'Content-Type': 'application/json'
    }
    
    data = {"status": new_status}
    
    print(f"\n🔄 Меняем статус заказа {order_id} на '{new_status}'...")
    response = requests.patch(f"{BASE_URL}/orders/{order_id}/update/", json=data, headers=headers)
    
    print(f"Статус: {response.status_code}")
    print(f"Ответ: {response.text}")
    
    return response.status_code == 200

if __name__ == "__main__":
    token = login()
    if token:
        test_endpoints(token)
        
        # Попробуем изменить статус заказа 19 на "назначен"
        print("\n" + "="*50)
        change_order_status(token, 19, "назначен")
