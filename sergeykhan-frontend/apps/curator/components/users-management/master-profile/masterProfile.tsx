"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { API } from "@shared/constants/constants";
import { Master, } from "@shared/constants/types";
import { HistoryPayments } from "@shared/finances/chartFinances/historyPayments";
import { OrdersDataTable } from "@shared/orders/(beta-orders)/OrdersTable";
import { columns, Order as OrderType  } from "@shared/constants/orders";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { MasterCalendar } from "@workspace/ui/components/master-calendar";
import TokenSetter from "@/components/token-setter";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@workspace/ui/components/dialog";
import {ChartBalanceProfile} from "@/components/users-management/charts/chartBalanceProfile";
import { UniversalBalanceManager } from "@workspace/ui/components/shared";

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

    // ──────────────── handlers ────────────────

    const handleDeleteAccount = async () => {
        try {
            await axios.delete(`${API}/users/${id}/`, {
                headers: { Authorization: `Token ${token}` },
            });
            setDeleteDialogOpen(false);
            setMaster(null);
        } catch (err) {
            console.error("Ошибка удаления аккаунта мастера", err);
        }
    };

    // ──────────────── UI ────────────────
    if (loadingProfile) return <div>Загрузка профиля...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!master) return <div>Мастер не найден</div>;

    return (
        <div className="flex flex-col mt-5 gap-5">
            <h1 className="text-xl text-center md:text-2xl mb-5 font-bold">
                Профиль мастера {master.name}
            </h1>

            {/* блок: баланс, лог, график */}
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-16 items-start">
                {/* Новый компонент управления балансом */}
                <div className="rounded-xl border p-6">
                    <h2 className="text-lg font-semibold mb-4">💰 Управление балансом</h2>
                    <UniversalBalanceManager 
                        userId={id} 
                        currentUserRole="curator"
                        showControls={true}
                        readonly={false}
                    />
                </div>

                {/* История платежей */}
                <div className="rounded-xl border px-5 py-7 h-full">
                    <HistoryPayments userId={id} />
                </div>

                {/* График баланса */}
                {/*<ChartBalanceProfile />*/}
            </div>

            {/* Календарь мастера */}
            <div className="pt-5">
                <div className="rounded-xl border p-6">
                    <h3 className="text-lg font-semibold mb-4">📅 График загруженности мастера</h3>
                    <MasterCalendar 
                        masterId={parseInt(id)} 
                        userRole="curator" 
                        readOnly={true}
                        showCreateButton={false}
                    />
                </div>
            </div>

            {/* Таблица заказов мастера */}
            <div className="pt-5">{loadingOrders ? (
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

export default MasterProfile;
