#!/usr/bin/env python3
"""
Скрипт для создания тестового заказа и мастера для тестирования завершения заказа
"""
import os
import sys
import django

# Добавляем путь к Django проекту
sys.path.append('/Users/bekzhan/Documents/projects/soso/sergeykhan-backend/app1')
os.environ['DJANGO_SETTINGS_MODULE'] = 'app1.settings'

django.setup()

from api1.models import Order, CustomUser
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import BaseUserManager
from rest_framework.authtoken.models import Token

def create_test_data():
    """Создаем тестовые данные"""
    
    # Создаем мастера, если его нет
    master_email = "test_master@example.com"
    try:
        master = CustomUser.objects.get(email=master_email)
        print(f"Мастер уже существует: {master.email}")
    except CustomUser.DoesNotExist:
        master = CustomUser.objects.create(
            email=master_email,
            first_name="Тест",
            last_name="Мастер",
            role="master",
            password=make_password("test123")
        )
        print(f"Создан мастер: {master.email}")
    
    # Создаем токен для мастера
    token, created = Token.objects.get_or_create(user=master)
    print(f"Токен мастера: {token.key}")
    
    # Создаем тестовый заказ или найдем существующий
    try:
        order = Order.objects.get(id=8)
        print(f"Заказ ID=8 уже существует: {order.description}")
        
        # Назначаем заказ мастеру, если он не назначен
        if not order.assigned_master:
            order.assigned_master = master
            order.status = "назначен"
            order.save()
            print("Заказ назначен мастеру")
        elif order.assigned_master != master:
            print(f"Заказ уже назначен другому мастеру: {order.assigned_master.email}")
            print("Переназначаем заказ нашему тестовому мастеру")
            order.assigned_master = master
            order.save()
            
    except Order.DoesNotExist:
        # Создаем новый заказ
        order = Order.objects.create(
            description="Тестовый заказ для проверки завершения",
            client_name="Тестовый клиент",
            client_phone="+77771111111",
            street="Абая",
            house_number="150",
            apartment_number="25",
            estimated_cost=5000.00,
            status="назначен",
            assigned_master=master
        )
        print(f"Создан новый заказ ID={order.id}")
    
    return master, order, token.key

if __name__ == "__main__":
    master, order, token = create_test_data()
    if master and order:
        print(f"\n=== ДАННЫЕ ДЛЯ ТЕСТИРОВАНИЯ ===")
        print(f"Мастер: {master.email}")
        print(f"Пароль: test123")
        print(f"Токен: {token}")
        print(f"Заказ ID: {order.id}")
        print(f"Статус заказа: {order.status}")
        print(f"\nДля тестирования в браузере:")
        print(f"1. Войдите как {master.email} с паролем test123")
        print(f"2. Найдите заказ ID={order.id}")
        print(f"3. Попробуйте его завершить")
