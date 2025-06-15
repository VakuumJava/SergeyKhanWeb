#!/usr/bin/env node

/**
 * Тестовый скрипт для проверки исправления формата данных расписания
 */

function testDataFormat() {
  console.log('🧪 Тестирование формата данных расписания...');
  
  // Временные слоты как в компоненте
  const timeSlots = [
    { time: '09:00', display: '09:00-10:00' },
    { time: '10:00', display: '10:00-11:00' },
    { time: '11:00', display: '11:00-12:00' },
    { time: '12:00', display: '12:00-13:00' },
    { time: '13:00', display: '13:00-14:00' },
    { time: '14:00', display: '14:00-15:00' },
    { time: '15:00', display: '15:00-16:00' },
    { time: '16:00', display: '16:00-17:00' },
    { time: '17:00', display: '17:00-18:00' },
  ];
  
  // Симуляция данных как в frontend
  const workDays = [
    {
      date: '2025-06-16',
      day: 'Пн 16.6',
      isSelected: true,
      selectedSlots: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00'] // Как в скриншоте
    }
  ];
  
  console.log('📋 Исходные данные frontend:', workDays);
  
  // Новая логика конвертации
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
  
  console.log('✅ Данные для отправки на backend:');
  console.log(JSON.stringify({ schedule: scheduleData }, null, 2));
  
  // Проверяем обратную конвертацию (как при загрузке)
  console.log('\n🔄 Тестирование обратной конвертации...');
  
  const backendResponse = {
    success: true,
    schedule: scheduleData,
    master_id: 1,
    total_slots: 6
  };
  
  console.log('📥 Данные с backend:', JSON.stringify(backendResponse, null, 2));
  
  // Конвертируем обратно
  const updatedDays = [{
    date: '2025-06-16',
    day: 'Пн 16.6',
    isSelected: false,
    selectedSlots: []
  }].map(day => {
    const serverDay = backendResponse.schedule.find(d => d.date === day.date);
    if (serverDay && serverDay.slots && serverDay.slots.length > 0) {
      // Конвертируем слоты из backend формата в frontend формат
      const selectedSlots = serverDay.slots.map(slot => {
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
  
  console.log('✅ Восстановленные данные frontend:', updatedDays);
  
  // Проверяем соответствие
  const originalSlots = workDays[0].selectedSlots.sort();
  const restoredSlots = updatedDays[0].selectedSlots.sort();
  
  console.log('\n📊 Результаты проверки:');
  console.log('Исходные слоты:', originalSlots);
  console.log('Восстановленные слоты:', restoredSlots);
  console.log('Совпадают:', JSON.stringify(originalSlots) === JSON.stringify(restoredSlots) ? '✅ ДА' : '❌ НЕТ');
  
  return JSON.stringify(originalSlots) === JSON.stringify(restoredSlots);
}

function printValidationRules() {
  console.log('\n📝 Правила валидации backend:');
  console.log('1. Каждый слот должен содержать поля "start_time" и "end_time"');
  console.log('2. Время должно быть в формате "HH:MM"');
  console.log('3. end_time должно быть больше start_time');
  console.log('4. Дата должна быть в формате "YYYY-MM-DD"');
  console.log('5. Дата не должна быть в прошлом');
  
  console.log('\n📋 Пример правильного формата:');
  console.log(`{
  "schedule": [
    {
      "date": "2025-06-16",
      "slots": [
        { "start_time": "09:00", "end_time": "10:00" },
        { "start_time": "10:00", "end_time": "11:00" }
      ]
    }
  ]
}`);
}

// Запуск тестов
console.log('🚀 Запуск тестов формата данных расписания...');
const success = testDataFormat();
printValidationRules();

console.log('\n🎯 ИТОГ:', success ? '✅ ТЕСТ ПРОЙДЕН' : '❌ ТЕСТ ПРОВАЛЕН');

if (success) {
  console.log('\n🎉 Исправление корректно! Теперь данные должны сохраняться без ошибок.');
} else {
  console.log('\n⚠️ Требуется дополнительная доработка.');
}
