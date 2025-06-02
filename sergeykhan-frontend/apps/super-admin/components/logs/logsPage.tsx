"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@workspace/ui/components/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@workspace/ui/components/tabs";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@workspace/ui/components/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@workspace/ui/components/dialog";
import { ChevronDown, ChevronRight, Eye, FileText, Phone, PhoneOff } from "lucide-react";
import { api } from "@workspace/ui/components/shared/utils/api";

// Types for the data
interface OrderLog {
    id: number;
    order: number;
    action: string;
    performed_by: number | null;
    performed_by_email: string | null;
    description: string;
    old_value: string | null;
    new_value: string | null;
    created_at: string;
}

interface TransactionLog {
    id: number;
    user: number | null;
    user_email: string | null;
    transaction_type: string;
    amount: string;
    description: string;
    order: number | null;
    performed_by: number | null;
    performed_by_email: string | null;
    created_at: string;
}

interface OrderDetails {
    id: number;
    title: string;
    description: string;
    status: string;
    user_email: string;
    client_name?: string;
    phone_number?: string; // Will be hidden for masters
    created_at: string;
    updated_at: string;
    master_assigned?: string;
    price?: string;
    location?: string;
    category?: string;
}

interface LogsResponse {
    logs: OrderLog[] | TransactionLog[];
    total_count: number;
    page: number;
    limit: number;
    has_next: boolean;
}

