"use client";
import React, { useState, useEffect, useMemo } from "react";
import { api } from "@shared/utils/api";
import { OrdersDataTable } from "@shared/orders/(beta-orders)/OrdersTable";
import { columns, Order } from "@shared/constants/orders";

export default function Last4hours() {
    const [data, setData] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        api
          .get<Order[]>("/api/orders/last-4hours/")
          .then(res => mounted && setData(res.data))
          .catch(err => mounted && setError(err.message))
          .finally(() => mounted && setLoading(false));
        return () => { mounted = false };
    }, []);

    const memoCols = useMemo(() => columns, []);
    const memoData = useMemo(() => data, [data]);

    if (loading) return <div className="p-4 text-center">Загрузка...</div>;
    if (error)   return <div className="p-4 text-red-500">{error}</div>;
    if (!data.length) return <div className="p-4 text-center">Нет заказов</div>;

    return (
      <OrdersDataTable
        data={memoData}
        columns={memoCols}
        isEdit={false}
        isModel={false}
      />
    );
}