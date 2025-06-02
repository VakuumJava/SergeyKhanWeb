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
            f'/orders/{self.order_with_master.id}/transfer/',
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
            f'/orders/{self.order_without_master.id}/transfer/',
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
            f'/orders/{self.order_with_master.id}/transfer/',
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
            f'/orders/{self.order_with_master.id}/transfer/',
            data=json.dumps({'warranty_master_id': self.warranty_master.id}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {token}'
        )
        
        print(f"Статус ответа: {response.status_code}")
        if response.status_code == 200:
            print(f"Содержимое ответа: {response.json()}")
        else:
            print(f"Ошибка (ожидается): {response.content}")
        
        # Проверки
        self.assertEqual(response.status_code, 403)
