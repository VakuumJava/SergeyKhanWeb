"use client";

import React, { useState, useEffect, useMemo } from "react";
import { api } from "@shared/utils/api";          // наш инстанс
import { OrdersDataTable } from "./(beta-orders)/OrdersTable";
import { columns, Order } from "@shared/constants/orders";
import {API} from "@shared/constants/constants";

export default function ReDoneOrders() {
    const [data, setData] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        const id = localStorage.getItem('user_id');
        api.get<Order[]>(`${API}/orders/guaranteed/${id}`)          // обращаемся к api.baseURL + this path
            .then(res => mounted && setData(res.data))
            .catch(err => mounted && setError(err.response?.data?.detail || err.message))
            .finally(() => mounted && setLoading(false));
        return () => { mounted = false; };


    }, []);

    const memoCols = useMemo(() => columns, []);
    const memoData = useMemo(() => data, [data]);
    console.log(memoData)
    if (loading) return <div className="p-4 text-center">Загрузка заказов...</div>;
    if (error)   return <div className="p-4 text-center text-red-500">Ошибка: {error}</div>;
    if (!data.length) return <div className="p-4 text-center">Заказы отсутствуют</div>;

    return (
        <div className="p-4">
            <OrdersDataTable
                data={memoData}
                columns={memoCols}
                isEdit={false}
                isModel={false}
            />
        </div>
    );
}