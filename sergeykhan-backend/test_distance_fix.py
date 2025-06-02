#!/usr/bin/env python3
"""
Скрипт для тестирования исправления проблемы с дистанционкой
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_distance_fix():
    print("🧪 Тестирование исправления дистанционки...")
    
    # Здесь нужно будет заменить на реальный токен супер-админа
    # Для тестирования можно получить токен через /api/login/ 
    admin_token = "YOUR_ADMIN_TOKEN_HERE"  
    
    headers = {
        'Authorization': f'Token {admin_token}',
        'Content-Type': 'application/json'
    }
    
    # Тест 1: Получить всех мастеров
    print("\n1. Получение списка мастеров...")
    response = requests.get(f"{BASE_URL}/api/distance/masters/all/", headers=headers)
    
    if response.status_code == 200:
        masters = response.json()
        print(f"✅ Найдено {len(masters)} мастеров")
        
        if masters:
            master = masters[0]
            master_id = master['master_id']
            print(f"📋 Тестируем на мастере: {master['master_email']} (ID: {master_id})")
            print(f"   Текущий уровень: {master['distance_level']}")
            print(f"   Ручная установка: {master.get('manual_override', 'не указано')}")
            
            # Тест 2: Установить дистанционку вручную
            print(f"\n2. Установка дистанционки уровня 2 вручную...")
            set_data = {"distance_level": 2}
            response = requests.post(f"{BASE_URL}/api/distance/master/{master_id}/set/", 
                                   headers=headers, json=set_data)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Дистанционка установлена: {result['message']}")
                print(f"   Ручная установка: {result.get('manual_override', 'не указано')}")
                
                # Тест 3: Проверить, что дистанционка не сбрасывается
                print(f"\n3. Проверка сохранения дистанционки...")
                response = requests.get(f"{BASE_URL}/api/distance/master/{master_id}/", headers=headers)
                
                if response.status_code == 200:
                    info = response.json()
                    print(f"✅ Уровень дистанционки: {info['distance_level']}")
                    print(f"   Ручная установка: {info.get('manual_override', 'не указано')}")
                    
                    if info['distance_level'] == 2 and info.get('manual_override'):
                        print("🎉 ТЕСТ ПРОЙДЕН: Дистанционка сохраняется при ручной установке!")
                    else:
                        print("❌ ТЕСТ НЕ ПРОЙДЕН: Дистанционка не сохранилась")
                else:
                    print(f"❌ Ошибка получения информации о мастере: {response.status_code}")
                    
                # Тест 4: Сброс к автоматическому расчету
                print(f"\n4. Сброс к автоматическому расчету...")
                response = requests.post(f"{BASE_URL}/api/distance/master/{master_id}/reset/", headers=headers)
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"✅ Сброс выполнен: {result['message']}")
                    print(f"   Новый уровень: {result['new_distance_level']}")
                    print(f"   Ручная установка: {result.get('manual_override', 'не указано')}")
                else:
                    print(f"❌ Ошибка сброса: {response.status_code}")
                    
            else:
                print(f"❌ Ошибка установки дистанционки: {response.status_code}")
                print(response.text)
        else:
            print("❌ Мастера не найдены")
    else:
        print(f"❌ Ошибка получения мастеров: {response.status_code}")
        if response.status_code == 403:
            print("🔐 Проблема с авторизацией. Убедитесь, что токен супер-админа правильный")
        print(response.text)

if __name__ == "__main__":
    print("🔧 Для тестирования необходимо:")
    print("1. Получить токен супер-админа через /api/login/")
    print("2. Заменить YOUR_ADMIN_TOKEN_HERE в скрипте на реальный токен")
    print("3. Запустить скрипт")
    print("\nЕсли хотите продолжить без автоматического теста:")
    print("- Откройте панель супер-админа (localhost:3001)")
    print("- Установите дистанционку мастеру вручную")
    print("- Перейдите на страницу этого мастера (localhost:3000)")
    print("- Проверьте, что дистанционка сохранилась")
    
    # test_distance_fix()
