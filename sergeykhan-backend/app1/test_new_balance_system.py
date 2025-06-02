#!/usr/bin/env python3
"""
Тестирование новой системы управления балансами
"""

import os
import sys
import django
import requests
from decimal import Decimal

# Настройка Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app1.settings')
django.setup()

from api1.models import CustomUser, Balance, BalanceLog, TransactionLog

BASE_URL = 'http://127.0.0.1:8000'

def test_new_balance_system():
    """Тестирование новой системы управления балансами"""
    
    print("=" * 60)
    print("ТЕСТИРОВАНИЕ НОВОЙ СИСТЕМЫ УПРАВЛЕНИЯ БАЛАНСАМИ")
    print("=" * 60)
    
    # Создаем тестовых пользователей
    print("\n1. Создание тестовых пользователей...")
    
    # Супер админ
    super_admin, created = CustomUser.objects.get_or_create(
        email='super_admin@test.com',
        defaults={
            'role': 'super-admin',
        }
    )
    if created:
        super_admin.set_password('password123')
        super_admin.save()
        print(f"✓ Создан супер админ: {super_admin.email}")
    
    # Куратор
    curator, created = CustomUser.objects.get_or_create(
        email='curator@test.com',
        defaults={
            'role': 'curator',
        }
    )
    if created:
        curator.set_password('password123')
        curator.save()
        print(f"✓ Создан куратор: {curator.email}")
    
    # Мастер
    master, created = CustomUser.objects.get_or_create(
        email='master@test.com',
        defaults={
            'role': 'master',
        }
    )
    if created:
        master.set_password('password123')
        master.save()
        print(f"✓ Создан мастер: {master.email}")
    
    # Оператор
    operator, created = CustomUser.objects.get_or_create(
        email='operator@test.com',
        defaults={
            'role': 'operator',
        }
    )
    if created:
        operator.set_password('password123')
        operator.save()
        print(f"✓ Создан оператор: {operator.email}")
    
    print("\n2. Тестирование через API...")
    
    # Получаем токены аутентификации
    super_admin_token = get_auth_token('super_admin@test.com', 'password123')
    curator_token = get_auth_token('curator@test.com', 'password123')
    
    if not super_admin_token or not curator_token:
        print("❌ Ошибка аутентификации")
        return
    
    print(f"✓ Токен супер админа получен: {super_admin_token[:20]}...")
    print(f"✓ Токен куратора получен: {curator_token[:20]}...")
    
    # Тестируем права доступа
    print("\n3. Тестирование прав доступа...")
    
    # Куратор проверяет права на мастера
    response = requests.get(
        f"{BASE_URL}/api/balance/{master.id}/permissions/",
        headers={'Authorization': f'Token {curator_token}'}
    )
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Куратор может изменять баланс мастера: {data['can_modify_balance']}")
    
    # Супер админ проверяет права на оператора
    response = requests.get(
        f"{BASE_URL}/api/balance/{operator.id}/permissions/",
        headers={'Authorization': f'Token {super_admin_token}'}
    )
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Супер админ может изменять баланс оператора: {data['can_modify_balance']}")
    
    # Тестируем изменение балансов
    print("\n4. Тестирование изменения балансов...")
    
    # Супер админ пополняет текущий баланс мастера
    response = requests.post(
        f"{BASE_URL}/api/balance/{master.id}/modify/",
        headers={'Authorization': f'Token {super_admin_token}'},
        json={
            'balance_type': 'current',
            'action_type': 'top_up',
            'amount': '5000.00',
            'reason': 'Начальное пополнение баланса для тестирования'
        }
    )
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Пополнен текущий баланс мастера: {data['current_balance']}")
    else:
        print(f"❌ Ошибка пополнения баланса: {response.text}")
    
    # Супер админ добавляет к выплаченной сумме мастера
    response = requests.post(
        f"{BASE_URL}/api/balance/{master.id}/modify/",
        headers={'Authorization': f'Token {super_admin_token}'},
        json={
            'balance_type': 'paid',
            'action_type': 'top_up',
            'amount': '2000.00',
            'reason': 'Добавление к выплаченной сумме за предыдущие заказы'
        }
    )
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Добавлено к выплаченной сумме мастера: {data['paid_amount']}")
    else:
        print(f"❌ Ошибка добавления к выплаченной сумме: {response.text}")
    
    # Куратор штрафует мастера
    response = requests.post(
        f"{BASE_URL}/api/balance/{master.id}/modify/",
        headers={'Authorization': f'Token {curator_token}'},
        json={
            'balance_type': 'current',
            'action_type': 'deduct',
            'amount': '500.00',
            'reason': 'Штраф за нарушение правил работы'
        }
    )
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Куратор оштрафовал мастера: {data['current_balance']}")
    else:
        print(f"❌ Ошибка штрафа: {response.text}")
    
    # Получаем детальную информацию о балансе
    print("\n5. Получение детальной информации о балансе...")
    
    response = requests.get(
        f"{BASE_URL}/api/balance/{master.id}/detailed/",
        headers={'Authorization': f'Token {super_admin_token}'}
    )
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Текущий баланс: {data['current_balance']}")
        print(f"✓ Выплаченная сумма: {data['paid_amount']}")
        print(f"✓ Общий заработок: {data['total_earned']}")
    
    # Получаем логи изменений
    print("\n6. Получение логов изменений...")
    
    response = requests.get(
        f"{BASE_URL}/api/balance/{master.id}/logs/detailed/",
        headers={'Authorization': f'Token {super_admin_token}'}
    )
    if response.status_code == 200:
        logs = response.json()
        print(f"✓ Найдено {len(logs)} записей в логах")
        for log in logs[:3]:  # Показываем первые 3 записи
            print(f"  - {log['balance_type_display']}, {log['action_type_display']}: {log['amount']} ({log['reason']})")
    
    # Тестируем просмотр всех балансов (только для супер админа)
    print("\n7. Просмотр всех балансов...")
    
    response = requests.get(
        f"{BASE_URL}/api/balance/all/",
        headers={'Authorization': f'Token {super_admin_token}'}
    )
    if response.status_code == 200:
        balances = response.json()
        print(f"✓ Найдено {len(balances)} балансов")
        for balance in balances:
            if balance['current_balance'] != '0.00' or balance['paid_amount'] != '0.00':
                print(f"  - {balance['user_email']} ({balance['user_role']}): текущий={balance['current_balance']}, выплачено={balance['paid_amount']}")
    
    print("\n8. Проверка базы данных...")
    
    # Проверяем записи в базе данных
    balance_obj = Balance.objects.get(user=master)
    print(f"✓ Баланс мастера в БД: текущий={balance_obj.amount}, выплачено={balance_obj.paid_amount}")
    
    balance_logs = BalanceLog.objects.filter(user=master).count()
    transaction_logs = TransactionLog.objects.filter(user=master).count()
    print(f"✓ Записей в BalanceLog: {balance_logs}")
    print(f"✓ Записей в TransactionLog: {transaction_logs}")
    
    print("\n" + "=" * 60)
    print("ТЕСТИРОВАНИЕ ЗАВЕРШЕНО УСПЕШНО!")
    print("=" * 60)


def get_auth_token(email, password):
    """Получение токена аутентификации"""
    try:
        response = requests.post(f"{BASE_URL}/login/", json={
            'email': email,
            'password': password
        })
        if response.status_code == 200:
            return response.json().get('token')
    except Exception as e:
        print(f"Ошибка аутентификации: {e}")
    return None


if __name__ == "__main__":
    test_new_balance_system()