const LogsPage = () => {
    const [activeTab, setActiveTab] = useState<"orders" | "logs" | "all">("orders");
    
    // State for order logs
    const [orderLogs, setOrderLogs] = useState<OrderLog[]>([]);
    const [orderLogsPage, setOrderLogsPage] = useState(1);
    const [orderLogsHasNext, setOrderLogsHasNext] = useState(false);
    
    // State for transaction logs
    const [transactionLogs, setTransactionLogs] = useState<TransactionLog[]>([]);
    const [transactionLogsPage, setTransactionLogsPage] = useState(1);
    const [transactionLogsHasNext, setTransactionLogsHasNext] = useState(false);
    
    // Loading and error states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // State for expandable logs
    const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());
    
    // State for order details modal
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
    const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
    const [showOrderModal, setShowOrderModal] = useState(false);
    
    // User role state (to determine if user is master)
    const [userRole, setUserRole] = useState<string>('admin'); // This should come from auth context
    
    // Get user role from auth context or localStorage
    useEffect(() => {
        // This should be replaced with actual auth context
        const storedRole = localStorage.getItem('userRole') || 'admin';
        setUserRole(storedRole);
    }, []);

    // Fetch order logs
    const fetchOrderLogs = async (page = 1) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/api/logs/orders/?page=${page}&limit=20`);
            if (page === 1) {
                setOrderLogs(response.data.logs);
            } else {
                setOrderLogs(prev => [...prev, ...response.data.logs]);
            }
            setOrderLogsHasNext(response.data.has_next);
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Ошибка загрузки логов заказов');
        } finally {
            setLoading(false);
        }
    };

    // Fetch transaction logs
    const fetchTransactionLogs = async (page = 1) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/api/logs/transactions/?page=${page}&limit=20`);
            if (page === 1) {
                setTransactionLogs(response.data.logs);
            } else {
                setTransactionLogs(prev => [...prev, ...response.data.logs]);
            }
            setTransactionLogsHasNext(response.data.has_next);
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || 'Ошибка загрузки логов транзакций');
        } finally {
            setLoading(false);
        }
    };

    // Load more order logs
    const loadMoreOrderLogs = () => {
        const nextPage = orderLogsPage + 1;
        setOrderLogsPage(nextPage);
        fetchOrderLogs(nextPage);
    };

    // Load more transaction logs
    const loadMoreTransactionLogs = () => {
        const nextPage = transactionLogsPage + 1;
        setTransactionLogsPage(nextPage);
        fetchTransactionLogs(nextPage);
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('ru-RU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get action name in Russian
    const getActionName = (action: string) => {
        const actionMap: Record<string, string> = {
            'created': 'Создан',
            'status_changed': 'Статус изменен',
            'master_assigned': 'Мастер назначен',
            'master_removed': 'Мастер снят',
            'transferred': 'Переведен на гарантию',
            'completed': 'Завершен',
            'deleted': 'Удален',
            'updated': 'Обновлен',
            'cost_updated': 'Стоимость обновлена',
            'approved': 'Одобрен',
            'cancelled': 'Отменен',
            'payment_received': 'Платеж получен',
            'refunded': 'Возврат',
            'escalated': 'Эскалирован',
            'reassigned': 'Переназначен'
        };
        return actionMap[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    // Get action badge with shadcn variants
    const getActionBadge = (action: string) => {
        const actionConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline" }> = {
            'created': { variant: 'default' },
            'status_changed': { variant: 'secondary' },
            'master_assigned': { variant: 'outline' },
            'master_removed': { variant: 'destructive' },
            'transferred': { variant: 'secondary' },
            'completed': { variant: 'default' },
            'deleted': { variant: 'destructive' },
            'updated': { variant: 'secondary' },
            'cost_updated': { variant: 'outline' },
            'approved': { variant: 'default' },
            'cancelled': { variant: 'destructive' },
            'payment_received': { variant: 'default' },
            'refunded': { variant: 'secondary' },
            'escalated': { variant: 'destructive' },
            'reassigned': { variant: 'outline' }
        };
        return actionConfig[action] || { variant: 'outline' as const };
    };

    // Get transaction type name in Russian
    const getTransactionTypeName = (type: string) => {
        const typeMap: Record<string, string> = {
            'master_payment': 'Оплата мастеру',
            'fine': 'Штраф',
            'bonus': 'Бонус',
            'warranty_fine': 'Штраф за гарантию',
            'warranty_payment': 'Оплата гарантии',
            'refund': 'Возврат',
            'balance_deduct': 'Списание баланса',
            'balance_add': 'Пополнение баланса',
            'balance_top_up': 'Пополнение баланса',
            'payment': 'Платеж',
            'withdrawal': 'Вывод средств',
            'commission': 'Комиссия',
            'penalty': 'Штраф',
            'reward': 'Вознаграждение',
            'correction': 'Корректировка',
            'transfer': 'Перевод',
            'cashback': 'Кэшбэк',
            'fee': 'Комиссия',
            'interest': 'Проценты',
            'deposit': 'Депозит',
            'service_fee': 'Сервисный сбор',
            'adjustment': 'Корректировка'
        };
        return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    // Get transaction type badge with shadcn variants
    const getTransactionBadge = (type: string) => {
        const typeConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline" }> = {
            'master_payment': { variant: 'default' },
            'fine': { variant: 'destructive' },
            'bonus': { variant: 'outline' },
            'warranty_fine': { variant: 'destructive' },
            'warranty_payment': { variant: 'default' },
            'refund': { variant: 'secondary' },
            'balance_deduct': { variant: 'destructive' },
            'balance_add': { variant: 'default' },
            'balance_top_up': { variant: 'default' },
            'payment': { variant: 'default' },
            'withdrawal': { variant: 'secondary' },
            'commission': { variant: 'outline' },
            'penalty': { variant: 'destructive' },
            'reward': { variant: 'outline' },
            'correction': { variant: 'secondary' },
            'transfer': { variant: 'secondary' },
            'cashback': { variant: 'outline' },
            'fee': { variant: 'outline' },
            'interest': { variant: 'outline' },
            'deposit': { variant: 'default' },
            'service_fee': { variant: 'outline' },
            'adjustment': { variant: 'secondary' }
        };
        return typeConfig[type] || { variant: 'outline' as const };
    };

    // Format amount with proper sign and color based on transaction type
    const formatAmount = (amount: string, transactionType?: string) => {
        const numAmount = parseFloat(amount);
        const absAmount = Math.abs(numAmount);
        
        // Определяем типы транзакций, которые должны отображаться как списание (красным с минусом)
        const deductionTypes = [
            'balance_deduct', 'fine', 'warranty_fine', 'penalty', 
            'withdrawal', 'commission', 'service_fee'
        ];
        
        // Определяем типы транзакций, которые должны отображаться как пополнение (зеленым с плюсом)
        const creditTypes = [
            'balance_add', 'balance_top_up', 'payment', 'bonus', 
            'master_payment', 'warranty_payment', 'refund', 
            'reward', 'cashback', 'deposit', 'interest'
        ];
        
        // Если сумма уже отрицательная в базе, используем её как есть
        const isNegativeInDB = numAmount < 0;
        const isPositiveInDB = numAmount > 0;
        
        // Определяем, как отображать в зависимости от типа транзакции
        const shouldShowAsDeduction = isNegativeInDB || (transactionType && deductionTypes.includes(transactionType));
        const shouldShowAsCredit = isPositiveInDB && (!transactionType || creditTypes.includes(transactionType) || !deductionTypes.includes(transactionType));
        
        return {
            text: shouldShowAsDeduction
                ? `-${absAmount}₸`  // Списание: минус и красный
                : shouldShowAsCredit 
                    ? `+${absAmount}₸`  // Пополнение: плюс и зеленый
                    : `${absAmount}₸`,   // Нейтральное: без знака
            className: shouldShowAsDeduction
                ? 'text-red-600 font-semibold' // Красный для списания
                : shouldShowAsCredit
                    ? 'text-green-600 font-semibold' // Зеленый для пополнения
                    : 'text-muted-foreground font-semibold'
        };
    };

    // Function to toggle log expansion
    const toggleLogExpansion = (logId: number) => {
        setExpandedLogs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(logId)) {
                newSet.delete(logId);
            } else {
                newSet.add(logId);
            }
            return newSet;
        });
    };

    // Function to collapse all expanded logs
    const collapseAllLogs = () => {
        setExpandedLogs(new Set());
    };

    // Function to fetch order details
    const fetchOrderDetails = async (orderId: number) => {
        setOrderDetailsLoading(true);
        setError(null); // Clear previous errors
        try {
            const response = await api.get(`/api/orders/${orderId}/detail/`);
            const details: OrderDetails = response.data;
            
            // Hide phone number for masters
            if (userRole === 'master' && details.phone_number) {
                details.phone_number = undefined;
            }
            
            setOrderDetails(details);
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || err.message || 'Ошибка загрузки деталей заказа';
            setError(errorMessage);
            setOrderDetails(null); // Clear order details on error
        } finally {
            setOrderDetailsLoading(false);
        }
    };

    // Function to open order details modal
    const openOrderDetails = (orderId: number) => {
        setSelectedOrderId(orderId);
        setShowOrderModal(true);
        fetchOrderDetails(orderId);
    };

    // Function to close order details modal
    const closeOrderModal = () => {
        setShowOrderModal(false);
        setSelectedOrderId(null);
        setOrderDetails(null);
    };

    // Function to render expandable log row details
    const renderLogDetails = (log: OrderLog) => {
        if (!expandedLogs.has(log.id)) return null;
        
        return (
            <TableRow key={`${log.id}-details`} className="hover:bg-transparent">
                <TableCell colSpan={7} className="bg-muted/30 p-0">
                    <div className="p-4 border-l-4 border-primary/20">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {log.old_value && (
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                            Старое значение
                                        </h4>
                                        <div className="text-sm bg-background p-3 rounded border border-red-200">
                                            {log.old_value}
                                        </div>
                                    </div>
                                )}
                                {log.new_value && (
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            Новое значение
                                        </h4>
                                        <div className="text-sm bg-background p-3 rounded border border-green-200">
                                            {log.new_value}
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {(!log.old_value && !log.new_value) && (
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        Полное описание
                                    </h4>
                                    <div className="text-sm bg-background p-3 rounded border">
                                        {log.description}
                                    </div>
                                </div>
                            )}
                            
                            <div className="flex justify-between items-center pt-3 border-t border-border/50">
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>ID лога: #{log.id}</span>
                                    <span>•</span>
                                    <span>Выполнен: {formatDate(log.created_at)}</span>
                                </div>
                                <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => openOrderDetails(log.order)}
                                    className="h-8 text-xs"
                                >
                                    <Eye className="w-3 h-3 mr-1" />
                                    Детали заказа
                                </Button>
                            </div>
                        </div>
                    </div>
                </TableCell>
            </TableRow>
        );
    };

    // Effect to load data when tab changes
    useEffect(() => {
        if (activeTab === "orders" || activeTab === "all") {
            fetchOrderLogs(1);
            setOrderLogsPage(1);
        }
        if (activeTab === "logs" || activeTab === "all") {
            fetchTransactionLogs(1);
            setTransactionLogsPage(1);
        }
    }, [activeTab]);

    const renderOrderLogs = () => (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <CardTitle>Логи заказов</CardTitle>
                        {orderLogs.length > 0 && (
                            <Badge variant="secondary">
                                {orderLogs.length}
                            </Badge>
                        )}
                    </div>
                    {expandedLogs.size > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={collapseAllLogs}
                            className="text-xs"
                        >
                            Свернуть все ({expandedLogs.size})
                        </Button>
                    )}
                </div>
                <CardDescription>
                    История действий с заказами
                </CardDescription>
            </CardHeader>
            <CardContent>
                {error && (
                    <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-destructive rounded-full flex-shrink-0"></div>
                            {error}
                        </div>
                    </div>
                )}
                
                {!loading && orderLogs.length === 0 && !error ? (
                    <div className="text-center py-8">
                        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold text-muted-foreground">Логи заказов не найдены</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Здесь будут отображаться все действия с заказами
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10"></TableHead>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Заказ</TableHead>
                                        <TableHead>Действие</TableHead>
                                        <TableHead>Описание</TableHead>
                                        <TableHead>Выполнил</TableHead>
                                        <TableHead>Дата</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orderLogs.map((log) => {
                                        const badgeConfig = getActionBadge(log.action);
                                        const isExpanded = expandedLogs.has(log.id);
                                        return (
                                            <React.Fragment key={log.id}>
                                                <TableRow 
                                                    className="hover:bg-muted/50 transition-colors cursor-pointer"
                                                    onClick={() => toggleLogExpansion(log.id)}
                                                >
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleLogExpansion(log.id);
                                                            }}
                                                            className="h-6 w-6 p-0 transition-transform duration-200"
                                                            style={{
                                                                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                                                            }}
                                                        >
                                                            <ChevronRight className="h-3 w-3" />
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell className="font-medium">#{log.id}</TableCell>
                                                    <TableCell>
                                                        <Badge 
                                                            variant="secondary"
                                                            className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openOrderDetails(log.order);
                                                            }}
                                                        >
                                                            #{log.order}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={badgeConfig.variant}>
                                                            {getActionName(log.action)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="max-w-xs">
                                                        <div className="truncate" title={log.description}>
                                                            {log.description}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {log.performed_by_email || (
                                                            <span className="italic">Система</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground text-sm">
                                                        {formatDate(log.created_at)}
                                                    </TableCell>
                                                </TableRow>
                                                {renderLogDetails(log)}
                                            </React.Fragment>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                        {orderLogsHasNext && (
                            <div className="mt-6 text-center">
                                <Button 
                                    onClick={loadMoreOrderLogs} 
                                    disabled={loading}
                                    variant="outline"
                                    className="min-w-[120px]"
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                                            Загрузка...
                                        </>
                                    ) : (
                                        'Загрузить еще'
                                    )}
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );

    const renderTransactionLogs = () => (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <CardTitle>Логи транзакций</CardTitle>
                        {transactionLogs.length > 0 && (
                            <Badge variant="secondary">
                                {transactionLogs.length}
                            </Badge>
                        )}
                    </div>
                </div>
                <CardDescription>
                    История финансовых операций
                </CardDescription>
            </CardHeader>
            <CardContent>
                {error && (
                    <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-destructive rounded-full flex-shrink-0"></div>
                            {error}
                        </div>
                    </div>
                )}
                
                {!loading && transactionLogs.length === 0 && !error ? (
                    <div className="text-center py-8">
                        <div className="mx-auto h-12 w-12 text-muted-foreground mb-4 flex items-center justify-center">
                            💰
                        </div>
                        <h3 className="text-lg font-semibold text-muted-foreground">Логи транзакций не найдены</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Здесь будут отображаться все финансовые операции
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Тип транзакции</TableHead>
                                        <TableHead>Сумма</TableHead>
                                        <TableHead>Описание</TableHead>
                                        <TableHead>Пользователь</TableHead>
                                        <TableHead>Выполнил</TableHead>
                                        <TableHead>Дата</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactionLogs.map((log) => {
                                        const badgeConfig = getTransactionBadge(log.transaction_type);
                                        const amountFormat = formatAmount(log.amount, log.transaction_type);
                                        return (
                                            <TableRow key={log.id} className="hover:bg-muted/50 transition-colors">
                                                <TableCell className="font-medium">#{log.id}</TableCell>
                                                <TableCell>
                                                    <Badge variant={badgeConfig.variant}>
                                                        {getTransactionTypeName(log.transaction_type)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={amountFormat.className}>
                                                        {amountFormat.text}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="max-w-xs">
                                                    <div className="truncate" title={log.description}>
                                                        {log.description}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {log.user_email || (
                                                        <span className="italic">Не указан</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {log.performed_by_email || (
                                                        <span className="italic">Система</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {formatDate(log.created_at)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                        {transactionLogsHasNext && (
                            <div className="mt-6 text-center">
                                <Button 
                                    onClick={loadMoreTransactionLogs} 
                                    disabled={loading}
                                    variant="outline"
                                    className="min-w-[120px]"
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                                            Загрузка...
                                        </>
                                    ) : (
                                        'Загрузить еще'
                                    )}
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );

    return (
        <div className="container mx-auto py-8 space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">
                    Система мониторинга
                </h1>
                <p className="text-muted-foreground text-lg">
                    Логи заказов и транзакций в реальном времени
                </p>
            </div>

            {/* Tabs Navigation */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "orders" | "logs" | "all")}>
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px] mx-auto">
                    <TabsTrigger value="orders">📋 Логи заказов</TabsTrigger>
                    <TabsTrigger value="logs">💰 Логи транзакций</TabsTrigger>
                    <TabsTrigger value="all">📊 Всё</TabsTrigger>
                </TabsList>

                {/* Loading State */}
                {loading && orderLogs.length === 0 && transactionLogs.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 space-y-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <div className="text-center">
                            <p className="text-muted-foreground">Загрузка данных...</p>
                            <p className="text-sm text-muted-foreground">Пожалуйста, подождите</p>
                        </div>
                    </div>
                )}

                {/* Content */}
                <TabsContent value="orders" className="space-y-6">
                    {renderOrderLogs()}
                </TabsContent>

                <TabsContent value="logs" className="space-y-6">
                    {renderTransactionLogs()}
                </TabsContent>

                <TabsContent value="all" className="space-y-6">
                    {renderOrderLogs()}
                    {renderTransactionLogs()}
                </TabsContent>
            </Tabs>

            {/* Order Details Modal */}
            <Dialog open={showOrderModal} onOpenChange={closeOrderModal}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Детали заказа #{selectedOrderId}
                        </DialogTitle>
                        <DialogDescription>
                            Полная информация о заказе
                        </DialogDescription>
                    </DialogHeader>
                    
                    {orderDetailsLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            <span className="ml-2 text-sm text-muted-foreground">Загрузка деталей заказа...</span>
                        </div>
                    ) : error ? (
                        <div className="p-6 text-center">
                            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <div className="w-4 h-4 bg-destructive rounded-full flex-shrink-0"></div>
                                    <span className="font-semibold">Ошибка загрузки</span>
                                </div>
                                <p className="text-sm">{error}</p>
                            </div>
                            <Button 
                                onClick={() => selectedOrderId && fetchOrderDetails(selectedOrderId)}
                                variant="outline"
                                size="sm"
                            >
                                Попробовать снова
                            </Button>
                        </div>
                    ) : orderDetails ? (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Основная информация</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <span className="font-semibold text-sm text-muted-foreground">ID заказа:</span>
                                            <p className="text-sm mt-1">#{orderDetails.id}</p>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-sm text-muted-foreground">Статус:</span>
                                            <Badge variant="outline" className="ml-2">
                                                {orderDetails.status || 'Не указан'}
                                            </Badge>
                                        </div>
                                        {orderDetails.category && (
                                            <div>
                                                <span className="font-semibold text-sm text-muted-foreground">Категория:</span>
                                                <p className="text-sm mt-1">{orderDetails.category}</p>
                                            </div>
                                        )}
                                        {orderDetails.price && (
                                            <div>
                                                <span className="font-semibold text-sm text-muted-foreground">Стоимость:</span>
                                                <p className="text-sm mt-1 font-semibold text-green-600">{orderDetails.price}₸</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <span className="font-semibold text-sm text-muted-foreground">Название:</span>
                                        <p className="text-sm mt-1 font-medium">{orderDetails.title || 'Не указано'}</p>
                                    </div>
                                    
                                    <div>
                                        <span className="font-semibold text-sm text-muted-foreground">Описание:</span>
                                        <p className="text-sm mt-1 p-3 bg-muted rounded-lg">
                                            {orderDetails.description || 'Описание не указано'}
                                        </p>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <span className="font-semibold text-sm text-muted-foreground">Email клиента:</span>
                                            <p className="text-sm mt-1">{orderDetails.user_email || 'Не указан'}</p>
                                        </div>
                                        {orderDetails.client_name && (
                                            <div>
                                                <span className="font-semibold text-sm text-muted-foreground">Имя клиента:</span>
                                                <p className="text-sm mt-1">{orderDetails.client_name}</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <span className="font-semibold text-sm text-muted-foreground">Номер телефона:</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            {userRole === 'master' ? (
                                                <>
                                                    <PhoneOff className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm text-muted-foreground italic">Скрыто для мастеров</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm">{orderDetails.phone_number || 'Не указан'}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {orderDetails.location && (
                                        <div>
                                            <span className="font-semibold text-sm text-muted-foreground">Местоположение:</span>
                                            <p className="text-sm mt-1">{orderDetails.location}</p>
                                        </div>
                                    )}

                                    {orderDetails.master_assigned && (
                                        <div>
                                            <span className="font-semibold text-sm text-muted-foreground">Назначенный мастер:</span>
                                            <p className="text-sm mt-1">{orderDetails.master_assigned}</p>
                                        </div>
                                    )}
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                                        {orderDetails.created_at && (
                                            <div>
                                                <span className="font-semibold text-sm text-muted-foreground">Дата создания:</span>
                                                <p className="text-sm mt-1">{formatDate(orderDetails.created_at)}</p>
                                            </div>
                                        )}
                                        {orderDetails.updated_at && (
                                            <div>
                                                <span className="font-semibold text-sm text-muted-foreground">Последнее обновление:</span>
                                                <p className="text-sm mt-1">{formatDate(orderDetails.updated_at)}</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default LogsPage;
