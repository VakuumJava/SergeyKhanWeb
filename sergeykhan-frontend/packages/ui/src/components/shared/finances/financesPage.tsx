'use client';
import React, { useEffect, useState } from 'react';
import {LogsChart} from "@shared/finances/chart/myChart";
import { HistoryPayments } from "@shared/finances/chartFinances/historyPayments";
import {API} from "@shared/constants/constants";

const FinancesPage = () => {
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVisible] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const currency = '₸';

  useEffect(() => {
    // Get userId from localStorage only on client side
    const userIdFromStorage = typeof window !== 'undefined' ? localStorage.getItem("user_id") : null;
    setUserId(userIdFromStorage);
  }, []);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

        if (!userId || !token) {
          throw new Error("Пользователь не авторизован");
        }

        const res = await fetch(`${API}/balance/${userId}/`, {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          throw new Error("Ошибка получения баланса");
        }

        const data = await res.json();
        setBalance(data.balance);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchBalance();
    }
  }, [userId]);

  return (
    <div className="w-full container">
      <div className="flex items-center flex-col justify-center gap-14">
        <div className="flex items-center justify-center flex-col">
          <h1 className="text-2xl text-gray-400">Ваш баланс</h1>
          {isLoading ? (
            <span className="text-2xl text-gray-400">Загрузка...</span>
          ) : error ? (
            <span className="text-red-500">{error}</span>
          ) : (
            <span className="text-5xl font-bold">{balance} {currency}</span>
          )}
        </div>

        <div className="w-[80%]">
          <LogsChart visible={isVisible} />
        </div>

        <div className="w-full">
          <HistoryPayments userId={userId}/>
        </div>
      </div>
    </div>
  );
};

export default FinancesPage;
