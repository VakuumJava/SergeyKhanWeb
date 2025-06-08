#!/usr/bin/env python3

import requests
import json
import io
from datetime import datetime
from PIL import Image

# Настройки
BASE_URL = "http://127.0.0.1:8000"
EMAIL = "test_photo_master@example.com"  # тестовый мастер
PASSWORD = "test123"                     # пароль тестового мастера
ORDER_ID = 22                            # ID заказа в статусе "назначен"

def create_test_image(name="test_image.jpg", size=(800, 600)):
    """Создаем тестовое изображение в памяти"""
    img = Image.new('RGB', size, color='red')
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
        print(f"✅ Авторизация успешна, токен: {token[:20]}...")
        return token
    else:
        print(f"❌ Ошибка авторизации: {response.status_code}")
        print(response.text)
        return None

def get_order_info(token, order_id):
    """Получаем информацию о заказе"""
    headers = {
        "Authorization": f"Token {token}"
    }
    
    response = requests.get(f"{BASE_URL}/api/orders/{order_id}/detail/", headers=headers)
    if response.status_code == 200:
        order_data = response.json()
        return {
            'status': order_data.get('status'),
            'assigned_master_name': order_data.get('assigned_master_name', 'Не назначен'),
            'completion': order_data.get('completion')
        }
    else:
        return {'status': 'неизвестен', 'assigned_master_name': 'Не назначен', 'completion': None}

def test_completion_with_photos(token):
    """Тестируем завершение заказа с фотографиями"""
    headers = {
        "Authorization": f"Token {token}"
    }
    
    # Создаем тестовые изображения
    image1 = create_test_image("photo1.jpg", (800, 600))
    image2 = create_test_image("photo2.jpg", (1024, 768))
    
    # Данные для завершения заказа
    form_data = {
        "order": str(ORDER_ID),
        "work_description": "Тестовое описание работы с фотографиями",
        "parts_expenses": "150.50",
        "transport_costs": "75.00", 
        "total_received": "2500.00",
        "completion_date": datetime.now().isoformat()
    }
    
    # Подготавливаем файлы для загрузки
    files = []
    files.append(('completion_photos', ('photo1.jpg', image1, 'image/jpeg')))
    files.append(('completion_photos', ('photo2.jpg', image2, 'image/jpeg')))
    
    print(f"\n🔄 Отправляем данные завершения заказа {ORDER_ID} с фотографиями:")
    print(json.dumps(form_data, indent=2, ensure_ascii=False))
    print("📸 Загружаем 2 тестовых фотографии...")
    
    response = requests.post(
        f"{BASE_URL}/api/orders/{ORDER_ID}/complete/",
        headers=headers,
        data=form_data,
        files=files
    )
    
    print(f"\n📋 Результат запроса с фотографиями:")
    print(f"Статус: {response.status_code}")
    print(f"Ответ: {response.text}")
    
    if response.status_code == 201:
        print("✅ Завершение заказа с фотографиями успешно!")
        return True
    else:
        print("❌ Ошибка при завершении заказа с фотографиями")
        return False

def test_completion_without_photos(token):
    """Тестируем завершение заказа без фотографий"""
    headers = {
        "Authorization": f"Token {token}"
    }
    
    # Данные для завершения заказа
    form_data = {
        "order": "23",  # Используем другой заказ
        "work_description": "Тестовое описание работы без фотографий",
        "parts_expenses": "100.00",
        "transport_costs": "50.00", 
        "total_received": "2000.00",
        "completion_date": datetime.now().isoformat()
    }
    
    print(f"\n🔄 Отправляем данные завершения заказа 23 без фотографий:")
    print(json.dumps(form_data, indent=2, ensure_ascii=False))
    
    response = requests.post(
        f"{BASE_URL}/api/orders/23/complete/",
        headers=headers,
        data=form_data
    )
    
    print(f"\n📋 Результат запроса без фотографий:")
    print(f"Статус: {response.status_code}")
    print(f"Ответ: {response.text}")
    
    if response.status_code == 201:
        print("✅ Завершение заказа без фотографий успешно!")
        return True
    else:
        print("❌ Ошибка при завершении заказа без фотографий")
        return False

def check_order_status(token, order_id):
    """Проверяем статус заказа"""
    headers = {
        "Authorization": f"Token {token}"
    }
    
    response = requests.get(f"{BASE_URL}/api/orders/{order_id}/detail/", headers=headers)
    if response.status_code == 200:
        order_data = response.json()
        print(f"\n📊 Информация о заказе {order_id}:")
        print(f"Статус: {order_data.get('status')}")
        print(f"Назначенный мастер: {order_data.get('assigned_master_name', 'Не назначен')}")
        print(f"Есть завершение: {'Да' if 'completion' in order_data else 'Нет'}")
        if 'completion' in order_data:
            completion = order_data['completion']
            if completion and 'completion_photos' in completion:
                photos = completion['completion_photos']
                print(f"Количество фотографий: {len(photos)}")
                for i, photo in enumerate(photos, 1):
                    print(f"  Фото {i}: {photo}")
        return order_data
    else:
        print(f"❌ Ошибка получения заказа: {response.status_code}")
        print(response.text)
        return None

if __name__ == "__main__":
    print("🧪 Тестирование завершения заказа с фотографиями...")
    
    # Авторизация
    token = login()
    if not token:
        exit(1)
    
    print("\n" + "="*50)
    print("ТЕСТ 1: Завершение заказа С фотографиями")
    print("="*50)
    
    # Проверяем статус заказа
    order_data = check_order_status(token, ORDER_ID)
    if order_data:
        # Тестируем завершение с фотографиями
        success1 = test_completion_with_photos(token)
        
        # Проверяем результат
        if success1:
            check_order_status(token, ORDER_ID)
    
    print("\n" + "="*50)
    print("ТЕСТ 2: Завершение заказа БЕЗ фотографий")
    print("="*50)
    
    # Проверяем статус второго заказа
    order_data2 = check_order_status(token, 23)
    if order_data2:
        # Тестируем завершение без фотографий
        success2 = test_completion_without_photos(token)
        
        # Проверяем результат
        if success2:
            check_order_status(token, 23)
    
    print("\n🏁 Тестирование завершено!")
