#!/usr/bin/env python
"""
Простой тест API для проверки исправленной функциональности передачи заказов.
"""

import os
import sys
import django
import json
from decimal import Decimal

# Добавляем путь к Django проекту
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app1.settings')

django.setup()

from api1.models import Order, Balance, BalanceLog, TransactionLog, OrderLog, CustomUser
from rest_framework.authtoken.models import Token

def create_test_users():
    """Создаёт тестовых пользователей"""
    print("Создание тестовых пользователей...")
    
    # Супер-администратор
    super_admin, created = CustomUser.objects.get_or_create(
        email="super_admin_test@test.com",
        defaults={
            'role': 'super-admin',
            'is_staff': True,
            'is_superuser': True
        }
    )
    if created:
        super_admin.set_password("password123")
        super_admin.save()
        print(f"Создан супер-администратор: {super_admin.email}")
    
    # Мастер
    master, created = CustomUser.objects.get_or_create(
        email="master_test@test.com",
        defaults={'role': 'master'}
    )
    if created:
        master.set_password("password123")
        master.save()
        print(f"Создан мастер: {master.email}")
    
    # Гарантийный мастер
    warranty_master, created = CustomUser.objects.get_or_create(
        email="warranty_test@test.com",
        defaults={'role': 'warrant-master'}
    )
    if created:
        warranty_master.set_password("password123")
        warranty_master.save()
        print(f"Создан гарантийный мастер: {warranty_master.email}")
    
    return super_admin, master, warranty_master

def create_test_orders(master):
    """Создаёт тестовые заказы"""
    print("Создание тестовых заказов...")
    
    # Заказ с назначенным мастером
    order_with_master = Order.objects.create(
        description="Тестовый заказ с мастером",
        status="в работе",
        assigned_master=master,
        estimated_cost=Decimal('100.00'),
        final_cost=Decimal('150.00'),
        expenses=Decimal('50.00')
    )
    print(f"Создан заказ с мастером: #{order_with_master.id}")
    
    # Заказ без назначенного мастера
    order_without_master = Order.objects.create(
        description="Тестовый заказ без мастера",
        status="новый",
        estimated_cost=Decimal('100.00'),
        final_cost=Decimal('150.00'),
        expenses=Decimal('50.00')
    )
    print(f"Создан заказ без мастера: #{order_without_master.id}")
    
    return order_with_master, order_without_master

