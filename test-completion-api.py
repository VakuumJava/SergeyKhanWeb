#!/usr/bin/env python3
"""
Тест API endpoint для завершения заказа
"""
import requests
import json

# Настройки
API_BASE = "http://127.0.0.1:8000"
ORDER_ID = 8
TOKEN = "fedbac35122852892251af6d6663286911fe8e3d"  # Токен из create-test-data.py

def test_completion_api():
    """Тестируем API endpoint для завершения заказа"""
    
    # Данные для отправки
    data = {
        'order': ORDER_ID,
        'work_description': 'Тестовое описание работы',
        'parts_expenses': '100.00',
        'transport_costs': '50.00',
        'total_received': '1000.00',
        'completion_date': '2025-06-05T12:00:00Z'
    }
    
    headers = {
        'Authorization': f'Token {TOKEN}'
    }
    
    url = f"{API_BASE}/api/orders/{ORDER_ID}/complete/"
    
    print(f"Тестируем: {url}")
    print(f"Данные: {json.dumps(data, indent=2)}")
    
    try:
        response = requests.post(url, data=data, headers=headers)
        
        print(f"\nСтатус ответа: {response.status_code}")
        print(f"Заголовки ответа: {dict(response.headers)}")
        
        try:
            response_data = response.json()
            print(f"JSON ответ: {json.dumps(response_data, indent=2, ensure_ascii=False)}")
        except:
            print(f"Текстовый ответ: {response.text}")
            
    except Exception as e:
        print(f"Ошибка запроса: {e}")

if __name__ == "__main__":
    print("Для тестирования замените YOUR_TOKEN_HERE на реальный токен мастера")
    # test_completion_api()
