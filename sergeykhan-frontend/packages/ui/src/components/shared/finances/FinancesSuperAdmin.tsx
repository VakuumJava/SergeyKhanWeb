"use client";

import { useEffect, useState } from "react";
import { CompanyBalanceManager } from "@shared/balance/CompanyBalanceManager";
import { API } from "@shared/constants/constants";

interface CompanyBalanceData {
  balance_type: "company";
  amount: number;
  display_name: string;
}

export const FinancesSuperAdmin = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isCompany, setIsCompany] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = typeof window !== "undefined" ? localStorage.getItem("user_id") : null;
    setUserId(id);
    if (!id) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${API}/api/balance/${id}/dashboard/`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data: CompanyBalanceData) => {
        console.log('API Response:', data);
        setIsCompany(data.balance_type === "company");
        setLoading(false);
        setError(null);
      })
      .catch((error) => {
        console.error('API Error:', error);
        setLoading(false);
        setError(error.message || 'Ошибка при получении данных');
        if (typeof window !== "undefined" && window.location.pathname === "/finance") {
          setIsCompany(true);
        }
      });
  }, []);

  if (!userId) {
    return <div className="w-full container"><div className="flex items-center justify-center p-8"><span className="text-red-500">Пользователь не авторизован</span></div></div>;
  }

  if (loading) {
    return <div className="w-full container"><div className="flex items-center justify-center p-8">Загрузка...</div></div>;
  }
  
  if (!isCompany && window.location.pathname !== "/finance") {
    return <div className="w-full container"><div className="flex items-center justify-center p-8 text-red-500">Нет доступа к балансу компании</div></div>;
  }
  
  return (
    <div className="w-full container mx-auto px-4 py-8">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Финансы компании</h1>
          <p className="text-gray-600">Просмотр и управление балансом компании</p>
          {error && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              Примечание: Произошла ошибка при загрузке данных. Отображается интерфейс баланса компании.
            </div>
          )}
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Баланс компании</h2>
          <CompanyBalanceManager userId={userId} showControls={true} />
        </div>
      </div>
    </div>
  );
};
