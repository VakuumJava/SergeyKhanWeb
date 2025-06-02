"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '@shared/constants/constants';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Textarea } from '@workspace/ui/components/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from '@workspace/ui/components/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Loader2, Plus, Minus, History, Wallet, PiggyBank } from 'lucide-react';

interface BalanceData {
    current_balance: number;
    paid_amount: number;
    total_earned: number;
}

interface BalanceLog {
    id: number;
    balance_type: string;
    balance_type_display: string;
    action_type: string;
    action_type_display: string;
    amount: string;
    reason: string;
    performed_by_email: string;
    old_value: string;
    new_value: string;
    created_at: string;
}

interface NewBalanceManagerProps {
    userId: string;
}

const NewBalanceManager: React.FC<NewBalanceManagerProps> = ({ userId }) => {
    const [balance, setBalance] = useState<BalanceData | null>(null);
    const [logs, setLogs] = useState<BalanceLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [logsDialogOpen, setLogsDialogOpen] = useState(false);
    
    // Form state
    const [balanceType, setBalanceType] = useState<'current' | 'paid'>('current');
    const [actionType, setActionType] = useState<'top_up' | 'deduct'>('top_up');
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [processing, setProcessing] = useState(false);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

    const fetchBalance = async () => {
        try {
            const response = await axios.get<BalanceData>(
                `${API}/api/balance/${userId}/detailed/`,
                { headers: { Authorization: `Token ${token}` } }
            );
            setBalance(response.data);
        } catch (error) {
            console.error('Ошибка загрузки баланса:', error);
        }
    };

    const fetchLogs = async () => {
        try {
            const response = await axios.get<BalanceLog[]>(
                `${API}/api/balance/${userId}/logs/detailed/`,
                { headers: { Authorization: `Token ${token}` } }
            );
            setLogs(response.data);
        } catch (error) {
            console.error('Ошибка загрузки логов:', error);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchBalance(), fetchLogs()]);
            setLoading(false);
        };
        loadData();
    }, [userId]);

    const handleBalanceModification = async () => {
        if (!amount || !reason.trim()) {
            alert('Заполните все поля');
            return;
        }

        setProcessing(true);
        try {
            await axios.post(
                `${API}/api/balance/${userId}/modify/`,
                {
                    balance_type: balanceType,
                    action_type: actionType,
                    amount: parseFloat(amount),
                    reason: reason.trim()
                },
                { headers: { Authorization: `Token ${token}` } }
            );

            // Сброс формы
            setAmount('');
            setReason('');
            setDialogOpen(false);

            // Обновление данных
            await Promise.all([fetchBalance(), fetchLogs()]);
        } catch (error) {
            console.error('Ошибка изменения баланса:', error);
            alert('Ошибка при изменении баланса');
        } finally {
            setProcessing(false);
        }
    };

    const formatCurrency = (value: number) => {
        return `${value.toLocaleString('ru-RU')} ₸`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Загрузка данных о балансе...</span>
            </div>
        );
    }

    if (!balance) {
        return (
            <div className="text-center p-8 text-red-500">
                Ошибка загрузки данных о балансе
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Карточки с балансами */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Текущий баланс</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(balance.current_balance)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Доступные средства
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Выплачено</CardTitle>
                        <PiggyBank className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency(balance.paid_amount)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Уже выведенные средства
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Общий заработок</CardTitle>
                        <History className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            {formatCurrency(balance.total_earned)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Заработано всего
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Кнопки управления */}
            <div className="flex gap-4">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Изменить баланс
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Изменение баланса</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="balance-type">Тип баланса</Label>
                                <Select value={balanceType} onValueChange={(value: 'current' | 'paid') => setBalanceType(value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="current">Текущий баланс</SelectItem>
                                        <SelectItem value="paid">Выплаченная сумма</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="action-type">Действие</Label>
                                <Select value={actionType} onValueChange={(value: 'top_up' | 'deduct') => setActionType(value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="top_up">
                                            <div className="flex items-center gap-2">
                                                <Plus className="h-4 w-4 text-green-600" />
                                                Пополнить
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="deduct">
                                            <div className="flex items-center gap-2">
                                                <Minus className="h-4 w-4 text-red-600" />
                                                Списать
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="amount">Сумма</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    placeholder="Введите сумму"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reason">Причина</Label>
                                <Textarea
                                    id="reason"
                                    placeholder="Укажите причину изменения баланса"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Отмена</Button>
                            </DialogClose>
                            <Button 
                                onClick={handleBalanceModification}
                                disabled={processing}
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Обработка...
                                    </>
                                ) : (
                                    'Применить'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={logsDialogOpen} onOpenChange={setLogsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="flex items-center gap-2">
                            <History className="h-4 w-4" />
                            История операций
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>История операций с балансом</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                            {logs.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    История операций пуста
                                </p>
                            ) : (
                                logs.map((log) => (
                                    <Card key={log.id}>
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={log.action_type === 'top_up' ? 'default' : 'destructive'}>
                                                        {log.action_type === 'top_up' ? '↗' : '↘'} {log.action_type_display}
                                                    </Badge>
                                                    <Badge variant="outline">
                                                        {log.balance_type_display}
                                                    </Badge>
                                                </div>
                                                <span className="text-sm text-muted-foreground">
                                                    {formatDate(log.created_at)}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="font-medium">Сумма: </span>
                                                    <span className={log.action_type === 'top_up' ? 'text-green-600' : 'text-red-600'}>
                                                        {log.action_type === 'top_up' ? '+' : '-'}{parseFloat(log.amount).toLocaleString('ru-RU')} ₸
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="font-medium">Исполнитель: </span>
                                                    <span>{log.performed_by_email}</span>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="font-medium">Изменение: </span>
                                                    <span>
                                                        {parseFloat(log.old_value).toLocaleString('ru-RU')} ₸ → {parseFloat(log.new_value).toLocaleString('ru-RU')} ₸
                                                    </span>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="font-medium">Причина: </span>
                                                    <span className="text-muted-foreground">{log.reason}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Закрыть</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default NewBalanceManager;
