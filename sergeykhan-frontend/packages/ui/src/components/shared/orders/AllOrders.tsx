"use client";

import React, { useState, useEffect, useMemo } from "react";
import { OrdersDataTable } from "@shared/orders/(beta-orders)/OrdersTable";
import { api } from "@shared/utils/api";
import { columns, Order } from "@shared/constants/orders";

export interface ActiveOrdersProps {
  isActiveEdit: boolean;
  onSelectedChange: (selected: Order[]) => void;
  masterId?: string;
}

export default function ActiveOrders({ isActiveEdit, onSelectedChange, masterId }: ActiveOrdersProps) {
  const [data, setData] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    api
        .get<Order[]>("/api/orders/all/")
        .then(res => {
          if (mounted) setData(res.data);
        })
        .catch(err => {
          if (mounted) setError(err.response?.data?.detail || err.message);
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    return () => {
      mounted = false;
    };
  }, []);

  // если передан masterId, исключаем уже назначенные этому мастеру заказы
  const filteredData = useMemo(() => {
    if (!masterId) return data;
    return data.filter(order => String(order.assigned_master) !== masterId);
  }, [data, masterId]);

  const memoCols = useMemo(() => columns, []);
  const memoData = useMemo(() => filteredData, [filteredData]);

  if (loading) return <div className="p-4 text-center">Загрузка активных заказов...</div>;
  if (error) return <div className="p-4 text-center text-red-500">Ошибка: {error}</div>;
  if (!memoData.length) return <div className="p-4 text-center">Активных заказов нет</div>;

  return (
      <div className="p-4">
        <OrdersDataTable
            data={memoData}
            columns={memoCols}
            isEdit={isActiveEdit}
            onSelectedChange={onSelectedChange}
            status="curator"
            masterId={masterId?.toString()}
            isModel={false}
        />
      </div>
  );
}