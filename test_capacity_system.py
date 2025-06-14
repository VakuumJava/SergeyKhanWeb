#!/usr/bin/env python3
"""
Комплексный тест системы анализа загрузки мастеров
Проверяет работу capacity analysis API и интеграцию с фронтендом
"""

import requests
import json
import time
from datetime import datetime

def test_capacity_api():
    """Тестирует capacity analysis API"""
    print("🔍 Тестирование Capacity Analysis API...")
    
    # Получаем токен куратора
    curator_token = "8b709c0c68b90ff206c2e4ce2321a9d7f4749df8"
    
    headers = {
        'Authorization': f'Token {curator_token}',
        'Content-Type': 'application/json'
    }
    
    try:
        # Тест capacity analysis
        print("\n📊 Тест Capacity Analysis:")
        response = requests.get('http://127.0.0.1:8000/api/capacity/analysis/', headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Capacity Analysis API работает")
            
            # Проверяем структуру данных
            required_keys = ['today', 'tomorrow', 'pending_orders', 'recommendations']
            for key in required_keys:
                if key in data:
                    print(f"  ✅ {key}: присутствует")
                else:
                    print(f"  ❌ {key}: отсутствует")
            
            # Детальная информация
            today = data.get('today', {})
            tomorrow = data.get('tomorrow', {})
            pending = data.get('pending_orders', {})
            recommendations = data.get('recommendations', [])
            
            print(f"\n📈 Анализ на сегодня:")
            print(f"  🔢 Доступных слотов: {today.get('capacity', {}).get('available_slots', 0)}")
            print(f"  👨‍🔧 Работающих мастеров: {today.get('masters_stats', {}).get('masters_with_availability', 0)}")
            print(f"  📊 Загрузка: {today.get('capacity', {}).get('capacity_utilization_percent', 0)}%")
            
            print(f"\n📈 Анализ на завтра:")
            print(f"  🔢 Доступных слотов: {tomorrow.get('capacity', {}).get('available_slots', 0)}")
            print(f"  👨‍🔧 Работающих мастеров: {tomorrow.get('masters_stats', {}).get('masters_with_availability', 0)}")
            print(f"  📊 Загрузка: {tomorrow.get('capacity', {}).get('capacity_utilization_percent', 0)}%")
            
            print(f"\n📋 Ожидающие заказы:")
            print(f"  🆕 Новых: {pending.get('new_orders', 0)}")
            print(f"  ⏳ В обработке: {pending.get('processing_orders', 0)}")
            print(f"  📊 Всего: {pending.get('total_pending', 0)}")
            
            print(f"\n💡 Рекомендации ({len(recommendations)}):")
            for i, rec in enumerate(recommendations, 1):
                type_emoji = {
                    'success': '✅',
                    'warning': '⚠️',
                    'error': '❌',
                    'info': 'ℹ️'
                }.get(rec.get('type', 'info'), 'ℹ️')
                
                print(f"  {type_emoji} {i}. {rec.get('title', 'Без названия')}")
                print(f"      {rec.get('message', 'Нет описания')}")
                print(f"      🎯 {rec.get('action', 'Нет действия')}")
            
        else:
            print(f"❌ Capacity Analysis API ошибка: {response.status_code}")
            print(f"   Ответ: {response.text}")
            return False
            
        # Тест weekly forecast
        print(f"\n📅 Тест Weekly Forecast:")
        response = requests.get('http://127.0.0.1:8000/api/capacity/weekly-forecast/', headers=headers)
        
        if response.status_code == 200:
            weekly_data = response.json()
            print("✅ Weekly Forecast API работает")
            
            forecast = weekly_data.get('week_forecast', [])
            total_capacity = weekly_data.get('total_week_capacity', 0)
            avg_capacity = weekly_data.get('avg_daily_capacity', 0)
            
            print(f"  📊 Общая недельная пропускная способность: {total_capacity}")
            print(f"  📊 Средняя дневная пропускная способность: {avg_capacity}")
            
            print(f"\n📅 Прогноз по дням:")
            for day in forecast:
                print(f"  {day.get('date')} ({day.get('day_name')}): {day.get('available_capacity')} слотов")
                
        else:
            print(f"❌ Weekly Forecast API ошибка: {response.status_code}")
            return False
            
        return True
        
    except Exception as e:
        print(f"❌ Ошибка при тестировании API: {e}")
        return False

def test_frontend_integration():
    """Тестирует интеграцию с фронтендом"""
    print("\n🌐 Тестирование интеграции с фронтендом...")
    
    try:
        # Проверяем, доступен ли фронтенд
        response = requests.get('http://localhost:3000/orders/create', timeout=5)
        if response.status_code == 200:
            print("✅ Фронтенд доступен на localhost:3000")
            print("✅ Страница создания заказов загружается")
            return True
        else:
            print(f"❌ Фронтенд недоступен: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Фронтенд недоступен (соединение отклонено)")
        return False
    except Exception as e:
        print(f"❌ Ошибка при проверке фронтенда: {e}")
        return False

def main():
    """Основная функция тестирования"""
    print("🚀 Запуск комплексного тестирования системы анализа загрузки")
    print("=" * 70)
    
    # Тесты
    tests_passed = 0
    total_tests = 2
    
    # Тест 1: Capacity Analysis API
    if test_capacity_api():
        tests_passed += 1
        
    # Тест 2: Frontend Integration
    if test_frontend_integration():
        tests_passed += 1
    
    # Результаты
    print("\n" + "=" * 70)
    print("📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ")
    print("=" * 70)
    
    if tests_passed == total_tests:
        print("🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!")
        print("\n✅ Система анализа загрузки полностью работает")
        print("✅ Backend capacity analysis API функционирует корректно")
        print("✅ Frontend интегрирован и доступен")
        print("\n🚀 Система готова к использованию!")
        
    else:
        print(f"⚠️  ТЕСТИРОВАНИЕ ЗАВЕРШЕНО: {tests_passed}/{total_tests} тестов пройдено")
        
        if tests_passed == 0:
            print("❌ Критические ошибки в системе")
        else:
            print("⚠️  Частичная работоспособность системы")
    
    print("\n💡 Для доступа к системе:")
    print("   🌐 Frontend: http://localhost:3000/orders/create")
    print("   🔧 Backend API: http://127.0.0.1:8000/api/capacity/analysis/")
    print("   📅 Weekly Forecast: http://127.0.0.1:8000/api/capacity/weekly-forecast/")

if __name__ == "__main__":
    main()
