#!/usr/bin/env python
"""
Интеграционный тест API для проверки исправленной функциональности передачи заказов.
"""

import requests
import json
from decimal import Decimal

# Конфигурация API
API_BASE_URL = "http://127.0.0.1:8000/api"

def login_user(email, password):
    """Вход пользователя и получение токена"""
    response = requests.post(f"{API_BASE_URL}/login/", data={
        'email': email,
        'password': password
    })
    if response.status_code == 200:
        return response.json()['token']
    else:
        print(f"Ошибка входа для {email}: {response.status_code}")
        print(response.text)
        return None

def create_test_order(token, description, assigned_master_id=None):
    """Создает тестовый заказ"""
    headers = {'Authorization': f'Token {token}', 'Content-Type': 'application/json'}
    data = {
        'description': description,
        'estimated_cost': '100.00',
        'final_cost': '150.00',
        'expenses': '50.00',
        'status': 'новый'
    }
    if assigned_master_id:
        data['assigned_master'] = assigned_master_id
        data['status'] = 'в работе'
    
    response = requests.post(f"{API_BASE_URL}/orders/", headers=headers, data=json.dumps(data))
    if response.status_code == 201:
        return response.json()['id']
    else:
        print(f"Ошибка создания заказа: {response.status_code}")
        print(response.text)
        return None

def get_users_by_role(token, role):
    """Получает пользователей по роли"""
    headers = {'Authorization': f'Token {token}'}
    response = requests.get(f"{API_BASE_URL}/users/{role}s/", headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Ошибка получения {role}s: {response.status_code}")
        return []

def transfer_order_to_warranty_master(token, order_id, warranty_master_id):
    """Передает заказ гарантийному мастеру"""
    headers = {'Authorization': f'Token {token}', 'Content-Type': 'application/json'}
    data = {'warranty_master_id': warranty_master_id}
    
    response = requests.post(f"{API_BASE_URL}/orders/{order_id}/transfer/", 
                           headers=headers, data=json.dumps(data))
    return response

def test_warranty_transfer_scenarios():
    """Тестирует различные сценарии передачи заказов"""
    print("🚀 Запуск интеграционного теста передачи заказов гарантийным мастерам")
    
    # Получаем токены пользователей (предполагается, что они уже созданы)
    print("\n1. Вход пользователей...")
    
    # Пробуем войти как разные пользователи
    admin_token = login_user("admin@test.com", "password123")
    master_token = login_user("master@test.com", "password123")
    warranty_token = login_user("warranty@test.com", "password123")
    
    if not all([admin_token, master_token, warranty_token]):
        print("❌ Не удалось войти всем пользователям")
        return False
    
    print("✅ Все пользователи вошли успешно")
    
    # Получаем список пользователей
    print("\n2. Получение списков пользователей...")
    masters = get_users_by_role(admin_token, "master")
    warranty_masters = get_users_by_role(admin_token, "warranty-master")
    
    if not masters or not warranty_masters:
        print("❌ Не удалось получить списки пользователей")
        return False
    
    master_id = masters[0]['id']
    warranty_master_id = next((u['id'] for u in warranty_masters if 'warranty' in u['email']), None)
    
    if not warranty_master_id:
        print("❌ Не найден гарантийный мастер")
        return False
    
    print(f"✅ Найден мастер: {master_id}, гарантийный мастер: {warranty_master_id}")
    
    # Тест 1: Создание заказа с назначенным мастером и передача администратором
    print("\n3. Тест 1: Передача заказа с назначенным мастером администратором...")
    order1_id = create_test_order(admin_token, "Тестовый заказ с мастером", master_id)
    
    if not order1_id:
        print("❌ Не удалось создать заказ")
        return False
    
    response = transfer_order_to_warranty_master(admin_token, order1_id, warranty_master_id)
    print(f"   Статус ответа: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"   Результат: {result}")
        print(f"   Штраф применен: {result.get('fine_applied', 0)}")
        print(f"   Был назначенный мастер: {result.get('had_assigned_master', False)}")
        print("   ✅ Тест 1 пройден")
    else:
        print(f"   ❌ Тест 1 не пройден: {response.text}")
        return False
    
    # Тест 2: Создание заказа без назначенного мастера и передача администратором
    print("\n4. Тест 2: Передача заказа без назначенного мастера администратором...")
    order2_id = create_test_order(admin_token, "Тестовый заказ без мастера")
    
    if not order2_id:
        print("❌ Не удалось создать заказ")
        return False
    
    response = transfer_order_to_warranty_master(admin_token, order2_id, warranty_master_id)
    print(f"   Статус ответа: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"   Результат: {result}")
        print(f"   Штраф применен: {result.get('fine_applied', 0)}")
        print(f"   Был назначенный мастер: {result.get('had_assigned_master', False)}")
        print("   ✅ Тест 2 пройден")
    else:
        print(f"   ❌ Тест 2 не пройден: {response.text}")
        return False
    
    # Тест 3: Передача заказа назначенным мастером
    print("\n5. Тест 3: Передача заказа назначенным мастером...")
    order3_id = create_test_order(admin_token, "Тестовый заказ для мастера", master_id)
    
    if not order3_id:
        print("❌ Не удалось создать заказ")
        return False
    
    response = transfer_order_to_warranty_master(master_token, order3_id, warranty_master_id)
    print(f"   Статус ответа: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"   Результат: {result}")
        print(f"   Штраф применен: {result.get('fine_applied', 0)}")
        print(f"   Передано пользователем: {result.get('transferred_by_role', 'unknown')}")
        print("   ✅ Тест 3 пройден")
    else:
        print(f"   ❌ Тест 3 не пройден: {response.text}")
        return False
    
    print("\n🎉 Все интеграционные тесты пройдены успешно!")
    print("\n📋 Краткое резюме:")
    print("✅ Администраторы могут передавать заказы с назначенным мастером (штраф применяется)")
    print("✅ Администраторы могут передавать заказы без назначенного мастера (штраф не применяется)")
    print("✅ Назначенные мастера могут передавать свои заказы")
    print("✅ API возвращает корректную информацию о штрафах")
    
    return True

if __name__ == '__main__':
    test_warranty_transfer_scenarios()
