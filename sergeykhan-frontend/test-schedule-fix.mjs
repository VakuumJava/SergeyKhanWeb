#!/usr/bin/env node

/**
 * Тестовый скрипт для проверки исправления сохранения и загрузки слотов мастеров
 */

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getTestScheduleData() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(today.getDate() + 2);

  return {
    schedule: [
      {
        date: tomorrow.toISOString().split('T')[0], // YYYY-MM-DD
        slots: [
          { start_time: '09:00', end_time: '10:00' },
          { start_time: '10:00', end_time: '11:00' },
          { start_time: '14:00', end_time: '15:00' }
        ]
      },
      {
        date: dayAfterTomorrow.toISOString().split('T')[0], // YYYY-MM-DD
        slots: [
          { start_time: '09:00', end_time: '10:00' },
          { start_time: '16:00', end_time: '17:00' }
        ]
      }
    ]
  };
}

async function testScheduleSaveAndLoad(token, masterId) {
  console.log('🧪 Тестирование сохранения и загрузки расписания...');
  console.log('📍 API URL:', baseUrl);
  console.log('👤 Master ID:', masterId);
  
  const scheduleData = getTestScheduleData();
  console.log('📅 Тестовые данные расписания:', JSON.stringify(scheduleData, null, 2));
  
  try {
    // 1. Сохраняем расписание
    console.log('\n💾 1. Сохранение расписания...');
    const saveResponse = await fetch(`${baseUrl}/api/master/schedule/${masterId}/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(scheduleData)
    });
    
    console.log('Статус сохранения:', saveResponse.status);
    
    if (saveResponse.ok) {
      const saveResult = await saveResponse.json();
      console.log('✅ Расписание сохранено:', saveResult);
    } else {
      const errorText = await saveResponse.text();
      console.log('❌ Ошибка сохранения:', errorText);
      return false;
    }
    
    // 2. Ждем немного и загружаем расписание
    console.log('\n⏳ Ожидание 2 секунды...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n📋 2. Загрузка расписания...');
    const loadResponse = await fetch(`${baseUrl}/api/master/schedule/${masterId}/`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Статус загрузки:', loadResponse.status);
    
    if (loadResponse.ok) {
      const loadResult = await loadResponse.json();
      console.log('✅ Расписание загружено:', JSON.stringify(loadResult, null, 2));
      
      // Проверяем, что данные совпадают
      if (loadResult.schedule && loadResult.schedule.length > 0) {
        console.log('✅ Расписание содержит слоты!');
        return true;
      } else {
        console.log('❌ Расписание пустое после сохранения!');
        return false;
      }
    } else {
      const errorText = await loadResponse.text();
      console.log('❌ Ошибка загрузки:', errorText);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Ошибка теста:', error.message);
    return false;
  }
}

async function testWorkloadAPI(token, masterId) {
  console.log('\n🔄 3. Тестирование API workload...');
  
  try {
    const workloadResponse = await fetch(`${baseUrl}/api/masters/${masterId}/workload/`, {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Статус workload API:', workloadResponse.status);
    
    if (workloadResponse.ok) {
      const workloadData = await workloadResponse.json();
      console.log('✅ Данные workload:', {
        master_id: workloadData.master_id,
        availability_slots_count: workloadData.availability_slots?.length || 0,
        total_orders_today: workloadData.total_orders_today,
        has_next_available_slot: !!workloadData.next_available_slot
      });
      
      if (workloadData.availability_slots && workloadData.availability_slots.length > 0) {
        console.log('✅ Workload API возвращает слоты!');
        console.log('📋 Первый слот:', workloadData.availability_slots[0]);
        return true;
      } else {
        console.log('❌ Workload API не возвращает слоты!');
        return false;
      }
    } else {
      const errorText = await workloadResponse.text();
      console.log('❌ Ошибка workload API:', errorText);
      return false;
    }
  } catch (error) {
    console.log('❌ Ошибка workload теста:', error.message);
    return false;
  }
}

function printInstructions() {
  console.log('📝 Инструкция по тестированию:');
  console.log('1. Получите токен авторизации из браузера (localStorage.getItem("token"))');
  console.log('2. Получите ID мастера (можно использовать /users/masters/ API)');
  console.log('3. Запустите: node test-schedule-fix.mjs --token YOUR_TOKEN --master-id MASTER_ID');
  console.log('');
  console.log('Пример:');
  console.log('node test-schedule-fix.mjs --token abc123def456 --master-id 1');
}

async function runTests() {
  const args = process.argv.slice(2);
  const tokenIndex = args.indexOf('--token');
  const masterIdIndex = args.indexOf('--master-id');
  
  if (tokenIndex === -1 || masterIdIndex === -1) {
    printInstructions();
    return;
  }
  
  const token = args[tokenIndex + 1];
  const masterId = args[masterIdIndex + 1];
  
  if (!token || !masterId) {
    console.log('❌ Токен и ID мастера обязательны!');
    printInstructions();
    return;
  }
  
  console.log('🚀 Запуск тестов исправления расписания...');
  
  try {
    // Тест 1: Сохранение и загрузка расписания
    const scheduleTest = await testScheduleSaveAndLoad(token, masterId);
    
    // Тест 2: API workload
    const workloadTest = await testWorkloadAPI(token, masterId);
    
    // Результаты
    console.log('\n📊 РЕЗУЛЬТАТЫ ТЕСТОВ:');
    console.log(`📅 Сохранение/загрузка расписания: ${scheduleTest ? '✅ ПРОЙДЕН' : '❌ ПРОВАЛЕН'}`);
    console.log(`🔄 Workload API: ${workloadTest ? '✅ ПРОЙДЕН' : '❌ ПРОВАЛЕН'}`);
    
    if (scheduleTest && workloadTest) {
      console.log('\n🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ! Проблема исправлена.');
    } else {
      console.log('\n⚠️ Некоторые тесты провалены. Требуется дополнительная диагностика.');
    }
    
  } catch (error) {
    console.error('❌ Ошибка при выполнении тестов:', error);
  }
}

// Запуск тестов
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { testScheduleSaveAndLoad, testWorkloadAPI };
