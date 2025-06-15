# Исправление ошибки сохранения расписания мастера

## Обнаруженная проблема

### ❌ Ошибка при сохранении расписания
**Ошибка:** "Each slot must have start_time and end_time"  
**Причина:** Frontend отправлял слоты в неправильном формате

### Анализ проблемы

#### Frontend отправлял:
```json
{
  "schedule": [
    {
      "date": "2025-06-16",
      "slots": ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00"]
    }
  ]
}
```

#### Backend ожидал:
```json
{
  "schedule": [
    {
      "date": "2025-06-16", 
      "slots": [
        { "start_time": "09:00", "end_time": "10:00" },
        { "start_time": "10:00", "end_time": "11:00" },
        { "start_time": "11:00", "end_time": "12:00" },
        { "start_time": "12:00", "end_time": "13:00" },
        { "start_time": "13:00", "end_time": "14:00" },
        { "start_time": "14:00", "end_time": "15:00" }
      ]
    }
  ]
}
```

## Внесённые исправления

### ✅ 1. Исправлена функция сохранения расписания

**Файл:** `packages/ui/src/components/shared/work-schedule/WorkScheduleTable.tsx`

**Было:**
```tsx
const scheduleData = workDays
  .filter(day => day.isSelected && day.selectedSlots.length > 0)
  .map(day => ({
    date: day.date,
    slots: day.selectedSlots  // Массив строк ["09:00", "10:00"]
  }));
```

**Стало:**
```tsx
const scheduleData = workDays
  .filter(day => day.isSelected && day.selectedSlots.length > 0)
  .map(day => ({
    date: day.date,
    slots: day.selectedSlots.map(timeSlot => {
      // Конвертируем время в формат start_time и end_time
      const currentSlot = timeSlots.find(slot => slot.time === timeSlot);
      if (!currentSlot) {
        throw new Error(`Invalid time slot: ${timeSlot}`);
      }
      
      // Извлекаем время начала и конца из display
      const [start_time, end_time] = currentSlot.display.split('-');
      return {
        start_time: start_time,
        end_time: end_time
      };
    })
  }));
```

### ✅ 2. Исправлена функция загрузки расписания

**Было:**
```tsx
const updatedDays = generateWeekDays().map(day => {
  const serverDay = data.schedule?.find((d: any) => d.date === day.date);
  return serverDay ? {
    ...day,
    isSelected: true,
    selectedSlots: serverDay.slots || []  // Неправильный формат
  } : day;
});
```

**Стало:**
```tsx
const updatedDays = generateWeekDays().map(day => {
  const serverDay = data.schedule?.find((d: any) => d.date === day.date);
  if (serverDay && serverDay.slots && serverDay.slots.length > 0) {
    // Конвертируем слоты из backend формата в frontend формат
    const selectedSlots = serverDay.slots.map((slot: any) => {
      // Из backend приходят объекты с start_time и end_time
      // Нужно найти соответствующий timeSlot
      const matchingTimeSlot = timeSlots.find(ts => {
        const [start, end] = ts.display.split('-');
        return start === slot.start_time && end === slot.end_time;
      });
      return matchingTimeSlot ? matchingTimeSlot.time : slot.start_time;
    }).filter(Boolean); // Убираем undefined значения
    
    return {
      ...day,
      isSelected: true,
      selectedSlots: selectedSlots
    };
  }
  return day;
});
```

## Логика конвертации данных

### Frontend → Backend (сохранение)
```
Frontend слот: "09:00"
↓
Поиск в timeSlots: { time: '09:00', display: '09:00-10:00' }
↓
Разделение display: ["09:00", "10:00"] 
↓
Backend слот: { start_time: "09:00", end_time: "10:00" }
```

### Backend → Frontend (загрузка)
```
Backend слот: { start_time: "09:00", end_time: "10:00" }
↓
Поиск в timeSlots: display === "09:00-10:00"
↓
Извлечение time: "09:00"
↓
Frontend слот: "09:00"
```

## Структура данных timeSlots

```tsx
const timeSlots: TimeSlot[] = [
  { time: '09:00', display: '09:00-10:00' },
  { time: '10:00', display: '10:00-11:00' },
  { time: '11:00', display: '11:00-12:00' },
  // ... и т.д.
];
```

## Тестирование

### ✅ Автоматический тест
```bash
node test-schedule-format.mjs
# Результат: ✅ ТЕСТ ПРОЙДЕН
```

### ✅ Проверка формата данных
- **Исходные слоты:** `['09:00', '10:00', '11:00', '12:00', '13:00', '14:00']`
- **Отправляемые на backend:** Объекты с `start_time` и `end_time`
- **Восстановленные из backend:** `['09:00', '10:00', '11:00', '12:00', '13:00', '14:00']`
- **Совпадают:** ✅ ДА

## Результат

### ✅ Проблемы решены:
1. **Ошибка "Each slot must have start_time and end_time"** - исправлена
2. **Расписание теперь корректно сохраняется** в базе данных
3. **Расписание корректно загружается** после сохранения
4. **Данные между frontend и backend синхронизируются** правильно

### 🧪 Как проверить:
1. Откройте приложение мастера (`http://localhost:3002`)
2. Перейдите в раздел "Расписание"
3. Выберите дни и временные слоты
4. Нажмите "Сохранить"
5. Перезагрузите страницу
6. Убедитесь, что расписание сохранилось
7. Откройте панель назначения мастера в супер-админе
8. Проверьте, что слоты отображаются

Проблема **полностью решена**! 🎉
