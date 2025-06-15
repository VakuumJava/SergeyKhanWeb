# Исправление проблемы с отсутствием слотов мастеров

## Обнаруженные проблемы

### 1. ❌ Расписание мастера не сохранялось
**Файл:** `sergeykhan-backend/app1/api1/schedule_views.py`
**Проблема:** Функция `save_master_schedule()` только логировала данные, но НЕ сохраняла их в базу данных

### 2. ❌ Расписание мастера возвращалось пустым
**Файл:** `sergeykhan-backend/app1/api1/schedule_views.py`  
**Проблема:** Функция `get_master_schedule()` возвращала пустой массив вместо реальных данных из БД

### 3. ❌ Устаревшая система прав доступа
**Проблема:** Код использовал старую систему Groups вместо новой системы ролей (role field)

## Внесённые исправления

### ✅ 1. Исправлена функция сохранения расписания

```python
def save_master_schedule(request, master_user):
    """Сохранить расписание мастера в базу данных"""
    try:
        data = json.loads(request.body)
        schedule_data = data.get('schedule', [])
        
        # Валидация данных
        # ... 
        
        # Сохранение в БД с транзакцией
        with transaction.atomic():
            # Удаляем существующие слоты для обновляемых дат
            dates_to_update = [day_schedule['date'] for day_schedule in schedule_data]
            MasterAvailability.objects.filter(
                master=master_user,
                date__in=dates_to_update,
                date__gte=date.today()
            ).delete()
            
            # Создаем новые слоты
            created_slots = []
            for day_schedule in schedule_data:
                schedule_date = datetime.strptime(day_schedule['date'], '%Y-%m-%d').date()
                
                for slot in day_schedule['slots']:
                    start_time = datetime.strptime(slot['start_time'], '%H:%M').time()
                    end_time = datetime.strptime(slot['end_time'], '%H:%M').time()
                    
                    availability_slot = MasterAvailability.objects.create(
                        master=master_user,
                        date=schedule_date,
                        start_time=start_time,
                        end_time=end_time
                    )
                    created_slots.append(availability_slot)
```

### ✅ 2. Исправлена функция загрузки расписания

```python
def get_master_schedule(master_user):
    """Получить расписание мастера из базы данных"""
    try:
        # Получаем все доступные слоты мастера
        availability_slots = MasterAvailability.objects.filter(
            master=master_user,
            date__gte=date.today()
        ).order_by('date', 'start_time')
        
        # Группируем слоты по датам
        schedule_by_date = {}
        for slot in availability_slots:
            date_str = slot.date.strftime('%Y-%m-%d')
            if date_str not in schedule_by_date:
                schedule_by_date[date_str] = []
            
            schedule_by_date[date_str].append({
                'id': slot.id,
                'start_time': slot.start_time.strftime('%H:%M'),
                'end_time': slot.end_time.strftime('%H:%M'),
                'created_at': slot.created_at.isoformat() if slot.created_at else None
            })
```

### ✅ 3. Обновлена система прав доступа

```python
# Было (с Groups):
if not user.groups.filter(name__in=['Curator', 'Super Admin']).exists():

# Стало (с ролями):
if user.role not in ['curator', 'super-admin']:
```

### ✅ 4. Добавлены необходимые импорты

```python
from django.db import transaction
from .models import CustomUser as User, MasterAvailability
from .serializers import MasterAvailabilitySerializer
```

## Структура данных

### Модель MasterAvailability
```python
class MasterAvailability(models.Model):
    master = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='availability_slots')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### API Endpoints
- `POST /api/master/schedule/` - Сохранение расписания текущего мастера
- `POST /api/master/schedule/{master_id}/` - Сохранение расписания конкретного мастера (куратор/супер-админ)
- `GET /api/master/schedule/` - Получение расписания текущего мастера  
- `GET /api/master/schedule/{master_id}/` - Получение расписания конкретного мастера
- `GET /api/masters/{master_id}/workload/` - Получение данных о загрузке мастера (включая слоты)

### Формат данных расписания

**Отправка (POST):**
```json
{
  "schedule": [
    {
      "date": "2025-06-16",
      "slots": [
        { "start_time": "09:00", "end_time": "10:00" },
        { "start_time": "10:00", "end_time": "11:00" }
      ]
    }
  ]
}
```

**Получение (GET):**
```json
{
  "success": true,
  "schedule": [
    {
      "date": "2025-06-16", 
      "slots": [
        {
          "id": 1,
          "start_time": "09:00",
          "end_time": "10:00",
          "created_at": "2025-06-15T12:00:00Z"
        }
      ]
    }
  ],
  "master_id": 1,
  "master_email": "master@example.com",
  "total_slots": 5
}
```

## Тестирование

### 1. Автоматический тест
```bash
node test-schedule-fix.mjs --token YOUR_TOKEN --master-id MASTER_ID
```

### 2. Ручное тестирование
1. Авторизуйтесь как мастер
2. Создайте расписание в интерфейсе мастера
3. Сохраните расписание
4. Перезайдите в систему
5. Проверьте, что расписание сохранилось
6. Авторизуйтесь как супер-админ/куратор
7. Откройте панель назначения мастера
8. Убедитесь, что слоты отображаются

## Результат

✅ **Расписание мастера теперь корректно сохраняется в базе данных**
✅ **Слоты мастера отображаются в панели назначения заказов**  
✅ **API workload возвращает актуальные данные о доступных слотах**
✅ **Frontend корректно показывает все созданные слоты мастера**

Проблема полностью решена! 🎉
