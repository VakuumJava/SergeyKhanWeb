#!/usr/bin/env python3
"""
Полный тест workflow завершения заказов
Тестирует все сценарии: одобрение, отклонение, множественные заказы
"""

import os
import sys
import django
import requests
from datetime import datetime
from decimal import Decimal

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app1.settings')
django.setup()

from api1.models import CustomUser, Order, OrderCompletion, FinancialTransaction, Balance, CompanyBalance

BASE_URL = 'http://127.0.0.1:8000'

def login_user(email, password):
    """Авторизация пользователя"""
    response = requests.post(f'{BASE_URL}/api/login/', {
        'email': email,
        'password': password
    })
    if response.status_code == 200:
        return response.json()['access']
    return None

def create_test_users():
    """Создание тестовых пользователей"""
    # Мастер
    master, _ = CustomUser.objects.get_or_create(
        email='master2@test.com',
        defaults={
            'password': 'pbkdf2_sha256$720000$test$test',
            'first_name': 'Test',
            'last_name': 'Master2',
            'role': 'master',
            'is_active': True,
        }
    )
    
    # Куратор
    curator, _ = CustomUser.objects.get_or_create(
        email='curator2@test.com',
        defaults={
            'password': 'pbkdf2_sha256$720000$test$test',
            'first_name': 'Test',
            'last_name': 'Curator2',
            'role': 'curator',
            'is_active': True,
        }
    )
    
    return master, curator

def create_test_order(master, order_num):
    """Создание тестового заказа"""
    order, _ = Order.objects.get_or_create(
        description=f'Test Order #{order_num}',
        defaults={
            'client_name': f'Client {order_num}',
            'client_phone': f'+7777777777{order_num}',
            'status': 'выполняется',
            'assigned_master': master,
            'estimated_cost': 30000 + (order_num * 1000),
        }
    )
    return order

def test_scenario_1_approval():
    """Сценарий 1: Одобрение завершения заказа"""
    print("\n=== Сценарий 1: Одобрение завершения заказа ===")
    
    master, curator = create_test_users()
    order = create_test_order(master, 1)
    
    # Авторизация
    master_token = login_user('master2@test.com', 'testpassword')
    curator_token = login_user('curator2@test.com', 'testpassword')
    
    if not master_token or not curator_token:
        print("❌ Ошибка авторизации")
        return False
    
    # Мастер завершает заказ
    completion_data = {
        'order_id': order.id,
        'work_description': 'Заменена батарея и экран',
        'completion_photos': ['photo1.jpg', 'photo2.jpg'],
        'parts_expenses': 18000,
        'transport_costs': 1500,
        'total_received': 32000,
        'completion_date': '2025-06-03'
    }
    
    response = requests.post(
        f'{BASE_URL}/api/orders/complete/',
        json=completion_data,
        headers={'Authorization': f'Bearer {master_token}'}
    )
    
    if response.status_code != 201:
        print(f"❌ Ошибка создания завершения: {response.status_code}")
        print(response.text)
        return False
    
    completion_id = response.json()['id']
    print(f"✅ Завершение создано (ID: {completion_id})")
    
    # Куратор одобряет
    review_data = {
        'approved': True,
        'curator_notes': 'Отличная работа'
    }
    
    response = requests.post(
        f'{BASE_URL}/api/orders/completions/{completion_id}/review/',
        json=review_data,
        headers={'Authorization': f'Bearer {curator_token}'}
    )
    
    if response.status_code != 200:
        print(f"❌ Ошибка одобрения: {response.status_code}")
        print(response.text)
        return False
    
    print("✅ Завершение одобрено")
    
    # Проверяем финансовые транзакции
    transactions = FinancialTransaction.objects.filter(order_completion_id=completion_id)
    print(f"✅ Создано транзакций: {transactions.count()}")
    
    return True

def test_scenario_2_rejection():
    """Сценарий 2: Отклонение завершения заказа"""
    print("\n=== Сценарий 2: Отклонение завершения заказа ===")
    
    master, curator = create_test_users()
    order = create_test_order(master, 2)
    
    # Авторизация
    master_token = login_user('master2@test.com', 'testpassword')
    curator_token = login_user('curator2@test.com', 'testpassword')
    
    # Мастер завершает заказ
    completion_data = {
        'order_id': order.id,
        'work_description': 'Некачественная работа',
        'completion_photos': ['photo1.jpg'],
        'parts_expenses': 5000,
        'transport_costs': 500,
        'total_received': 15000,
        'completion_date': '2025-06-03'
    }
    
    response = requests.post(
        f'{BASE_URL}/api/orders/complete/',
        json=completion_data,
        headers={'Authorization': f'Bearer {master_token}'}
    )
    
    completion_id = response.json()['id']
    print(f"✅ Завершение создано (ID: {completion_id})")
    
    # Куратор отклоняет
    review_data = {
        'approved': False,
        'curator_notes': 'Недостаточно фотографий, работа некачественная'
    }
    
    response = requests.post(
        f'{BASE_URL}/api/orders/completions/{completion_id}/review/',
        json=review_data,
        headers={'Authorization': f'Bearer {curator_token}'}
    )
    
    if response.status_code != 200:
        print(f"❌ Ошибка отклонения: {response.status_code}")
        return False
    
    print("✅ Завершение отклонено")
    
    # Проверяем, что транзакции НЕ созданы
    transactions = FinancialTransaction.objects.filter(order_completion_id=completion_id)
    if transactions.count() == 0:
        print("✅ Транзакции не созданы (правильно для отклонённого заказа)")
    else:
        print(f"❌ Неожиданно созданы транзакции: {transactions.count()}")
        return False
    
    return True

