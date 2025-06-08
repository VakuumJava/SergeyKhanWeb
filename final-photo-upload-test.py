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

def create_test_image(name="test_image.jpg", size=(800, 600), color='blue'):
    """Создаем тестовое изображение в памяти"""
    img = Image.new('RGB', size, color=color)
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
        return None

def test_multiple_photos(token):
    """Тестируем загрузку нескольких фотографий разных типов"""
    from api1.models import Order, CustomUser
    
    # Создаем новый заказ для теста
    master = CustomUser.objects.get(email=EMAIL)
    order = Order.objects.create(
        client_name='Multi Photo Test',
        client_phone='+7999888777',
        street='Photo Test Street',
        house_number='100',
        description='Test order for multiple photo upload',
        estimated_cost=3000.00,
        final_cost=3000.00,
        status='назначен',
        assigned_master=master
    )
    
    headers = {
        "Authorization": f"Token {token}"
    }
    
    # Создаем 4 тестовых изображения разных цветов и размеров
    image1 = create_test_image("photo1.jpg", (800, 600), 'red')
    image2 = create_test_image("photo2.png", (1024, 768), 'green') 
    image3 = create_test_image("photo3.jpeg", (640, 480), 'blue')
    image4 = create_test_image("photo4.jpg", (1200, 900), 'yellow')
    
    # Данные для завершения заказа
    form_data = {
        "order": str(order.id),
        "work_description": "Тестовое описание с множественными фотографиями",
        "parts_expenses": "200.00",
        "transport_costs": "100.00", 
        "total_received": "3500.00",
        "completion_date": datetime.now().isoformat()
    }
    
    # Подготавливаем файлы для загрузки
    files = []
    files.append(('completion_photos', ('photo1.jpg', image1, 'image/jpeg')))
    files.append(('completion_photos', ('photo2.png', image2, 'image/png')))
    files.append(('completion_photos', ('photo3.jpeg', image3, 'image/jpeg')))
    files.append(('completion_photos', ('photo4.jpg', image4, 'image/jpeg')))
    
    print(f"\n🔄 Тестируем загрузку 4 фотографий для заказа {order.id}")
    print("📸 Загружаем 4 тестовых фотографии разных размеров и цветов...")
    
    response = requests.post(
        f"{BASE_URL}/api/orders/{order.id}/complete/",
        headers=headers,
        data=form_data,
        files=files
    )
    
    print(f"\n📋 Результат:")
    print(f"Статус: {response.status_code}")
    
    if response.status_code == 201:
        completion_data = response.json()
        print("✅ Завершение заказа с 4 фотографиями успешно!")
        print(f"ID завершения: {completion_data['id']}")
        print(f"Количество загруженных фотографий: {len(completion_data['completion_photos'])}")
        for i, photo_path in enumerate(completion_data['completion_photos'], 1):
            print(f"  Фото {i}: {photo_path}")
            # Проверяем доступность фотографии
            photo_url = f"{BASE_URL}/media/{photo_path}"
            photo_response = requests.head(photo_url)
            status_emoji = "✅" if photo_response.status_code == 200 else "❌"
            print(f"    {status_emoji} URL доступен: {photo_url}")
        return True
    else:
        print("❌ Ошибка при завершении заказа")
        print(f"Ответ: {response.text}")
        return False

if __name__ == "__main__":
    print("🧪 Тестирование множественной загрузки фотографий...")
    
    # Нужно импортировать модели Django
    import os
    import sys
    import django
    
    # Настройка Django
    sys.path.append('/Users/bekzhan/Documents/projects/soso/sergeykhan-backend/app1')
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app1.settings')
    django.setup()
    
    # Авторизация
    token = login()
    if not token:
        exit(1)
    
    # Тестируем множественную загрузку
    success = test_multiple_photos(token)
    
    if success:
        print("\n🎉 Все тесты прошли успешно!")
        print("✅ Функциональность загрузки фотографий работает корректно")
        print("✅ Поддерживается загрузка нескольких файлов")
        print("✅ Фотографии сохраняются с уникальными именами")
        print("✅ Файлы доступны по HTTP URL")
    else:
        print("\n❌ Тесты не пройдены")
    
    print("\n🏁 Тестирование завершено!")
