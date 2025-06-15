#!/usr/bin/env node

/**
 * Диагностический скрипт для проблемы с отсутствием слотов мастеров
 */

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function diagnoseMasterSlots() {
  console.log('🔍 Диагностика проблемы с отсутствием слотов мастеров...');
  console.log('📍 API URL:', baseUrl);
  
  // Симулируем токен (нужно будет заменить на реальный)
  const token = 'your_token_here'; // Получите из localStorage в браузере
  
  try {
    // 1. Проверяем загрузку мастеров
    console.log('\n📋 1. Проверка загрузки мастеров...');
    const mastersResponse = await fetch(`${baseUrl}/users/masters/`, {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Статус ответа мастеров:', mastersResponse.status);
    
    if (mastersResponse.ok) {
      const masters = await mastersResponse.json();
      console.log('✅ Мастера загружены:', masters.length);
      
      if (masters.length > 0) {
        const firstMaster = masters[0];
        console.log('🔍 Тестируем первого мастера:', {
          id: firstMaster.id,
          email: firstMaster.email,
          name: `${firstMaster.first_name || ''} ${firstMaster.last_name || ''}`.trim()
        });
        
        // 2. Проверяем API workload
        console.log('\n📊 2. Проверка API workload...');
        const workloadResponse = await fetch(`${baseUrl}/api/masters/${firstMaster.id}/workload/`, {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Статус ответа workload:', workloadResponse.status);
        
        if (workloadResponse.ok) {
          const workloadData = await workloadResponse.json();
          console.log('✅ Данные workload получены:', {
            master_id: workloadData.master_id,
            availability_slots: workloadData.availability_slots,
            availability_slots_count: workloadData.availability_slots?.length || 0,
            total_orders_today: workloadData.total_orders_today,
            next_available_slot: workloadData.next_available_slot
          });
          
          if (!workloadData.availability_slots || workloadData.availability_slots.length === 0) {
            console.log('❌ ПРОБЛЕМА: availability_slots пустой или отсутствует!');
          }
        } else {
          const errorText = await workloadResponse.text();
          console.log('❌ Ошибка workload API:', errorText);
        }
        
        // 3. Проверяем альтернативные API эндпоинты
        console.log('\n🔄 3. Проверка альтернативных API...');
        
        // Проверяем API расписания мастера
        const scheduleEndpoints = [
          `/api/masters/${firstMaster.id}/schedule/`,
          `/api/masters/${firstMaster.id}/availability/`,
          `/api/schedule/masters/${firstMaster.id}/`,
          `/masters/${firstMaster.id}/schedule/`,
          `/masters/${firstMaster.id}/availability/`
        ];
        
        for (const endpoint of scheduleEndpoints) {
          try {
            const response = await fetch(`${baseUrl}${endpoint}`, {
              headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            console.log(`${endpoint}: ${response.status}`);
            
            if (response.ok) {
              const data = await response.json();
              console.log(`  ✅ Данные:`, data);
            }
          } catch (error) {
            console.log(`  ❌ Ошибка: ${error.message}`);
          }
        }
      }
    } else {
      const errorText = await mastersResponse.text();
      console.log('❌ Ошибка загрузки мастеров:', errorText);
    }
    
  } catch (error) {
    console.log('❌ Общая ошибка:', error.message);
  }
}

async function checkBackendModels() {
  console.log('\n🗃️ 4. Проверка структуры данных backend...');
  
  // Ожидаемая структура модели MasterAvailability
  console.log('Ожидаемая структура MasterAvailability:');
  console.log(`
  class MasterAvailability(models.Model):
      master = models.ForeignKey(User, on_delete=models.CASCADE)
      date = models.DateField()
      start_time = models.TimeField()
      end_time = models.TimeField()
      is_available = models.BooleanField(default=True)
      created_at = models.DateTimeField(auto_now_add=True)
  `);
  
  console.log('Проверьте в Django admin или shell:');
  console.log('1. python manage.py shell');
  console.log('2. from app1.api1.models import MasterAvailability');
  console.log('3. MasterAvailability.objects.all()');
  console.log('4. MasterAvailability.objects.filter(master_id=MASTER_ID)');
}

function suggestFixes() {
  console.log('\n🔧 5. Возможные решения:');
  console.log('1. Проверить, что модель MasterAvailability создана и мигрирована');
  console.log('2. Убедиться, что API /api/masters/{id}/workload/ правильно сериализует availability_slots');
  console.log('3. Проверить, что при сохранении расписания мастера данные корректно записываются в БД');
  console.log('4. Добавить логирование в backend для отладки');
  console.log('5. Проверить права доступа мастера к созданию/изменению расписания');
}

// Инструкции по использованию
console.log('📝 Инструкция по диагностике:');
console.log('1. Откройте браузер с dev tools');
console.log('2. Авторизуйтесь как супер-админ');
console.log('3. Скопируйте токен из localStorage');
console.log('4. Замените "your_token_here" на реальный токен');
console.log('5. Запустите: node diagnose-missing-slots.mjs');

if (process.argv.includes('--run')) {
  diagnoseMasterSlots()
    .then(() => checkBackendModels())
    .then(() => suggestFixes())
    .catch(console.error);
}
