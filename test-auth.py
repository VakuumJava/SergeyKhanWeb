#!/usr/bin/env python3
"""
Скрипт для проверки авторизации
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8001"

def test_login():
    """Тестируем логин"""
    login_data = {
        "email": "test_master@completion.com",
        "password": "test123"
    }
    
    print("🔑 Тестируем авторизацию...")
    print(f"Отправляем: {json.dumps(login_data, indent=2)}")
    
    response = requests.post(f"{BASE_URL}/login/", json=login_data)
    
    print(f"Статус: {response.status_code}")
    print(f"Ответ: {response.text}")
    
    if response.status_code == 200:
        return response.json()
    return None

if __name__ == "__main__":
    result = test_login()
    if result:
        print(f"\nПолученные ключи: {list(result.keys())}")
