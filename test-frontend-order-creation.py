#!/usr/bin/env python3
"""
Тест имитации фронтенд запроса для создания заказа
"""
import requests
import json

# Настройки
API_BASE = "http://127.0.0.1:8000"

def test_frontend_order_creation():
    """Тестируем создание заказа с данными как от фронтенда"""
    
    # Имитируем данные, которые может отправить фронтенд (как в orderFormComponent)
    frontend_data = {
        'client_name': 'Тестовый клиент фронтенд',
        'client_phone': '+7123456789',
        'address': 'Тестовый адрес, дом 123',
        'age': 25,
        'equipment_type': 'Кондиционер',
        'price': '1500.00',
        'promotion': 'Скидка 10%',
        'due_date': '2025-06-10',
        'description': 'Ремонт кондиционера',
        'status': 'новый',
        'operator': None,
        'curator': None,
        'assigned_master': None,
        'estimated_cost': '1350.00',
        'final_cost': '1500.00',
        'expenses': '150.00',
    }
    
    url = f"{API_BASE}/orders/create/"
    
    print(f"Тестируем фронтенд создание заказа: {url}")
    print(f"Данные фронтенда: {json.dumps(frontend_data, indent=2, ensure_ascii=False)}")
    
    try:
        # Отправляем как JSON (как делает фронтенд)
        response = requests.post(url, json=frontend_data, headers={'Content-Type': 'application/json'})
        
        print(f"\nСтатус ответа: {response.status_code}")
        print(f"Заголовки ответа: {dict(response.headers)}")
        
        try:
            response_data = response.json()
            print(f"JSON ответ: {json.dumps(response_data, indent=2, ensure_ascii=False)}")
        except:
            print(f"Текстовый ответ: {response.text}")
            
    except Exception as e:
        print(f"Ошибка запроса: {e}")

def test_unified_order_creation():
    """Тестируем создание заказа с данными как от UnifiedOrderCreation"""
    
    # Имитируем данные от UnifiedOrderCreation компонента
    unified_data = {
        'client_name': 'Тестовый клиент унифицированный',
        'client_phone': '+7987654321',
        'address': 'Тестовый адрес унифицированный',
        'age': 30,
        'equipment_type': 'Стиральная машина',
        'price': '2000.00',
        'promotion': 'Акция 15%',
        'due_date': '2025-06-12',
        'description': 'Установка стиральной машины',
        'status': 'новый',
        'operator': None,
        'curator': None,
        'assigned_master': None,
        'estimated_cost': '1800.00',
        'final_cost': '2000.00',
        'expenses': '200.00',
    }
    
    url = f"{API_BASE}/orders/create/"
    
    print(f"\n--- Тест Unified Order Creation ---")
    print(f"Тестируем: {url}")
    print(f"Данные: {json.dumps(unified_data, indent=2, ensure_ascii=False)}")
    
    try:
        response = requests.post(url, json=unified_data, headers={'Content-Type': 'application/json'})
        
        print(f"\nСтатус ответа: {response.status_code}")
        
        try:
            response_data = response.json()
            print(f"JSON ответ: {json.dumps(response_data, indent=2, ensure_ascii=False)}")
        except:
            print(f"Текстовый ответ: {response.text}")
            
    except Exception as e:
        print(f"Ошибка запроса: {e}")

def test_minimal_order_creation():
    """Тестируем создание заказа с минимальными данными"""
    
    # Только обязательные поля
    minimal_data = {
        'client_name': 'Минимальный тест',
        'client_phone': '+7555123456',
        'description': 'Минимальное описание',
    }
    
    url = f"{API_BASE}/orders/create/"
    
    print(f"\n--- Тест минимальных данных ---")
    print(f"Тестируем: {url}")
    print(f"Данные: {json.dumps(minimal_data, indent=2, ensure_ascii=False)}")
    
    try:
        response = requests.post(url, json=minimal_data, headers={'Content-Type': 'application/json'})
        
        print(f"\nСтатус ответа: {response.status_code}")
        
        try:
            response_data = response.json()
            print(f"JSON ответ: {json.dumps(response_data, indent=2, ensure_ascii=False)}")
        except:
            print(f"Текстовый ответ: {response.text}")
            
    except Exception as e:
        print(f"Ошибка запроса: {e}")

if __name__ == "__main__":
    print("=== Тестирование создания заказов как от фронтенда ===")
    test_frontend_order_creation()
    test_unified_order_creation()
    test_minimal_order_creation()
