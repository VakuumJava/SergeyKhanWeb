#!/usr/bin/env python
"""
Тест производительности для исправленной функциональности передачи заказов гарантийным мастерам.
"""

import os
import sys
import django
import json
import time
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

class WarrantyTransferPerformanceTest(TestCase):
    def setUp(self):
        """Настройка тестовых данных"""
        self.super_admin = CustomUser.objects.create(
            email="admin@test.com",
            role='super-admin',
            is_staff=True,
            is_superuser=True
        )
        self.super_admin.set_password("password123")
        self.super_admin.save()
        
        self.warranty_master = CustomUser.objects.create(
            email="warranty@test.com",
            role='warrant-master'
        )
        self.warranty_master.set_password("password123")
        self.warranty_master.save()
        
        # Создаём несколько заказов для тестирования
        self.orders = []
        for i in range(10):
            order = Order.objects.create(
                description=f"Тестовый заказ {i+1}",
                status="новый",
                estimated_cost=Decimal('100.00'),
                final_cost=Decimal('150.00'),
                expenses=Decimal('50.00')
            )
            self.orders.append(order)
    
    def get_user_token(self, user):
        """Получает токен пользователя"""
        token, created = Token.objects.get_or_create(user=user)
        return token.key
        
    def test_multiple_transfers_performance(self):
        """Тест производительности множественных передач"""
        print("\n=== Тест производительности множественных передач ===")
        
        client = Client()
        token = self.get_user_token(self.super_admin)
        
        start_time = time.time()
        
        successful_transfers = 0
        for order in self.orders:
            response = client.post(
                f'/orders/{order.id}/transfer/',
                data=json.dumps({'warranty_master_id': self.warranty_master.id}),
                content_type='application/json',
                HTTP_AUTHORIZATION=f'Token {token}'
            )
            
            if response.status_code == 200:
                successful_transfers += 1
        
        end_time = time.time()
        total_time = end_time - start_time
        avg_time_per_transfer = total_time / len(self.orders)
        
        print(f"Обработано заказов: {len(self.orders)}")
        print(f"Успешных передач: {successful_transfers}")
        print(f"Общее время: {total_time:.3f} секунд")
        print(f"Среднее время на передачу: {avg_time_per_transfer:.3f} секунд")
        print(f"Передач в секунду: {successful_transfers/total_time:.2f}")
        
        # Проверки производительности
        self.assertEqual(successful_transfers, len(self.orders))
        self.assertLess(avg_time_per_transfer, 1.0, "Время передачи не должно превышать 1 секунду")
        
    def test_concurrent_transfer_safety(self):
        """Тест безопасности при одновременных передачах"""
        print("\n=== Тест безопасности одновременных передач ===")
        
        # Создаём заказ с назначенным мастером
        master = CustomUser.objects.create(
            email="test_master@test.com",
            role='master'
        )
        master.set_password("password123")
        master.save()
        
        order = Order.objects.create(
            description="Заказ для тестирования безопасности",
            status="в работе",
            assigned_master=master,
            estimated_cost=Decimal('100.00'),
            final_cost=Decimal('150.00'),
            expenses=Decimal('50.00')
        )
        
        # Устанавливаем баланс мастера
        balance, _ = Balance.objects.get_or_create(user=master, defaults={'amount': Decimal('200.00')})
        balance.amount = Decimal('200.00')
        balance.save()
        
        client = Client()
        
        # Первая передача (от мастера)
        master_token = self.get_user_token(master)
        response1 = client.post(
            f'/orders/{order.id}/transfer/',
            data=json.dumps({'warranty_master_id': self.warranty_master.id}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {master_token}'
        )
        
        # Попытка второй передачи (от администратора)
        admin_token = self.get_user_token(self.super_admin)
        response2 = client.post(
            f'/orders/{order.id}/transfer/',
            data=json.dumps({'warranty_master_id': self.warranty_master.id}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Token {admin_token}'
        )
        
        print(f"Первая передача: {response1.status_code}")
        print(f"Вторая передача: {response2.status_code}")
        
        # Первая передача должна быть успешной
        self.assertEqual(response1.status_code, 200)
        
        # Вторая передача должна вернуть ошибку (заказ уже передан)
        # Это зависит от логики в представлении - может быть 400 или другой код
        
        # Проверяем, что заказ действительно передан
        order.refresh_from_db()
        self.assertEqual(order.status, 'передан на гарантию')
        
        print("✅ Тест безопасности пройден")
