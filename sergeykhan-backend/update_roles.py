#!/usr/bin/env python3
"""
Скрипт для обновления ролей существующих пользователей
"""

import os
import sys
import django

# Добавляем путь к Django проекту
sys.path.append('/Users/bekzhan/Documents/projects/sit/sergeykhan-backend/app1')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app1.settings')

django.setup()

from api1.models import CustomUser

def update_user_roles():
    """Обновляет роли пользователей согласно новой схеме"""
    
    # Маппинг старых ролей к новым
    role_mapping = {
        'admin': 'super-admin',
        'warranty_master': 'warrant-master',
        # Остальные роли остаются без изменений
        'master': 'master',
        'operator': 'operator',
        'curator': 'curator'
    }
    
    users_updated = 0
    
    for user in CustomUser.objects.all():
        old_role = user.role
        new_role = role_mapping.get(old_role, old_role)
        
        if old_role != new_role:
            user.role = new_role
            user.save()
            users_updated += 1
            print(f"Обновлен пользователь {user.email}: {old_role} -> {new_role}")
    
    print(f"\nВсего обновлено пользователей: {users_updated}")
    
    # Выводим статистику по ролям
    print("\nТекущее распределение ролей:")
    for role_key, role_name in CustomUser.ROLE_CHOICES:
        count = CustomUser.objects.filter(role=role_key).count()
        print(f"  {role_name}: {count}")

if __name__ == '__main__':
    print("Начинаем обновление ролей пользователей...")
    update_user_roles()
    print("Обновление завершено!")
