#!/usr/bin/env python3

import requests
import json

# Настройки
BASE_URL = "http://127.0.0.1:8000"
CURATOR_EMAIL = "curator@gmail.com"  # Используем куратора для тестирования
CURATOR_PASSWORD = "12345"

def login_curator():
    """Авторизация куратора"""
    login_data = {
        "email": CURATOR_EMAIL,
        "password": CURATOR_PASSWORD
    }
    
    response = requests.post(f"{BASE_URL}/login/", json=login_data)
    if response.status_code == 200:
        token = response.json().get("token")
        print(f"✅ Авторизация куратора успешна")
        return token
    else:
        print(f"❌ Ошибка авторизации: {response.status_code}")
        print(response.text)
        return None

def test_completion_detail(token, completion_id):
    """Тестируем получение деталей завершения заказа"""
    headers = {"Authorization": f"Token {token}"}
    
    response = requests.get(f"{BASE_URL}/api/order-completions/{completion_id}/", headers=headers)
    print(f"\n📋 Получение завершения заказа ID {completion_id}:")
    print(f"Статус: {response.status_code}")
    
    if response.status_code == 200:
        completion_data = response.json()
        print("✅ Данные получены успешно!")
        print(f"ID завершения: {completion_data.get('id')}")
        print(f"Описание работы: {completion_data.get('work_description')}")
        
        photos = completion_data.get('completion_photos', [])
        print(f"Количество фотографий: {len(photos)}")
        
        for i, photo_url in enumerate(photos, 1):
            print(f"  Фото {i}: {photo_url}")
            
            # Проверяем доступность фотографии
            try:
                photo_response = requests.head(photo_url)
                status_emoji = "✅" if photo_response.status_code == 200 else "❌"
                print(f"    {status_emoji} Доступность: HTTP {photo_response.status_code}")
            except Exception as e:
                print(f"    ❌ Ошибка доступа: {e}")
        
        return True
    else:
        print("❌ Ошибка получения данных")
        print(f"Ответ: {response.text}")
        return False

def test_order_with_completion(token, order_id):
    """Тестируем получение заказа с данными завершения"""
    headers = {"Authorization": f"Token {token}"}
    
    response = requests.get(f"{BASE_URL}/api/orders/{order_id}/detail/", headers=headers)
    print(f"\n📋 Получение заказа ID {order_id} с завершением:")
    print(f"Статус: {response.status_code}")
    
    if response.status_code == 200:
        order_data = response.json()
        print("✅ Данные заказа получены!")
        
        completion = order_data.get('completion')
        if completion:
            print(f"Завершение найдено! ID: {completion.get('id')}")
            photos = completion.get('completion_photos', [])
            print(f"Количество фотографий в завершении: {len(photos)}")
            
            for i, photo_url in enumerate(photos, 1):
                print(f"  Фото {i}: {photo_url}")
                
                # Проверяем доступность
                try:
                    photo_response = requests.head(photo_url)
                    status_emoji = "✅" if photo_response.status_code == 200 else "❌"
                    print(f"    {status_emoji} Доступность: HTTP {photo_response.status_code}")
                except Exception as e:
                    print(f"    ❌ Ошибка доступа: {e}")
        else:
            print("❌ Завершение не найдено в данных заказа")
        
        return True
    else:
        print("❌ Ошибка получения заказа")
        print(f"Ответ: {response.text}")
        return False

def main():
    print("🧪 Тестирование отображения фотографий в завершенных заказах...")
    
    # Авторизация
    token = login_curator()
    if not token:
        return
    
    # Тестируем несколько завершений с фотографиями
    print("\n" + "="*60)
    print("ТЕСТ 1: Прямое получение данных завершения заказа")
    print("="*60)
    
    # Тестируем завершения с фотографиями
    completion_ids = [13, 15, 16]  # ID завершений с фотографиями
    for completion_id in completion_ids:
        test_completion_detail(token, completion_id)
    
    print("\n" + "="*60)
    print("ТЕСТ 2: Получение заказа через detail endpoint")
    print("="*60)
    
    # Тестируем заказы с завершениями
    order_ids = [22, 24]  # ID заказов с завершениями
    for order_id in order_ids:
        test_order_with_completion(token, order_id)
    
    print("\n🏁 Тестирование завершено!")
    print("\n💡 Если фотографии теперь показывают полные URL (начинающиеся с http://),")
    print("   то проблема решена и фронтенд должен корректно загружать изображения!")

if __name__ == "__main__":
    main()
