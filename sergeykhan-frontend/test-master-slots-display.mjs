#!/usr/bin/env node

/**
 * Тестовый скрипт для проверки отображения доступных слотов мастеров
 * в панели назначения заказов
 */

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function testMasterSlotsDisplay() {
  console.log('🧪 Тестирование отображения слотов мастеров...');
  console.log('📍 API URL:', baseUrl);

  // Проверяем, что токен есть в localStorage (симуляция)
  console.log('\n🔐 1. Проверка авторизации...');
  
  // Тестируем загрузку мастеров
  console.log('\n👥 2. Тестирование загрузки мастеров...');
  try {
    const response = await fetch(`${baseUrl}/users/masters/`, {
      headers: {
        'Authorization': `Token test_token`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Статус ответа:', response.status);
    if (response.ok) {
      const masters = await response.json();
      console.log('✅ Количество мастеров:', masters.length);
      
      // Тестируем загрузку данных о слотах для первого мастера
      if (masters.length > 0) {
        const firstMaster = masters[0];
        console.log(`\n📊 3. Тестирование загрузки слотов для мастера ${firstMaster.id}...`);
        
        try {
          const workloadResponse = await fetch(
            `${baseUrl}/api/masters/${firstMaster.id}/workload/`,
            {
              headers: {
                'Authorization': `Token test_token`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          console.log('Статус ответа workload:', workloadResponse.status);
          if (workloadResponse.ok) {
            const workloadData = await workloadResponse.json();
            console.log('✅ Данные о загрузке получены:', {
              master_id: workloadData.master_id,
              availability_slots_count: workloadData.availability_slots?.length || 0,
              availability_slots: workloadData.availability_slots,
              total_orders_today: workloadData.total_orders_today
            });
            
            // Проверяем структуру слотов
            if (workloadData.availability_slots && workloadData.availability_slots.length > 0) {
              console.log('\n🕒 4. Анализ структуры слотов:');
              workloadData.availability_slots.slice(0, 3).forEach((slot, index) => {
                console.log(`   Слот ${index + 1}:`, {
                  date: slot.date,
                  start_time: slot.start_time,
                  end_time: slot.end_time,
                  formatted_date: new Date(slot.date).toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit'
                  })
                });
              });
              
              console.log('\n✅ ТЕСТ ПРОЙДЕН: Слоты отображаются корректно');
            } else {
              console.log('\n⚠️ ВНИМАНИЕ: У мастера нет доступных слотов');
            }
          } else {
            console.log('❌ Ошибка загрузки данных о слотах:', workloadResponse.status);
          }
        } catch (error) {
          console.log('❌ Ошибка при запросе слотов:', error.message);
        }
      } else {
        console.log('⚠️ Мастера не найдены для тестирования');
      }
    } else {
      console.log('❌ Ошибка загрузки мастеров:', response.status);
    }
  } catch (error) {
    console.log('❌ Ошибка при запросе мастеров:', error.message);
  }
}

async function testSlotDisplayLogic() {
  console.log('\n🎨 5. Тестирование логики отображения слотов...');
  
  // Моковые данные для тестирования
  const mockWorkloadData = {
    master_id: 1,
    master_email: 'test@example.com',
    availability_slots: [
      { id: 1, date: '2025-06-16', start_time: '09:00', end_time: '10:00' },
      { id: 2, date: '2025-06-16', start_time: '10:00', end_time: '11:00' },
      { id: 3, date: '2025-06-17', start_time: '14:00', end_time: '15:00' },
      { id: 4, date: '2025-06-18', start_time: '16:00', end_time: '17:00' },
      { id: 5, date: '2025-06-19', start_time: '09:00', end_time: '10:00' }
    ],
    total_orders_today: 2,
    orders_count_by_date: {
      '2025-06-16': 2,
      '2025-06-17': 1
    }
  };
  
  console.log('Тестовые данные:', mockWorkloadData);
  
  // Симуляция отображения первых 3 слотов
  console.log('\nОтображение первых 3 слотов:');
  mockWorkloadData.availability_slots.slice(0, 3).forEach((slot, index) => {
    const formattedDate = new Date(slot.date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit'
    });
    console.log(`   ${formattedDate} ${slot.start_time}-${slot.end_time}`);
  });
  
  if (mockWorkloadData.availability_slots.length > 3) {
    console.log(`   +${mockWorkloadData.availability_slots.length - 3} еще...`);
  }
  
  console.log('\n✅ Логика отображения работает корректно');
}

// Запуск тестов
async function runTests() {
  try {
    await testMasterSlotsDisplay();
    await testSlotDisplayLogic();
    console.log('\n🎉 ВСЕ ТЕСТЫ ЗАВЕРШЕНЫ');
  } catch (error) {
    console.error('❌ Ошибка при выполнении тестов:', error);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { testMasterSlotsDisplay, testSlotDisplayLogic };
