#!/usr/bin/env python3

import requests
import json
import os
from datetime import datetime
from PIL import Image
import io

# Настройки
BASE_URL = "http://127.0.0.1:8000"
EMAIL = "test_master@completion.com"  # тестовый мастер
PASSWORD = "test123"                  # пароль тестового мастера

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

def create_test_image(filename="test_photo.jpg"):
    """Создает тестовое изображение"""
    # Создаем простое цветное изображение 200x200
    img = Image.new('RGB', (200, 200), color='red')
    
    # Сохраняем в байтовый буфер
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    
    return img_bytes

def create_test_order_with_photos(token):
    """Создаем новый тестовый заказ и завершаем его с фотографиями"""
    
    # Сначала создаем новый заказ
    master_id = 13  # ID нашего тестового мастера
    
    # Создаем заказ через Django shell
    import subprocess
    create_order_script = f'''
from api1.models import CustomUser, Order
from datetime import date, time

master = CustomUser.objects.get(id={master_id})
test_order = Order.objects.create(
    client_name="Тест с фото",
    client_phone="+77771234567",
    description="Заказ для тестирования загрузки фотографий",
    address="Тестовый адрес",
    street="Тестовая улица",
    house_number="123",
    status="выполняется",
    assigned_master=master,
    scheduled_date=date.today(),
    scheduled_time=time(10, 0),
    estimated_cost=2000.00
)
print(test_order.id)
'''
    
    result = subprocess.run([
        "python3", "manage.py", "shell", "-c", create_order_script
    ], cwd="/Users/bekzhan/Documents/projects/soso/sergeykhan-backend/app1", 
    capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"❌ Ошибка создания заказа: {result.stderr}")
        return None
    
    # Извлекаем ID заказа из вывода
    order_id = None
    for line in result.stdout.strip().split('\n'):
        if line.strip().isdigit():
            order_id = int(line.strip())
            break
    
    if not order_id:
        print(f"❌ Не удалось получить ID заказа из вывода: {result.stdout}")
        return None
        
    print(f"✅ Создан тестовый заказ ID: {order_id}")
    return order_id

def test_completion_with_photos(token, order_id):
    """Тестируем завершение заказа с фотографиями"""
    headers = {
        "Authorization": f"Token {token}"
    }
    
    # Создаем тестовые изображения
    photo1 = create_test_image("photo1.jpg")
    photo2 = create_test_image("photo2.jpg")
    
    # Подготавливаем данные формы с файлами
    files = [
        ('completion_photos', ('photo1.jpg', photo1, 'image/jpeg')),
        ('completion_photos', ('photo2.jpg', photo2, 'image/jpeg'))
    ]
    
    form_data = {
        "order": str(order_id),
        "work_description": "Работа выполнена с фотографиями",
        "parts_expenses": "150.00",
        "transport_costs": "75.00",
        "total_received": "2500.00",
        "completion_date": datetime.now().isoformat()
    }
    
    print(f"\n🔄 Отправляем завершение заказа {order_id} с фотографиями...")
    print(f"Данные формы: {form_data}")
    print(f"Фотографии: {len(files)} файлов")
    
    response = requests.post(
        f"{BASE_URL}/api/orders/{order_id}/complete/",
        headers=headers,
        data=form_data,
        files=files
    )
    
    print(f"\n📋 Результат запроса с фотографиями:")
    print(f"Статус: {response.status_code}")
    print(f"Ответ: {response.text}")
    
    if response.status_code == 201:
        completion_data = response.json()
        photos = completion_data.get('completion_photos', [])
        print(f"✅ Завершение создано успешно!")
        print(f"📸 Сохранено фотографий: {len(photos)}")
        for i, photo in enumerate(photos):
            print(f"  {i+1}. {photo}")
        
        # Проверяем, что файлы действительно сохранены
        for photo_path in photos:
            full_path = f"/Users/bekzhan/Documents/projects/soso/sergeykhan-backend/app1/media/{photo_path}"
            if os.path.exists(full_path):
                size = os.path.getsize(full_path)
                print(f"  ✅ {photo_path} - файл существует ({size} байт)")
            else:
                print(f"  ❌ {photo_path} - файл НЕ найден!")
                
        return True
    else:
        print(f"❌ Ошибка завершения заказа")
        return False

def test_completion_without_photos(token, order_id):
    """Тестируем завершение заказа БЕЗ фотографий (должно работать)"""
    headers = {
        "Authorization": f"Token {token}"
    }
    
    form_data = {
        "order": str(order_id),
        "work_description": "Работа выполнена без фотографий",
        "parts_expenses": "100.00",
        "transport_costs": "50.00",
        "total_received": "2000.00",
        "completion_date": datetime.now().isoformat()
    }
    
    print(f"\n🔄 Тестируем завершение заказа {order_id} БЕЗ фотографий...")
    
    response = requests.post(
        f"{BASE_URL}/api/orders/{order_id}/complete/",
        headers=headers,
        data=form_data
    )
    
    print(f"📋 Результат запроса БЕЗ фотографий:")
    print(f"Статус: {response.status_code}")
    
    if response.status_code == 201:
        print(f"✅ Завершение БЕЗ фотографий работает корректно!")
        return True
    else:
        print(f"❌ Ошибка завершения заказа БЕЗ фотографий: {response.text}")
        return False

if __name__ == "__main__":
    print("🧪 Тестирование завершения заказа с фотографиями...")
    
    # Авторизация
    token = login()
    if not token:
        exit(1)
    
    # Создаем заказ для теста с фотографиями
    order_id_with_photos = create_test_order_with_photos(token)
    if not order_id_with_photos:
        exit(1)
    
    # Создаем еще один заказ для теста без фотографий
    order_id_without_photos = create_test_order_with_photos(token)
    if not order_id_without_photos:
        exit(1)
    
    # Тестируем завершение С фотографиями
    success_with_photos = test_completion_with_photos(token, order_id_with_photos)
    
    # Тестируем завершение БЕЗ фотографий
    success_without_photos = test_completion_without_photos(token, order_id_without_photos)
    
    print(f"\n🎯 Итоги тестирования:")
    print(f"Завершение С фотографиями: {'✅ РАБОТАЕТ' if success_with_photos else '❌ НЕ РАБОТАЕТ'}")
    print(f"Завершение БЕЗ фотографий: {'✅ РАБОТАЕТ' if success_without_photos else '❌ НЕ РАБОТАЕТ'}")
    
    if success_with_photos and success_without_photos:
        print(f"\n🎉 ВСЕ ТЕСТЫ ПРОШЛИ УСПЕШНО!")
    else:
        print(f"\n💥 ЕСТЬ ПРОБЛЕМЫ, ТРЕБУЕТСЯ ИСПРАВЛЕНИЕ!")
