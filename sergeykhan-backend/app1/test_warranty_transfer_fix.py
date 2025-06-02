#!/usr/bin/env python
"""
Тест для проверки исправленной функциональности передачи заказов гарантийным мастерам.

Тестирует:
1. Передачу заказа с назначенным мастером (должен быть оштрафован)
2. Передачу заказа без назначенного мастера (штраф не применяется)
3. Передачу администратором/супер-администратором/куратором
4. Отказ в доступе обычному пользователю без прав
5. Логирование передач и штрафов
"""

import os
import sys
import django
import json
from decimal import Decimal

# Настройка Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app1.settings')
django.setup()

from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from api1.models import Order, Balance, BalanceLog, TransactionLog, OrderLog, CustomUser
from rest_framework.authtoken.models import Token

User = get_user_model()

class WarrantyTransferAPITest(TestCase):
    def setUp(self):
        """Настройка тестовых данных"""
        self.super_admin, self.curator, self.master, self.warranty_master, self.regular_user = self.create_test_users()
        self.order_with_master, self.order_without_master = self.create_test_orders()
        
    def create_test_users(self):
        """Создаёт тестовых пользователей"""
        # Супер-администратор
        super_admin = CustomUser.objects.create(
            email="super_admin@test.com",
            role='super-admin',
            is_staff=True,
            is_superuser=True
        )
        super_admin.set_password("password123")
        super_admin.save()
        
        # Куратор
        curator = CustomUser.objects.create(
            email="curator@test.com",
            role='curator'
        )
        curator.set_password("password123")
        curator.save()
        
        # Мастер
        master = CustomUser.objects.create(
            email="master@test.com",
            role='master'
        )
        master.set_password("password123")
        master.save()
        
        # Гарантийный мастер
        warranty_master = CustomUser.objects.create(
            email="warranty@test.com",
            role='warrant-master'
        )
        warranty_master.set_password("password123")
        warranty_master.save()
        
        # Обычный пользователь (без прав)
        regular_user = CustomUser.objects.create(
            email="regular@test.com",
            role='master'
        )
        regular_user.set_password("password123")
        regular_user.save()
        
        return super_admin, curator, master, warranty_master, regular_user
    
    def create_test_orders(self):
        """Создаёт тестовые заказы"""
        # Заказ с назначенным мастером
        order_with_master = Order.objects.create(
            description="Заказ с назначенным мастером",
            status="в работе",
            assigned_master=self.master,
            estimated_cost=Decimal('100.00'),
            final_cost=Decimal('150.00'),
            expenses=Decimal('50.00')
        )
        
        # Заказ без назначенного мастера
        order_without_master = Order.objects.create(
            description="Заказ без назначенного мастера",
            status="новый",
            estimated_cost=Decimal('100.00'),
            final_cost=Decimal('150.00'),
            expenses=Decimal('50.00')
        )
        
        return order_with_master, order_without_master
    
    def get_user_token(self, user):
        """Получает токен пользователя"""
        token, created = Token.objects.get_or_create(user=user)
        return token.key
        
    def test_transfer_with_assigned_master(self):
        """Тест передачи заказа с назначенным мастером"""
        print("\n=== Тест 1: Передача заказа с назначенным мастером ===")
        
        # Устанавливаем баланс мастера
        balance, _ = Balance.objects.get_or_create(user=self.master, defaults={'amount': Decimal('200.00')})
        balance.amount = Decimal('200.00')
        balance.save()
        
        client = Client()
        token = self.get_user_token(self.master)
        
        response = client.post(
            f'/api/orders/{self.order_with_master.id}/transfer/',
            data=json.dumps({'warranty_master_id': self.warranty_master.id}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {token}'
        )
        
        print(f"Статус ответа: {response.status_code}")
        if response.status_code != 200:
            print(f"Ошибка: {response.content}")
        else:
            print(f"Содержимое ответа: {response.json()}")
        
        # Проверки
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data['fine_applied'], 50.0)
        self.assertEqual(response_data['had_assigned_master'], True)
        
        # Проверяем обновление заказа
        self.order_with_master.refresh_from_db()
        self.assertEqual(self.order_with_master.status, 'передан на гарантию')
        
    def test_transfer_without_assigned_master(self):
        """Тест передачи заказа без назначенного мастера"""
        print("\n=== Тест 2: Передача заказа без назначенного мастера ===")
        
        client = Client()
        token = self.get_user_token(self.super_admin)
        
        response = client.post(
            f'/api/orders/{self.order_without_master.id}/transfer/',
            data=json.dumps({'warranty_master_id': self.warranty_master.id}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {token}'
        )
        
        print(f"Статус ответа: {response.status_code}")
        if response.status_code != 200:
            print(f"Ошибка: {response.content}")
        else:
            print(f"Содержимое ответа: {response.json()}")
        
        # Проверки
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data['fine_applied'], 0.0)
        self.assertEqual(response_data['had_assigned_master'], False)
        
        # Проверяем обновление заказа
        self.order_without_master.refresh_from_db()
        self.assertEqual(self.order_without_master.status, 'передан на гарантию')
        
    def test_admin_transfer_permission(self):
        """Тест передачи заказа администратором"""
        print("\n=== Тест 3: Передача заказа администратором ===")
        
        client = Client()
        token = self.get_user_token(self.super_admin)
        
        response = client.post(
            f'/api/orders/{self.order_with_master.id}/transfer/',
            data=json.dumps({'warranty_master_id': self.warranty_master.id}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {token}'
        )
        
        print(f"Статус ответа: {response.status_code}")
        if response.status_code != 200:
            print(f"Ошибка: {response.content}")
        else:
            print(f"Содержимое ответа: {response.json()}")
        
        # Проверки
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data['transferred_by_role'], 'super-admin')
        
    def test_unauthorized_transfer_attempt(self):
        """Тест попытки передачи заказа неавторизованным пользователем"""
        print("\n=== Тест 4: Попытка передачи неавторизованным пользователем ===")
        
        client = Client()
        token = self.get_user_token(self.regular_user)
        
        response = client.post(
            f'/api/orders/{self.order_with_master.id}/transfer/',
            data=json.dumps({'warranty_master_id': self.warranty_master.id}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {token}'
        )
        
        print(f"Статус ответа: {response.status_code}")
        print(f"Содержимое ответа: {response.json()}")
        
        # Проверки
        self.assertEqual(response.status_code, 403)
        defaults={'role': 'master'}
    )
    if created:
        master.set_password("password123")
        master.save()
    
    # Гарантийный мастер
    warranty_master, created = CustomUser.objects.get_or_create(
        email="warranty@test.com",
        defaults={'role': 'warrant-master'}
    )
    if created:
        warranty_master.set_password("password123")
        warranty_master.save()
    
    # Обычный пользователь (без прав)
    regular_user, created = CustomUser.objects.get_or_create(
        email="regular@test.com",
        defaults={'role': 'master'}  # обычный мастер, но не назначенный на заказ
    )
    if created:
        regular_user.set_password("password123")
        regular_user.save()
    
    return super_admin, curator, master, warranty_master, regular_user