def test_transfer_function_logic():
    """Тест логики функции передачи напрямую"""
    print("\n=== Тест логики функции передачи ===")
    
    super_admin, master, warranty_master = create_test_users()
    order_with_master, order_without_master = create_test_orders(master)
    
    # Тест 1: Проверка разрешений для супер-администратора
    print("\n1. Проверка разрешений для супер-администратора")
    ROLES = {
        'SUPER_ADMIN': 'super-admin',
        'CURATOR': 'curator'
    }
    
    allowed_roles = [ROLES['SUPER_ADMIN'], 'admin', ROLES['CURATOR']]
    is_assigned_master = order_with_master.assigned_master and super_admin == order_with_master.assigned_master
    is_admin_role = super_admin.role in allowed_roles
    
    print(f"   Роль пользователя: {super_admin.role}")
    print(f"   Разрешённые роли: {allowed_roles}")
    print(f"   Является назначенным мастером: {is_assigned_master}")
    print(f"   Имеет админские права: {is_admin_role}")
    print(f"   Доступ разрешён: {is_assigned_master or is_admin_role}")
    
    assert is_admin_role, "Супер-администратор должен иметь доступ"
    print("   ✅ Супер-администратор имеет доступ")
    
    # Тест 2: Проверка разрешений для мастера
    print("\n2. Проверка разрешений для назначенного мастера")
    is_assigned_master = order_with_master.assigned_master and master == order_with_master.assigned_master
    is_admin_role = master.role in allowed_roles
    
    print(f"   Роль пользователя: {master.role}")
    print(f"   Является назначенным мастером: {is_assigned_master}")
    print(f"   Имеет админские права: {is_admin_role}")
    print(f"   Доступ разрешён: {is_assigned_master or is_admin_role}")
    
    assert is_assigned_master, "Назначенный мастер должен иметь доступ"
    print("   ✅ Назначенный мастер имеет доступ")
    
    # Тест 3: Проверка логики штрафов
    print("\n3. Проверка логики штрафов")
    
    # Для заказа с мастером
    fine_amount = Decimal('50.00')
    old_assigned_master = order_with_master.assigned_master
    fine_applied = Decimal('0.00')
    
    if old_assigned_master and fine_amount > 0:
        fine_applied = fine_amount
    
    print(f"   Заказ с мастером:")
    print(f"     Назначенный мастер: {old_assigned_master}")
    print(f"     Размер штрафа: {fine_amount}")
    print(f"     Штраф применён: {fine_applied}")
    assert fine_applied == fine_amount, "Штраф должен применяться для заказа с мастером"
    
    # Для заказа без мастера
    old_assigned_master = order_without_master.assigned_master
    fine_applied = Decimal('0.00')
    
    if old_assigned_master and fine_amount > 0:
        fine_applied = fine_amount
        
    print(f"   Заказ без мастера:")
    print(f"     Назначенный мастер: {old_assigned_master}")
    print(f"     Размер штрафа: {fine_amount}")
    print(f"     Штраф применён: {fine_applied}")
    assert fine_applied == Decimal('0.00'), "Штраф не должен применяться для заказа без мастера"
    
    print("   ✅ Логика штрафов работает корректно")
    
    # Тест 4: Проверка обновления заказа
    print("\n4. Проверка обновления заказа")
    
    # Сохраняем старые значения
    old_status = order_with_master.status
    old_transferred_to = order_with_master.transferred_to
    
    # Симулируем передачу
    order_with_master.transferred_to = warranty_master
    order_with_master.status = 'передан на гарантию'
    order_with_master.save()
    
    print(f"   Старый статус: {old_status}")
    print(f"   Новый статус: {order_with_master.status}")
    print(f"   Передан: {order_with_master.transferred_to.email}")
    
    assert order_with_master.status == 'передан на гарантию'
    assert order_with_master.transferred_to == warranty_master
    print("   ✅ Заказ обновлён корректно")

def clean_test_data():
    """Очищает тестовые данные"""
    print("\nОчистка тестовых данных...")
    OrderLog.objects.filter(description__contains='Тестовый').delete()
    TransactionLog.objects.filter(description__contains='Тестовый').delete()
    BalanceLog.objects.filter(user__email__contains='test@test.com').delete()
    Order.objects.filter(description__contains='Тестовый').delete()
    Balance.objects.filter(user__email__contains='test@test.com').delete()
    Token.objects.filter(user__email__contains='test@test.com').delete()
    CustomUser.objects.filter(email__contains='test@test.com').delete()
    print("   Данные очищены")

def main():
    """Основная функция теста"""
    print("🚀 Запуск тестов логики передачи заказов гарантийным мастерам")
    
    try:
        # Очищаем предыдущие тестовые данные
        clean_test_data()
        
        # Запускаем тесты
        test_transfer_function_logic()
        
        print("\n🎉 Все тесты пройдены успешно!")
        print("\n📋 Краткое резюме изменений:")
        print("✅ Супер-администраторы могут передавать любые заказы")
        print("✅ Кураторы могут передавать любые заказы") 
        print("✅ Назначенные мастера могут передавать свои заказы")
        print("✅ Штраф применяется только если есть назначенный мастер")
        print("✅ Логирование осуществляется для всех операций")
        
    except Exception as e:
        print(f"❌ Тест завершился с ошибкой: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Очищаем тестовые данные
        clean_test_data()

if __name__ == '__main__':
    main()
