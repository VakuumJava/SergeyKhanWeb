// apps/master/components/orders-taken/OrdersTakenPage.tsx
"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { columns } from "@workspace/ui/components/shared/constants/orders";
import { OrdersTakenDataTable } from "@shared/orders/orders-taken/OrdersTakenTable";
import {API} from "@shared/constants/constants";

// Configure base API client
export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
    withCredentials: true,  // если нужен куки-авторизация
});

export default function OrdersTakenPage() {
    const [ordersData, setOrdersData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAssigned = async () => {
            try {
                // Получаем user_id из localStorage
                const userId = localStorage.getItem('user_id');
                const token = localStorage.getItem('token');
                if (!userId) {
                    throw new Error('User ID not found in localStorage');
                }
                // Отправляем GET-запрос к endpoint
                const { data } = await api.get(`${API}/orders/master/${userId}/`,
                    { headers: { Authorization: `Token ${token}` } }
                );
                console.log('Полученные данные:', data);
                setOrdersData(data);
            } catch (err: any) {
                console.error('Ошибка загрузки назначенных заказов:', err);
                setError(err.message || 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        fetchAssigned();
    }, []);

    if (loading) {
        return <div>Загрузка заказов...</div>;
    }
    if (error) {
        return <div className="text-red-500">Ошибка: {error}</div>;
    }

    return (
        <div className="w-full">
            <OrdersTakenDataTable data={ordersData} columns={columns} />
        </div>
    );
}
