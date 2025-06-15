"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { API } from "@shared/constants/constants";
import { Master } from "@shared/constants/types";
import { HistoryPayments } from "@shared/finances/chartFinances/historyPayments";
import { OrdersDataTable } from "@shared/orders/(beta-orders)/OrdersTable";
import { columns, Order } from "@shared/constants/orders";
import { UniversalBalanceManager, WorkScheduleTable } from "@workspace/ui/components/shared";
import { Button } from "@workspace/ui/components/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/ui";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@workspace/ui/components/ui";

interface WarrantyMasterProfileProps {
    id: string;
}

/**
 * Профиль гарантийного мастера c балансом, графиком, логом платежей и списком заказов.
 */
const WarrantyMasterProfile: React.FC<WarrantyMasterProfileProps> = ({ id }) => {
    // ──────────────── state ────────────────
    const [master, setMaster] = useState<Master | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
    const [loadingOrders, setLoadingOrders] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

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
            console.error("Ошибка загрузки профиля гарантийного мастера", err);
            setError("Не удалось получить данные гарантийного мастера");
        } finally {
            setLoadingProfile(false);
        }
    };

    const fetchOrders = async () => {
        setLoadingOrders(true);
        try {
            const res = await axios.get<Order[]>(
                `${API}/orders/warranty-master/${id}/`,
                { headers: { Authorization: `Token ${token}` } }
            );
            setOrders(res.data);
        } catch (err) {
            console.error("Ошибка загрузки заказов гарантийного мастера", err);
        } finally {
            setLoadingOrders(false);
        }
    };

    useEffect(() => {
        fetchProfile();
        fetchOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // ──────────────── handlers ────────────────
    const handleDeleteAccount = async () => {
        try {
            await axios.delete(`${API}/users/${id}/`, {
                headers: { Authorization: `Token ${token}` },
            });
            setDeleteDialogOpen(false);
            setMaster(null);
        } catch (err) {
            console.error("Ошибка удаления аккаунта гарантийного мастера", err);
        }
    };

    // ──────────────── UI ────────────────
    if (loadingProfile) return <div>Загрузка профиля...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!master) return <div>Гарантийный мастер не найден</div>;

    return (
        <div className="flex flex-col mt-5 gap-5">
            <h1 className="text-xl text-center md:text-2xl mb-5 font-bold">
                Профиль гарантийного мастера: <span className="text-orange-600">{master.email}</span>
            </h1>

            {/* Статистика гарантийного мастера */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>
                            Всего заказов
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{orders.length}</div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>
                            Заказы в работе
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {orders.filter(order => order.status === 'in_progress').length}
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>
                            Выполненные заказы
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {orders.filter(order => order.status === 'completed').length}
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>
                            Общий заработок
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {orders
                                .filter(order => order.status === 'completed')
                                .reduce((sum, order) => sum + (parseFloat(order.final_cost) || 0), 0)
                            } ₽
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* блок: баланс, лог, график */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                {/* Новый компонент управления балансами */}
                <div className="flex flex-col gap-5">
                    <UniversalBalanceManager 
                        userId={id} 
                        currentUserRole="super-admin"
                        showControls={true}
                        readonly={false}
                    />
                </div>

                {/* История платежей */}
                <div className="rounded-xl border px-5 py-7 h-full">
                    <HistoryPayments userId={id} />
                </div>
            </div>

            {/* Расписание и слоты гарантийного мастера */}
            <div className="pt-5">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <span>🔧</span>
                            Расписание и слоты гарантийного мастера
                        </CardTitle>
                        <CardDescription>
                            Управление расписанием работы гарантийного мастера, просмотр занятых и свободных слотов.
                            Нажмите на занятый слот для просмотра деталей заказа.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <WorkScheduleTable 
                            userRole="super-admin"
                            masterId={parseInt(id)}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Таблица заказов гарантийного мастера */}
            <div className="pt-5">
                {loadingOrders ? (
                    <div>Загрузка заказов...</div>
                ) : (
                    <OrdersDataTable masterId={id} data={orders} columns={columns} status="curator" />
                )}
            </div>

            {/* Удаление аккаунта */}
            <div className="flex justify-center mt-10">
                <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                    Удалить аккаунт
                </Button>
            </div>
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Удалить?</DialogTitle>
                    </DialogHeader>
                    <p>Это действие необратимо</p>
                    <DialogFooter className="flex justify-end gap-2">
                        <DialogClose asChild>
                            <Button variant="outline">Отмена</Button>
                        </DialogClose>
                        <Button variant="destructive" onClick={handleDeleteAccount}>
                            Удалить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default WarrantyMasterProfile;
