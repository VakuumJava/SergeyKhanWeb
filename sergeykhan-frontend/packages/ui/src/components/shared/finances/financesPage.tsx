'use client';
import React, { useState } from 'react';
import {LogsChart} from "@shared/finances/chart/myChart";
import { HistoryPayments } from "@shared/finances/chartFinances/historyPayments";
import { UniversalBalanceManager } from "@shared/balance/UniversalBalanceManager";

const FinancesPage = () => {
  const [isVisible] = useState(true);
  const userId : string | null = typeof window !== "undefined" ? localStorage.getItem("user_id") : null;

  if (!userId) {
    return (
      <div className="w-full container">
        <div className="flex items-center justify-center p-8">
          <span className="text-red-500">Пользователь не авторизован</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Заголовок */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Мои финансы</h1>
          <p className="text-gray-600">Просмотр баланса и истории операций</p>
        </div>

        {/* Карточки баланса */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Баланс</h2>
          <UniversalBalanceManager 
            userId={userId}
            readonly={true}
            showControls={false}
          />
        </div>

        {/* График активности */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">График операций</h2>
          <LogsChart visible={isVisible} />
        </div>

        {/* История операций */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">История операций</h2>
          <HistoryPayments userId={userId}/>
        </div>
      </div>
    </div>
  );
};

export default FinancesPage;