def create_test_orders(master, warranty_master):
    """Создаёт тестовые заказы"""
    print("Создание тестовых заказов...")
    
    # Заказ с назначенным мастером
    order_with_master = Order.objects.create(
        description="Заказ с назначенным мастером",
        status="в работе",
        assigned_master=master,
        estimated_cost=Decimal('100.00'),
        final_cost=Decimal('150.00'),
        expenses=Decimal('50.00')
    )
    
    # Заказ без назначенного мастера
    order_without_master = Order.objects.create(
        description="Заказ без назначенного мастера",
        status="новый",
        estimated_cost=Decimal('100.00'),
        final_cost=Decimal('150.00'),
        expenses=Decimal('50.00')
    )
    
    return order_with_master, order_without_master

def get_user_token(user):
    """Получает токен пользователя"""
    token, created = Token.objects.get_or_create(user=user)
    return token.key

def test_transfer_with_assigned_master():
    """Тест передачи заказа с назначенным мастером (от самого мастера)"""
    print("\n=== Тест 1: Передача заказа с назначенным мастером ===")
    
    super_admin, curator, master, warranty_master, regular_user = create_test_users()
    order_with_master, order_without_master = create_test_orders(master, warranty_master)
    
    # Устанавливаем баланс мастера
    balance, _ = Balance.objects.get_or_create(user=master, defaults={'amount': Decimal('200.00')})
    balance.amount = Decimal('200.00')
    balance.save()
    
    old_balance = balance.amount
    
    client = Client()
    token = get_user_token(master)
    
    response = client.post(
        f'/api/orders/{order_with_master.id}/transfer/',
        data=json.dumps({'warranty_master_id': warranty_master.id}),
        content_type='application/json',
        HTTP_AUTHORIZATION=f'Token {token}'
    )
    
    print(f"Статус ответа: {response.status_code}")
    print(f"Содержимое ответа: {response.json()}")
    
    # Проверки
    assert response.status_code == 200, f"Ожидался статус 200, получен {response.status_code}"
    response_data = response.json()
    assert response_data['fine_applied'] == 50.0, f"Ожидался штраф 50.0, получен {response_data['fine_applied']}"
    assert response_data['had_assigned_master'] == True, "Ожидалось, что мастер был назначен"
    
    # Проверяем обновление заказа
    order_with_master.refresh_from_db()
    assert order_with_master.status == 'передан на гарантию'
    assert order_with_master.transferred_to == warranty_master
    
    # Проверяем баланс мастера
    balance.refresh_from_db()
    expected_balance = old_balance - Decimal('50.00')
    assert balance.amount == expected_balance, f"Ожидался баланс {expected_balance}, получен {balance.amount}"
    
    # Проверяем логи
    assert BalanceLog.objects.filter(user=master, action='fine_transfer').exists()
    assert TransactionLog.objects.filter(user=master, transaction_type='balance_deduct').exists()
    assert OrderLog.objects.filter(order=order_with_master, action='transferred').exists()
    
    print("✅ Тест 1 пройден успешно!")

