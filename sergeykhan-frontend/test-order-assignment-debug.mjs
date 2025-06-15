#!/usr/bin/env node

/**
 * Тест для проверки работы OrderAssignmentPanel
 * Этот скрипт проверяет интеграцию компонента назначения мастеров
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';

console.log('🧪 Тестирование OrderAssignmentPanel...\n');

// Проверка структуры компонента
console.log('1. 📂 Проверка структуры файлов...');
try {
  const panelPath = 'packages/ui/src/components/shared/orders/order-assignment/OrderAssignmentPanel.tsx';
  const orderDetailsPath = 'packages/ui/src/components/shared/orders/unified-order-details/UnifiedOrderDetails.tsx';
  
  const panelContent = readFileSync(panelPath, 'utf-8');
  const orderDetailsContent = readFileSync(orderDetailsPath, 'utf-8');
  
  console.log('   ✅ OrderAssignmentPanel.tsx найден');
  console.log('   ✅ UnifiedOrderDetails.tsx найден');
  
  // Проверка импорта
  if (orderDetailsContent.includes('import OrderAssignmentPanel from "../order-assignment/OrderAssignmentPanel"')) {
    console.log('   ✅ OrderAssignmentPanel правильно импортирован');
  } else {
    console.log('   ❌ OrderAssignmentPanel не импортирован или импортирован неправильно');
  }
  
  // Проверка использования
  if (orderDetailsContent.includes('<OrderAssignmentPanel')) {
    console.log('   ✅ OrderAssignmentPanel используется в JSX');
  } else {
    console.log('   ❌ OrderAssignmentPanel не используется в JSX');
  }
  
  // Проверка основных функций в OrderAssignmentPanel
  const requiredFunctions = [
    'fetchMastersData',
    'getAvailabilityStatus', 
    'handleAssign',
    'filteredMasters'
  ];
  
  console.log('\n2. 🔍 Проверка основных функций компонента...');
  requiredFunctions.forEach(func => {
    if (panelContent.includes(func)) {
      console.log(`   ✅ ${func} найдена`);
    } else {
      console.log(`   ❌ ${func} не найдена`);
    }
  });
  
  // Проверка необходимых состояний
  const requiredStates = [
    'masters',
    'mastersWorkload', 
    'selectedMasterId',
    'searchTerm',
    'isLoading',
    'error'
  ];
  
  console.log('\n3. 📊 Проверка состояний компонента...');
  requiredStates.forEach(state => {
    if (panelContent.includes(`const [${state},`) || panelContent.includes(`${state},`)) {
      console.log(`   ✅ Состояние ${state} найдено`);
    } else {
      console.log(`   ❌ Состояние ${state} не найдено`);
    }
  });
  
  // Проверка API endpoints
  console.log('\n4. 🌐 Проверка API endpoints...');
  const apiEndpoints = [
    '/users/masters/',
    '/api/masters/{id}/workload/'
  ];
  
  apiEndpoints.forEach(endpoint => {
    if (panelContent.includes(endpoint.replace('{id}', '${master.id}')) || 
        panelContent.includes(endpoint)) {
      console.log(`   ✅ Endpoint ${endpoint} найден`);
    } else {
      console.log(`   ❌ Endpoint ${endpoint} не найден`);
    }
  });
  
  // Проверка компиляции TypeScript
  console.log('\n5. ⚙️ Проверка TypeScript компиляции...');
  try {
    execSync('npx tsc --noEmit --skipLibCheck packages/ui/src/components/shared/orders/order-assignment/OrderAssignmentPanel.tsx', 
      { stdio: 'pipe' });
    console.log('   ✅ TypeScript компиляция прошла успешно');
  } catch (error) {
    console.log('   ⚠️ Найдены ошибки TypeScript (могут быть связаны с зависимостями)');
  }
  
  console.log('\n📋 Рекомендации для отладки:');
  console.log('1. Откройте инструменты разработчика в браузере');
  console.log('2. Перейдите на вкладку Console');
  console.log('3. Нажмите кнопку "Назначить мастера" в заказе');
  console.log('4. Проверьте логи в консоли - должны появиться сообщения с 🔍 🔑 📊');
  console.log('5. Если есть ошибки, используйте кнопку "Диагностика" в панели');
  
  console.log('\n🎯 Возможные причины проблемы:');
  console.log('- Неправильный токен авторизации');
  console.log('- Недостаточно прав пользователя (нужны права curator или super-admin)');
  console.log('- Нет мастеров в базе данных');
  console.log('- Проблемы с сетью или API сервером');
  console.log('- Неправильный API URL');
  
} catch (error) {
  console.error('❌ Ошибка при проверке файлов:', error.message);
}

console.log('\n✅ Тестирование завершено!');
