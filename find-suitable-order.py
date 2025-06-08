#!/usr/bin/env python3

import requests
import json

# Настройки
BASE_URL = "http://127.0.0.1:8000"
MASTER_EMAIL = "test_master@completion.com"
MASTER_PASSWORD = "test123"
MASTER_ID = 13

def login_master():
    """Авторизация мастера"""
    login_data = {
        "email": MASTER_EMAIL,
        "password": MASTER_PASSWORD
    }
    
    response = requests.post(f"{BASE_URL}/login/", json=login_data)
    if response.status_code == 200:
        token = response.json().get("token")
        print(f"✅ Авторизация мастера успешна")
        return token
    else:
        print(f"❌ Ошибка авторизации мастера: {response.status_code}")
        print(response.text)
        return None

def find_suitable_order(token):
    """Находим подходящий заказ для завершения"""
    headers = {"Authorization": f"Token {token}"}
    
    # Получаем все заказы
    response = requests.get(f"{BASE_URL}/api/orders/all/", headers=headers)
    if response.status_code != 200:
        print(f"❌ Ошибка получения заказов: {response.status_code}")
        return None
    
    orders = response.json()
    suitable_orders = []
    
    print("🔍 Анализируем заказы:")
    for order in orders:
        order_id = order.get('id')
        status = order.get('status')
        assigned_master = order.get('assigned_master')
        has_completion = 'completion' in order and order['completion']
        
        print(f"   ID: {order_id}, Статус: {status}, Мастер: {assigned_master}, Завершение: {has_completion}")
        
        # Ищем заказы в правильном статусе, назначенные нашему мастеру и без завершения
        if (status in ['выполняется', 'назначен'] and 
            assigned_master == MASTER_ID and 
            not has_completion):
            suitable_orders.append(order)
    
    if suitable_orders:
        best_order = suitable_orders[0]
        print(f"\n✅ Найден подходящий заказ: ID={best_order['id']}, статус={best_order['status']}")
        return best_order['id']
    else:
        print("\n❌ Не найдено подходящих заказов")
        return None

def assign_order_to_master(token, order_id):
    """Назначаем заказ нашему мастеру и меняем статус"""
    headers = {"Authorization": f"Token {token}"}
    
    # Попробуем обновить заказ
    update_data = {
        "assigned_master": MASTER_ID,
        "status": "выполняется"
    }
    
    response = requests.patch(f"{BASE_URL}/api/orders/{order_id}/update/", 
                            headers=headers, json=update_data)
    
    print(f"🔄 Попытка обновления заказа {order_id}:")
    print(f"   Статус: {response.status_code}")
    print(f"   Ответ: {response.text}")
    
    return response.status_code == 200

if __name__ == "__main__":
    print("🎯 Поиск подходящего заказа для завершения...")
    
    # Авторизация мастера
    token = login_master()
    if not token:
        exit(1)
    
    # Ищем подходящий заказ
    order_id = find_suitable_order(token)
    
    if not order_id:
        # Если нет подходящего заказа, попробуем назначить первый доступный
        print("\n🔄 Пробуем назначить заказ нашему мастеру...")
        
        # Берем любой заказ без завершения
        response = requests.get(f"{BASE_URL}/api/orders/all/", 
                              headers={"Authorization": f"Token {token}"})
        
        if response.status_code == 200:
            orders = response.json()
            for order in orders:
                if not ('completion' in order and order['completion']):
                    test_order_id = order['id']
                    print(f"Пробуем заказ {test_order_id}")
                    if assign_order_to_master(token, test_order_id):
                        order_id = test_order_id
                        break
    
    if order_id:
        print(f"\n🎯 Используйте ORDER_ID = {order_id} в test-completion-debug.py")
    else:
        print("\n❌ Не удалось найти или подготовить заказ для тестирования")
