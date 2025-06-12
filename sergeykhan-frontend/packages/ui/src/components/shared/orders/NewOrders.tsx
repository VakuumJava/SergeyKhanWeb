"use client";

import React, { useState, useEffect, useMemo } from "react";
import { OrdersDataTable } from "@shared/orders/(beta-orders)/OrdersTable";
import { api } from "@shared/utils/api";
import { columns, Order } from "@shared/constants/orders";

export default function NewOrders() {
  const [data, setData] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    api
        .get<Order[]>("/api/orders/new/")
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

  const memoCols = useMemo(() => columns, []);
  const memoData = useMemo(() => data, [data]);

  if (loading) return <div className="p-4 text-center">Загрузка новых заказов...</div>;
  if (error) return <div className="p-4 text-center text-red-500">Ошибка: {error}</div>;
  if (!memoData.length) return <div className="p-4 text-center">Новых заказов нет</div>;

  return (
      <div className="p-4">
        <OrdersDataTable
            data={memoData}
            columns={memoCols}
            isEdit={false}
            onSelectedChange={() => {}}
            status="curator"
            isModel={false}
        />
      </div>
  );
};
