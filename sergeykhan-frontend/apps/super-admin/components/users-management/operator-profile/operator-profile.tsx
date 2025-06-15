"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { API } from "@shared/constants/constants";
import { Master as Operator } from "@shared/constants/types";
import { HistoryPayments } from "@shared/finances/chartFinances/historyPayments";
import { UniversalBalanceManager } from "@workspace/ui/components/shared";
import { Button } from "@workspace/ui/components/ui";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@workspace/ui/components/ui";

interface OperatorProfileProps {
    id: string;
}

const OperatorProfile: React.FC<OperatorProfileProps> = ({ id }) => {
    const [operator, setOperator] = useState<Operator | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    // Fetch operator profile
    const fetchProfile = async () => {
        setLoadingProfile(true);
        setError(null);
        try {
            const res = await axios.get<Operator>(`${API}/users/${id}/`, {
                headers: { Authorization: `Token ${token}` },
            });
            setOperator(res.data);
        } catch (err) {
            console.error("Ошибка загрузки профиля оператора", err);
            setError("Не удалось загрузить профиль оператора");
        } finally {
            setLoadingProfile(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [id]);

    const handleDeleteAccount = async () => {
        try {
            await axios.delete(`${API}/users/${id}/`, {
                headers: { Authorization: `Token ${token}` },
            });
            setOperator(null);
            setDeleteDialogOpen(false);
        } catch (err) {
            console.error("Ошибка удаления аккаунта оператора", err);
        }
    };

    if (loadingProfile) return <div>Загрузка профиля...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!operator) return <div>Оператор не найден</div>;

    return (
        <div className="flex flex-col mt-5 gap-5">
            <h1 className="text-xl text-center md:text-2xl font-bold">
                Профиль оператора {operator.name}
            </h1>
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
            {/* История звонков */}
            {/*<CallsDataTable called={operator.called as CallLog[]} />*/}
            {/* Удаление аккаунта */}
            <div className="flex justify-center mt-10">
                <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                    Удалить аккаунт
                </Button>
            </div>
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Удалить аккаунт?</DialogTitle>
                    </DialogHeader>
                    <p>Это действие необратимо.</p>
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

export default OperatorProfile;