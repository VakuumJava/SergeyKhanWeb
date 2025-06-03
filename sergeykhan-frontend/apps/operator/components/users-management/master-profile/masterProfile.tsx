"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { API } from "@shared/constants/constants";
import { Master, } from "@shared/constants/types";
import { HistoryPayments } from "@shared/finances/chartFinances/historyPayments";
import { OrdersDataTable } from "@shared/orders/(beta-orders)/OrdersTable";
import { columns, Order as OrderType  } from "@shared/constants/orders";
import OperatorBalanceView from "@/components/balance-view/OperatorBalanceView";
import { MasterCalendar } from "@workspace/ui/components/master-calendar";
// import { MasterDistanceTable } from "./MasterDistanceTable"; // Temporarily disabled

interface MasterProfileProps {
    id: string;
}

/**
 * Профиль мастера c балансом, графиком, логом платежей и списком заказов.
 */
const MasterProfile: React.FC<MasterProfileProps> = ({ id }) => {
    // ──────────────── state ────────────────
    const [master, setMaster] = useState<Master | null>(null);
    const [orders, setOrders] = useState<OrderType[]>([]);
    const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
    const [loadingOrders, setLoadingOrders] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : "";

    // ──────────────── helpers ────────────────
    const fetchProfile = async () => {
        setLoadingProfile(true);
        setError(null);
        try {
            const res = await axios.get<Master>(`${API}/users/${id}/`, {
                headers: { Authorization: `Token ${token}` },
            });
            setMaster(res.data);
        } catch (err) {
            console.error("Ошибка загрузки профиля мастера", err);
            setError("Не удалось получить данные мастера");
        } finally {
            setLoadingProfile(false);
        }
    };

    const fetchOrders = async () => {
        setLoadingOrders(true);
        try {
            const res = await axios.get<OrderType[]>(
                `${API}/orders/master/${id}/`,
                { headers: { Authorization: `Token ${token}` } }
            );
            setOrders(res.data);
        } catch (err) {
            console.error("Ошибка загрузки заказов мастера", err);
        } finally {
            setLoadingOrders(false);
        }
    };

    useEffect(() => {
        fetchProfile();
        fetchOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // ──────────────── render ────────────────
    if (loadingProfile) {
        return <div>Загрузка профиля...</div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    if (!master) {
        return <div>Мастер не найден</div>;
    }

    return (
        <div className="container p-4">
            {/* Заголовок с именем мастера */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold">
                    {master.first_name} {master.last_name}
                </h1>
                <p className="text-gray-600">{master.email}</p>
                <p className="text-sm text-gray-500">ID: {master.id}</p>
            </div>

            {/* Баланс и операции */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Баланс - только просмотр для операторов */}
                <div className="rounded-xl border px-5 py-7">
                    <OperatorBalanceView userId={id} />
                </div>

                {/* История платежей */}
                <div className="rounded-xl border px-5 py-7 h-full">
                    <HistoryPayments userId={id} />
                </div>
            </div>

            {/* Календарь мастера */}
            <div className="pt-5">
                <div className="rounded-xl border p-6">
                    <h3 className="text-lg font-semibold mb-4">📅 График загруженности мастера</h3>
                    <MasterCalendar 
                        masterId={parseInt(id)} 
                        userRole="operator" 
                        readOnly={true}
                        showCreateButton={false}
                    />
                </div>
            </div>

            {/* Уровень дистанционки мастера */}
            <div className="pt-5">
                <div className="rounded-xl border p-6">
                    {/* <MasterDistanceTable masterId={parseInt(id)} /> */}
                    <div className="text-yellow-600">⚠️ Компонент дистанционки временно отключен</div>
                </div>
            </div>

            {/* Таблица заказов мастера */}
            <div className="pt-5">
                {loadingOrders ? (
                    <div>Загрузка заказов...</div>
                ) : (
                    <OrdersDataTable masterId={id} data={orders} columns={columns} status="operator" />
                )}
            </div>
        </div>
    );
};

export default MasterProfile;
