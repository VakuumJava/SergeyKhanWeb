"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@shared/constants/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Wallet, PiggyBank, TrendingUp } from 'lucide-react';

interface BalanceData {
    current_balance: number;
    paid_amount: number;
}

interface OperatorBalanceViewProps {
    userId: string;
}

const OperatorBalanceView: React.FC<OperatorBalanceViewProps> = ({ userId }) => {
    const [balance, setBalance] = useState<BalanceData | null>(null);
    const [loading, setLoading] = useState(true);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const fetchBalance = async () => {
        if (!userId || !token) return;
        try {
            const response = await axios.get<BalanceData>(
                `${API}/api/balance/${userId}/detailed/`,
                { headers: { Authorization: `Token ${token}` } }
            );
            setBalance(response.data);
        } catch (error) {
            console.error('Ошибка загрузки баланса:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBalance();
    }, [userId]);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5" />
                        Баланс мастера
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-gray-500">Загрузка...</div>
                </CardContent>
            </Card>
        );
    }

    if (!balance) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5" />
                        Баланс мастера
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-red-500">Не удалось загрузить данные о балансе</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Текущий баланс */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Текущий баланс</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                        {balance.current_balance.toLocaleString()} ₸
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Доступно для снятия
                    </p>
                </CardContent>
            </Card>

            {/* Выплаченная сумма */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Выплачено</CardTitle>
                    <PiggyBank className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                        {balance.paid_amount.toLocaleString()} ₸
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Уже снято мастером
                    </p>
                </CardContent>
            </Card>

            {/* Еще не выплачено */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Еще не выплачено</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                        {Math.max(0, balance.current_balance - balance.paid_amount).toLocaleString()} ₸
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Остается к выплате
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default OperatorBalanceView;
