#!/usr/bin/env node

/**
 * Тест назначения мастера с выбором конкретного слота
 */

const API_BASE = 'http://127.0.0.1:8000';
const TOKEN = 'babcb6304b44079f8c931b536731160ab7969603'; // Токен супер-админа

async function makeRequest(endpoint, method = 'GET', data = null) {
    const url = `${API_BASE}${endpoint}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${TOKEN}`
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    console.log(`📡 ${method} ${url}`);
    if (data) console.log('📤 Данные:', JSON.stringify(data, null, 2));
    
    const response = await fetch(url, options);
    const result = await response.text();
    
    console.log(`📥 Статус: ${response.status}`);
    
    try {
        const jsonResult = JSON.parse(result);
        console.log('📋 Ответ:', JSON.stringify(jsonResult, null, 2));
        return { status: response.status, data: jsonResult };
    } catch (e) {
        console.log('📋 Ответ (текст):', result);
        return { status: response.status, data: result };
    }
}

async function testSlotAssignment() {
    console.log('🧪 Тестирование назначения мастера с выбором слота');
    console.log('=' * 60);
    
    try {
        // 1. Получаем список заказов
        console.log('\n📋 1. Получаем список заказов...');
        const ordersResponse = await makeRequest('/api/orders/all/');
        
        if (!ordersResponse.data || !Array.isArray(ordersResponse.data)) {
            console.log('❌ Не удалось получить список заказов');
            return;
        }
        
        // Находим заказ без назначенного мастера
        const unassignedOrder = ordersResponse.data.find(order => 
            !order.assigned_master && 
            ['новый', 'в обработке'].includes(order.status)
        );
        
        if (!unassignedOrder) {
            console.log('❌ Не найдено заказов без назначенного мастера');
            return;
        }
        
        console.log(`✅ Найден заказ для теста: #${unassignedOrder.id} (${unassignedOrder.status})`);
        
        // 2. Получаем список мастеров с их рабочими часами
        console.log('\n👥 2. Получаем список мастеров...');
        const mastersResponse = await makeRequest('/api/masters/workload/all/');
        
        if (!mastersResponse.data || !Array.isArray(mastersResponse.data)) {
            console.log('❌ Не удалось получить список мастеров');
            return;
        }
        
        // Находим мастера с доступными слотами
        const masterWithSlots = mastersResponse.data.find(master => 
            master.next_available_slot !== null
        );
        
        if (!masterWithSlots) {
            console.log('❌ Не найдено мастеров с доступными слотами');
            return;
        }
        
        console.log(`✅ Найден мастер с слотами: ${masterWithSlots.master_email}`);
        
        // Получаем детальную информацию о слотах мастера
        console.log('\n📅 3. Получаем детальные слоты мастера...');
        const slotsResponse = await makeRequest(`/api/masters/${masterWithSlots.master_id}/availability/`);
        
        if (!slotsResponse.data || !Array.isArray(slotsResponse.data) || slotsResponse.data.length === 0) {
            console.log('❌ У мастера нет доступных слотов');
            return;
        }
        
        console.log(`📅 Доступные слоты: ${slotsResponse.data.length}`);
        
        // Выбираем первый доступный слот
        const selectedSlot = slotsResponse.data[0];
        console.log(`🎯 Выбранный слот: ${selectedSlot.date} ${selectedSlot.start_time}-${selectedSlot.end_time}`);
        
        // 4. Тестируем назначение без слота (должно работать)
        console.log('\n🔧 4. Тестируем назначение без указания слота...');
        const assignResponse1 = await makeRequest(`/assign/${unassignedOrder.id}/`, 'PATCH', {
            assigned_master: masterWithSlots.master_id
        });
        
        if (assignResponse1.status === 200) {
            console.log('✅ Назначение без слота прошло успешно!');
            
            // Сбрасываем назначение для следующего теста
            await makeRequest(`/assign/${unassignedOrder.id}/remove/`, 'PATCH');
            console.log('🔄 Сброшено назначение мастера для следующего теста');
        } else {
            console.log(`❌ Назначение без слота не удалось: ${assignResponse1.status}`);
        }
        
        // 5. Тестируем назначение с указанием конкретного слота
        console.log('\n🎯 5. Тестируем назначение с указанием конкретного слота...');
        const assignResponse2 = await makeRequest(`/assign/${unassignedOrder.id}/`, 'PATCH', {
            assigned_master: masterWithSlots.master_id,
            scheduled_date: selectedSlot.date,
            scheduled_time: selectedSlot.start_time // Убираем лишние секунды
        });
        
        if (assignResponse2.status === 200) {
            console.log('✅ Назначение с конкретным слотом прошло успешно!');
            console.log('📋 Данные заказа после назначения:');
            console.log(`   - Мастер: ${assignResponse2.data.assigned_master_email || 'ID ' + assignResponse2.data.assigned_master}`);
            console.log(`   - Дата: ${assignResponse2.data.scheduled_date || 'не указана'}`);
            console.log(`   - Время: ${assignResponse2.data.scheduled_time || 'не указано'}`);
        } else {
            console.log(`❌ Назначение с конкретным слотом не удалось: ${assignResponse2.status}`);
        }
        
        // 6. Тестируем назначение на уже занятое время (должно вернуть ошибку)
        console.log('\n⚠️  6. Тестируем назначение на уже занятое время...');
        const conflictResponse = await makeRequest(`/assign/${unassignedOrder.id}/`, 'PATCH', {
            assigned_master: masterWithSlots.master_id,
            scheduled_date: selectedSlot.date,
            scheduled_time: selectedSlot.start_time
        });
        
        if (conflictResponse.status >= 400) {
            console.log('✅ Правильно обработан конфликт времени!');
            console.log(`📄 Сообщение об ошибке: ${conflictResponse.data.error || conflictResponse.data}`);
        } else {
            console.log('❌ Конфликт времени не был обработан правильно');
        }
        
        console.log('\n🎉 ТЕСТ ЗАВЕРШЕН');
        
    } catch (error) {
        console.error('💥 Ошибка во время тестирования:', error);
    }
}

// Запускаем тест
testSlotAssignment();