def test_transfer_without_assigned_master():
    """Тест передачи заказа без назначенного мастера (администратором)"""
    print("\n=== Тест 2: Передача заказа без назначенного мастера ===")
    
    super_admin, curator, master, warranty_master, regular_user = create_test_users()
    order_with_master, order_without_master = create_test_orders(master, warranty_master)
    
    client = Client()
    token = get_user_token(super_admin)
    
    response = client.post(
        f'/api/orders/{order_without_master.id}/transfer/',
        data=json.dumps({'warranty_master_id': warranty_master.id}),
        content_type='application/json',
        HTTP_AUTHORIZATION=f'Token {token}'
    )
    
    print(f"Статус ответа: {response.status_code}")
    print(f"Содержимое ответа: {response.json()}")
    
    # Проверки
    assert response.status_code == 200, f"Ожидался статус 200, получен {response.status_code}"
    response_data = response.json()
    assert response_data['fine_applied'] == 0.0, f"Ожидался штраф 0.0, получен {response_data['fine_applied']}"
    assert response_data['had_assigned_master'] == False, "Ожидалось, что мастер не был назначен"
    assert response_data['transferred_by_role'] == 'super-admin', "Ожидалась роль super-admin"
    
    # Проверяем обновление заказа
    order_without_master.refresh_from_db()
    assert order_without_master.status == 'передан на гарантию'
    assert order_without_master.transferred_to == warranty_master
    
    # Проверяем, что штрафных логов нет
    assert not BalanceLog.objects.filter(action='fine_transfer', amount=-50.0).exists()
    
    # Проверяем логи передачи
    assert OrderLog.objects.filter(order=order_without_master, action='transferred').exists()
    
    print("✅ Тест 2 пройден успешно!")

