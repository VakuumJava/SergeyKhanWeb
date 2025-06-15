'use client';

import React, { useState } from 'react';
import { Button } from "@workspace/ui/components/ui";
import OrderAssignmentPanel from './OrderAssignmentPanel';

/**
 * Тестовый компонент для проверки OrderAssignmentPanel
 * Добавьте этот компонент в любую страницу для тестирования
 */
const OrderAssignmentTest = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleAssign = (masterId: number) => {
    console.log('✅ Мастер назначен:', masterId);
    alert(`Мастер с ID ${masterId} был назначен на заказ!`);
    setIsOpen(false);
  };

  return (
    <div className="p-4 border rounded-lg bg-background">
      <h3 className="text-lg font-semibold mb-4">Тест OrderAssignmentPanel</h3>
      <p className="text-muted-foreground mb-4">
        Нажмите кнопку ниже для тестирования модального окна назначения мастера
      </p>
      
      <Button onClick={() => setIsOpen(true)}>
        🔧 Назначить мастера (ТЕСТ)
      </Button>

      <OrderAssignmentPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onAssign={handleAssign}
        orderId={999} // Тестовый ID заказа
        orderDate="2025-06-16"
        orderTime="10:00"
      />
      
      <div className="mt-4 p-3 bg-muted/50 rounded-md text-sm">
        <h4 className="font-medium mb-2">Инструкции по тестированию:</h4>
        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
          <li>Откройте инструменты разработчика (F12)</li>
          <li>Перейдите на вкладку Console</li>
          <li>Нажмите кнопку "Назначить мастера (ТЕСТ)"</li>
          <li>Проверьте логи в консоли</li>
          <li>Если есть ошибки, используйте кнопку "Диагностика" в модальном окне</li>
        </ol>
      </div>
    </div>
  );
};

export default OrderAssignmentTest;
