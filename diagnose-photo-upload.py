#!/usr/bin/env python3

import requests
import json
import io
from datetime import datetime
from PIL import Image

# Настройки
BASE_URL = "http://127.0.0.1:8000"
EMAIL = "test_photo_master@example.com"
PASSWORD = "test123"
ORDER_ID = 20  # Заказ для тестирования с фотографиями

def create_test_image(name="test_image.jpg", size=(400, 300)):
    """Создаем тестовое изображение в памяти"""
    img = Image.new('RGB', size, color='blue')
    img_buffer = io.BytesIO()
    img.save(img_buffer, format='JPEG')
    img_buffer.seek(0)
    return img_buffer

def login():
    """Авторизация и получение токена"""
    login_data = {
        "email": EMAIL,
        "password": PASSWORD
    }
    
    response = requests.post(f"{BASE_URL}/login/", json=login_data)
    if response.status_code == 200:
        token = response.json().get("token")
        print(f"✅ Авторизация успешна")
        return token
    else:
        print(f"❌ Ошибка авторизации: {response.status_code}")
        print(response.text)
        return None

def test_photo_upload_different_formats(token):
    """Тестируем разные форматы загрузки фотографий"""
    headers = {
        "Authorization": f"Token {token}"
    }
    
    # Создаем тестовое изображение
    image = create_test_image("test_photo.jpg", (600, 400))
    
    print("\n=== ТЕСТ 1: Формат MultiPart с одним файлом ===")
    
    form_data = {
        "order": str(ORDER_ID),
        "work_description": "Тест загрузки одного фото",
        "parts_expenses": "100.00",
        "transport_costs": "50.00", 
        "total_received": "2000.00",
        "completion_date": datetime.now().isoformat()
    }
    
    files = {
        'completion_photos': ('test_photo.jpg', image, 'image/jpeg')
    }
    
    response = requests.post(
        f"{BASE_URL}/api/orders/{ORDER_ID}/complete/",
        headers=headers,
        data=form_data,
        files=files
    )
    
    print(f"Статус: {response.status_code}")
    print(f"Ответ: {response.text}")
    
    if response.status_code != 201:
        # Создаем новое изображение для следующего теста
        image2 = create_test_image("test_photo2.jpg", (600, 400))
        
        print("\n=== ТЕСТ 2: Формат без файлов (только данные) ===")
        
        response2 = requests.post(
            f"{BASE_URL}/api/orders/{ORDER_ID}/complete/",
            headers=headers,
            data=form_data
        )
        
        print(f"Статус: {response2.status_code}")
        print(f"Ответ: {response2.text}")
        
        if response2.status_code != 201:
            print("\n=== ТЕСТ 3: JSON формат ===")
            
            json_data = {
                "order": str(ORDER_ID),
                "work_description": "Тест без фотографий через JSON",
                "parts_expenses": "100.00",
                "transport_costs": "50.00", 
                "total_received": "2000.00",
                "completion_date": datetime.now().isoformat()
            }
            
            response3 = requests.post(
                f"{BASE_URL}/api/orders/{ORDER_ID}/complete/",
                headers={**headers, "Content-Type": "application/json"},
                json=json_data
            )
            
            print(f"Статус: {response3.status_code}")
            print(f"Ответ: {response3.text}")

if __name__ == "__main__":
    print("🔬 Диагностика формата загрузки фотографий...")
    
    # Авторизация
    token = login()
    if not token:
        exit(1)
    
    # Тестируем разные форматы
    test_photo_upload_different_formats(token)
