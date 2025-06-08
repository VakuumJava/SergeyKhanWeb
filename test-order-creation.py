#!/usr/bin/env python3
"""
Тест API endpoint для создания заказа
"""
import requests
import json

# Настройки
API_BASE = "http://127.0.0.1:8000"

def test_order_creation():
    """Тестируем API endpoint для создания заказа"""
    
    # Минимальные обязательные данные для создания заказа
    data = {
        'client_name': 'Тестовый клиент',
        'client_phone': '+7123456789',
        'description': 'Тестовое описание заказа'
    }
    
    url = f"{API_BASE}/orders/create/"
    
    print(f"Тестируем: {url}")
    print(f"Данные: {json.dumps(data, indent=2, ensure_ascii=False)}")
    
    try:
        response = requests.post(url, data=data)
        
        print(f"\nСтатус ответа: {response.status_code}")
        print(f"Заголовки ответа: {dict(response.headers)}")
        
        try:
            response_data = response.json()
            print(f"JSON ответ: {json.dumps(response_data, indent=2, ensure_ascii=False)}")
        except:
            print(f"Текстовый ответ: {response.text}")
            
    except Exception as e:
        print(f"Ошибка запроса: {e}")

def test_order_creation_with_address():
    """Тестируем создание заказа с адресом"""
    
    data = {
        'client_name': 'Тестовый клиент 2',
        'client_phone': '+7987654321',
        'description': 'Тестовое описание заказа с адресом',
        'address': 'Тестовый адрес 123'
    }
    
    url = f"{API_BASE}/orders/create/"
    
    print(f"\n--- Тест с адресом ---")
    print(f"Тестируем: {url}")
    print(f"Данные: {json.dumps(data, indent=2, ensure_ascii=False)}")
    
    try:
        response = requests.post(url, data=data)
        
        print(f"\nСтатус ответа: {response.status_code}")
        
        try:
            response_data = response.json()
            print(f"JSON ответ: {json.dumps(response_data, indent=2, ensure_ascii=False)}")
        except:
            print(f"Текстовый ответ: {response.text}")
            
    except Exception as e:
        print(f"Ошибка запроса: {e}")

def test_order_creation_with_all_fields():
    """Тестируем создание заказа со всеми полями"""
    
    data = {
        'client_name': 'Тестовый клиент 3',
        'client_phone': '+7555123456',
        'description': 'Подробное описание тестового заказа',
        'street': 'Улица Тестовая',
        'house_number': '123',
        'apartment': '45',
        'entrance': '2',
        'address': 'Полный тестовый адрес'
    }
    
    url = f"{API_BASE}/orders/create/"
    
    print(f"\n--- Тест со всеми полями ---")
    print(f"Тестируем: {url}")
    print(f"Данные: {json.dumps(data, indent=2, ensure_ascii=False)}")
    
    try:
        response = requests.post(url, data=data)
        
        print(f"\nСтатус ответа: {response.status_code}")
        
        try:
            response_data = response.json()
            print(f"JSON ответ: {json.dumps(response_data, indent=2, ensure_ascii=False)}")
        except:
            print(f"Текстовый ответ: {response.text}")
            
    except Exception as e:
        print(f"Ошибка запроса: {e}")

if __name__ == "__main__":
    print("=== Тестирование создания заказов ===")
    test_order_creation()
    test_order_creation_with_address()
    test_order_creation_with_all_fields()