def test_scenario_3_balance_tracking():
    """Сценарий 3: Отслеживание баланса"""
    print("\n=== Сценарий 3: Отслеживание баланса ===")
    
    # Получаем начальные балансы
    master = CustomUser.objects.get(email='master2@test.com')
    curator = CustomUser.objects.get(email='curator2@test.com')
    
    master_balance_before = Balance.objects.get_or_create(user=master)[0]
    curator_balance_before = Balance.objects.get_or_create(user=curator)[0]
    company_balance_before = CompanyBalance.objects.get_or_create(id=1)[0]
    
    print(f"Баланс мастера до: {master_balance_before.amount} ₸")
    print(f"Баланс куратора до: {curator_balance_before.amount} ₸")
    print(f"Баланс компании до: {company_balance_before.amount} ₸")
    
    # Создаём и одобряем заказ
    order = create_test_order(master, 3)
    
    master_token = login_user('master2@test.com', 'testpassword')
    curator_token = login_user('curator2@test.com', 'testpassword')
    
    completion_data = {
        'order_id': order.id,
        'work_description': 'Тестовая работа для проверки баланса',
        'completion_photos': ['photo1.jpg', 'photo2.jpg'],
        'parts_expenses': 10000,
        'transport_costs': 1000,
        'total_received': 20000,
        'completion_date': '2025-06-03'
    }
    
    response = requests.post(
        f'{BASE_URL}/api/orders/complete/',
        json=completion_data,
        headers={'Authorization': f'Bearer {master_token}'}
    )
    
    completion_id = response.json()['id']
    
    # Одобряем
    response = requests.post(
        f'{BASE_URL}/api/orders/completions/{completion_id}/review/',
        json={'approved': True, 'curator_notes': 'Проверка баланса'},
        headers={'Authorization': f'Bearer {curator_token}'}
    )
    
    # Проверяем изменения баланса
    master_balance_after = Balance.objects.get(user=master)
    curator_balance_after = Balance.objects.get(user=curator)
    company_balance_after = CompanyBalance.objects.get(id=1)
    
    print(f"Баланс мастера после: {master_balance_after.amount} ₸")
    print(f"Баланс куратора после: {curator_balance_after.amount} ₸")
    print(f"Баланс компании после: {company_balance_after.amount} ₸")
    
    # Чистая прибыль: 20000 - 11000 = 9000
    # Мастеру 60%: 5400
    # Куратору 5%: 450
    # Компании 35%: 3150
    
    expected_master_increase = Decimal('5400.00')
    expected_curator_increase = Decimal('450.00')
    expected_company_increase = Decimal('3150.00')
    
    master_increase = master_balance_after.amount - master_balance_before.amount
    curator_increase = curator_balance_after.amount - curator_balance_before.amount
    company_increase = company_balance_after.amount - company_balance_before.amount
    
    print(f"Увеличение баланса мастера: {master_increase} ₸ (ожидалось: {expected_master_increase} ₸)")
    print(f"Увеличение баланса куратора: {curator_increase} ₸ (ожидалось: {expected_curator_increase} ₸)")
    print(f"Увеличение баланса компании: {company_increase} ₸ (ожидалось: {expected_company_increase} ₸)")
    
    success = (
        master_increase == expected_master_increase and
        curator_increase == expected_curator_increase and
        company_increase == expected_company_increase
    )
    
    if success:
        print("✅ Все балансы изменены корректно")
    else:
        print("❌ Ошибка в расчёте балансов")
    
    return success

def main():
    """Основная функция тестирования"""
    print("🧪 Запуск полного тестирования workflow завершения заказов")
    
    results = []
    
    # Тест 1: Одобрение
    try:
        results.append(test_scenario_1_approval())
    except Exception as e:
        print(f"❌ Ошибка в сценарии 1: {e}")
        results.append(False)
    
    # Тест 2: Отклонение
    try:
        results.append(test_scenario_2_rejection())
    except Exception as e:
        print(f"❌ Ошибка в сценарии 2: {e}")
        results.append(False)
    
    # Тест 3: Баланс
    try:
        results.append(test_scenario_3_balance_tracking())
    except Exception as e:
        print(f"❌ Ошибка в сценарии 3: {e}")
        results.append(False)
    
    # Итоги
    print(f"\n=== Результаты тестирования ===")
    print(f"Сценарий 1 (одобрение): {'✅' if results[0] else '❌'}")
    print(f"Сценарий 2 (отклонение): {'✅' if results[1] else '❌'}")
    print(f"Сценарий 3 (баланс): {'✅' if results[2] else '❌'}")
    
    success_count = sum(results)
    print(f"\nУспешно: {success_count}/3 тестов")
    
    if success_count == 3:
        print("🎉 Все тесты пройдены успешно!")
    else:
        print("⚠️ Некоторые тесты не пройдены")

if __name__ == '__main__':
    main()
