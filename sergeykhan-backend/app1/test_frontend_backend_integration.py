#!/usr/bin/env python3
"""
Тест интеграции frontend-backend для новой системы управления балансами
"""
import requests
import json

# Конфигурация
BASE_URL = "http://localhost:8000"
FRONTEND_CURATOR_URL = "http://localhost:3000"
FRONTEND_SUPER_ADMIN_URL = "http://localhost:3001"

def test_api_endpoints():
    """Тестирование всех API endpoints новой системы балансов"""
    print("=" * 60)
    print("ТЕСТИРОВАНИЕ API ENDPOINTS ДЛЯ FRONTEND ИНТЕГРАЦИИ")
    print("=" * 60)
    
    # Получаем токены
    print("\n1. Получение токенов...")
    
    # Супер админ
    admin_response = requests.post(f"{BASE_URL}/login/", {
        'email': 'admin@gmail.com',
        'password': 'admin123'
    })
    
    if admin_response.status_code == 200:
        admin_token = admin_response.json()['token']
        print(f"✓ Токен супер админа: {admin_token[:20]}...")
    else:
        print("✗ Ошибка получения токена супер админа")
        return False
    
    # Куратор
    curator_response = requests.post(f"{BASE_URL}/login/", {
        'email': 'maksim@gmail.com',
        'password': 'maksim123'
    })
    
    if curator_response.status_code == 200:
        curator_token = curator_response.json()['token']
        print(f"✓ Токен куратора: {curator_token[:20]}...")
    else:
        print("✗ Ошибка получения токена куратора")
        return False
    
    # Тестируем API endpoints
    print("\n2. Тестирование API endpoints...")
    
    # Получение всех балансов (супер админ)
    response = requests.get(
        f"{BASE_URL}/api/balance/all/",
        headers={'Authorization': f'Token {admin_token}'}
    )
    
    if response.status_code == 200:
        balances = response.json()
        print(f"✓ Получено {len(balances)} балансов через API")
        
        # Выводим первые 3 для проверки структуры данных
        for i, balance in enumerate(balances[:3]):
            print(f"  - {balance['email']}: текущий={balance['current_balance']}, выплачено={balance['paid_amount']}")
            
    else:
        print(f"✗ Ошибка получения всех балансов: {response.status_code}")
        return False
    
    # Тестируем детальную информацию о балансе
    test_user_id = balances[0]['user_id'] if balances else 1
    
    response = requests.get(
        f"{BASE_URL}/api/balance/{test_user_id}/detailed/",
        headers={'Authorization': f'Token {admin_token}'}
    )
    
    if response.status_code == 200:
        balance_detail = response.json()
        print(f"✓ Детальная информация о балансе пользователя {test_user_id}:")
        print(f"  - Текущий баланс: {balance_detail['current_balance']}")
        print(f"  - Выплачено: {balance_detail['paid_amount']}")
        print(f"  - Общий заработок: {balance_detail['total_earned']}")
    else:
        print(f"✗ Ошибка получения детальной информации: {response.status_code}")
        return False
    
    # Тестируем логи
    response = requests.get(
        f"{BASE_URL}/api/balance/{test_user_id}/logs/detailed/",
        headers={'Authorization': f'Token {admin_token}'}
    )
    
    if response.status_code == 200:
        logs = response.json()
        print(f"✓ Получено {len(logs)} записей в логах")
    else:
        print(f"✗ Ошибка получения логов: {response.status_code}")
        return False
    
    # Тестируем права доступа
    response = requests.get(
        f"{BASE_URL}/api/balance/{test_user_id}/permissions/",
        headers={'Authorization': f'Token {curator_token}'}
    )
    
    if response.status_code == 200:
        permissions = response.json()
        print(f"✓ Права куратора: может изменять={permissions['can_modify']}")
    else:
        print(f"✗ Ошибка проверки прав: {response.status_code}")
        return False
    
    print("\n✓ Все API endpoints работают корректно!")
    return True

def check_frontend_status():
    """Проверка доступности frontend приложений"""
    print("\n3. Проверка статуса frontend приложений...")
    
    try:
        curator_response = requests.get(FRONTEND_CURATOR_URL, timeout=5)
        if curator_response.status_code == 200:
            print(f"✓ Curator приложение доступно на {FRONTEND_CURATOR_URL}")
        else:
            print(f"⚠ Curator приложение отвечает с кодом {curator_response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"✗ Curator приложение недоступно: {e}")
    
    try:
        admin_response = requests.get(FRONTEND_SUPER_ADMIN_URL, timeout=5)
        if admin_response.status_code == 200:
            print(f"✓ Super-admin приложение доступно на {FRONTEND_SUPER_ADMIN_URL}")
        else:
            print(f"⚠ Super-admin приложение отвечает с кодом {admin_response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"✗ Super-admin приложение недоступно: {e}")

def test_cors_and_api_integration():
    """Тестирование CORS и интеграции API"""
    print("\n4. Тестирование CORS и интеграции...")
    
    # Симулируем запрос от frontend
    headers = {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization,content-type'
    }
    
    response = requests.options(f"{BASE_URL}/api/balance/all/", headers=headers)
    
    if response.status_code in [200, 204]:
        print("✓ CORS настроен корректно")
        
        # Проверяем заголовки CORS
        cors_headers = response.headers
        if 'Access-Control-Allow-Origin' in cors_headers:
            print(f"✓ Access-Control-Allow-Origin: {cors_headers['Access-Control-Allow-Origin']}")
        if 'Access-Control-Allow-Methods' in cors_headers:
            print(f"✓ Access-Control-Allow-Methods: {cors_headers['Access-Control-Allow-Methods']}")
            
    else:
        print(f"⚠ CORS может быть не настроен: {response.status_code}")

def main():
    """Основная функция теста"""
    print("ИНТЕГРАЦИОННОЕ ТЕСТИРОВАНИЕ FRONTEND-BACKEND")
    print("=" * 60)
    
    # Проверяем доступность backend
    try:
        response = requests.get(f"{BASE_URL}/health/", timeout=5)
        if response.status_code == 200:
            print("✓ Django backend доступен")
        else:
            print("⚠ Django backend отвечает с нестандартным кодом")
    except requests.exceptions.RequestException:
        try:
            # Пробуем альтернативный endpoint
            response = requests.get(f"{BASE_URL}/admin/", timeout=5)
            print("✓ Django backend доступен (через /admin/)")
        except requests.exceptions.RequestException as e:
            print(f"✗ Django backend недоступен: {e}")
            return False
    
    # Запускаем тесты
    if test_api_endpoints():
        check_frontend_status()
        test_cors_and_api_integration()
        
        print("\n" + "=" * 60)
        print("РЕЗУЛЬТАТ: ✓ ИНТЕГРАЦИЯ ГОТОВА К ТЕСТИРОВАНИЮ!")
        print("=" * 60)
        print("\nДля тестирования UI:")
        print(f"1. Curator приложение: {FRONTEND_CURATOR_URL}")
        print(f"2. Super-admin приложение: {FRONTEND_SUPER_ADMIN_URL}")
        print("\nТестовые аккаунты:")
        print("- Куратор: maksim@gmail.com / maksim123")
        print("- Супер админ: admin@gmail.com / admin123")
        print("- Мастер: master@test.com / master123")
        
        return True
    else:
        print("\n✗ Обнаружены проблемы в API")
        return False

if __name__ == "__main__":
    main()