def test_transfer_by_curator():
    """Тест передачи заказа куратором"""
    print("\n=== Тест 3: Передача заказа куратором ===")
    
    super_admin, curator, master, warranty_master, regular_user = create_test_users()
    order_with_master, order_without_master = create_test_orders(master, warranty_master)
    
    # Используем заказ с назначенным мастером для проверки штрафа
    balance, _ = Balance.objects.get_or_create(user=master, defaults={'amount': Decimal('300.00')})
    balance.amount = Decimal('300.00')
    balance.save()
    
    client = Client()
    token = get_user_token(curator)
    
    response = client.post(
        f'/api/orders/{order_with_master.id}/transfer/',
        data=json.dumps({'warranty_master_id': warranty_master.id}),
        content_type='application/json',
        HTTP_AUTHORIZATION=f'Token {token}'
    )
    
    print(f"Статус ответа: {response.status_code}")
    print(f"Содержимое ответа: {response.json()}")
    
    # Проверки
    assert response.status_code == 200, f"Ожидался статус 200, получен {response.status_code}"
    response_data = response.json()
    assert response_data['transferred_by_role'] == 'curator', "Ожидалась роль curator"
    assert response_data['fine_applied'] == 50.0, "Штраф должен применяться даже при передаче куратором"
    
    print("✅ Тест 3 пройден успешно!")

def test_transfer_denied_for_unauthorized_user():
    """Тест отказа в передаче для неавторизованного пользователя"""
    print("\n=== Тест 4: Отказ в доступе неавторизованному пользователю ===")
    
    super_admin, curator, master, warranty_master, regular_user = create_test_users()
    order_with_master, order_without_master = create_test_orders(master, warranty_master)
    
    client = Client()
    token = get_user_token(regular_user)  # Обычный пользователь без прав на этот заказ
    
    response = client.post(
        f'/api/orders/{order_with_master.id}/transfer/',
        data=json.dumps({'warranty_master_id': warranty_master.id}),
        content_type='application/json',
        HTTP_AUTHORIZATION=f'Token {token}'
    )
    
    print(f"Статус ответа: {response.status_code}")
    print(f"Содержимое ответа: {response.json()}")
    
    # Проверки
    assert response.status_code == 403, f"Ожидался статус 403, получен {response.status_code}"
    response_data = response.json()
    assert 'Insufficient permissions' in response_data['error']
    
    print("✅ Тест 4 пройден успешно!")

def clean_test_data():
    """Очищает тестовые данные"""
    print("\nОчистка тестовых данных...")
    OrderLog.objects.filter(description__contains='test').delete()
    TransactionLog.objects.filter(description__contains='test').delete()
    BalanceLog.objects.filter(user__email__contains='test').delete()
    Order.objects.filter(description__contains='Заказ').delete()
    Balance.objects.filter(user__email__contains='test').delete()
    Token.objects.filter(user__email__contains='test').delete()
    CustomUser.objects.filter(email__contains='test').delete()

def main():
    """Основная функция теста"""
    print("🚀 Запуск тестов исправленной функциональности передачи заказов гарантийным мастерам")
    
    try:
        # Очищаем предыдущие тестовые данные
        clean_test_data()
        
        # Запускаем тесты
        test_transfer_with_assigned_master()
        test_transfer_without_assigned_master()
        test_transfer_by_curator()
        test_transfer_denied_for_unauthorized_user()
        
        print("\n🎉 Все тесты пройдены успешно!")
        print("\n📋 Краткое резюме:")
        print("✅ Передача заказов с назначенным мастером работает (штраф применяется)")
        print("✅ Передача заказов без назначенного мастера работает (штраф не применяется)")
        print("✅ Передача администраторами/кураторами работает")
        print("✅ Доступ запрещён неавторизованным пользователям")
        print("✅ Логирование работает корректно")
        
    except Exception as e:
        print(f"❌ Тест завершился с ошибкой: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Очищаем тестовые данные
        clean_test_data()

if __name__ == '__main__':
    main()
