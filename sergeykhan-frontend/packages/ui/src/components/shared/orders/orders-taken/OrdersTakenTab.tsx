"use client"

import React, { useState, useEffect } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge
} from '@workspace/ui/components/ui'
import { OrdersTakenDataTable } from './OrdersTakenTable'
import { Clock, CheckCircle2 } from "lucide-react"
import { columns } from "@shared/constants/orders"
import { api } from "@shared/utils/api"
import { API } from "@shared/constants/constants"

type OrdersTakenTypeT = 'all' | 'completed' | 'in-progress'
type UserStatusT = 'curator' | 'master' | 'operator'
type AccessStatusT = 'pro' | 'max' | 'none'

interface OrdersTakenTabProps {
    status: UserStatusT
    accessStatus?: AccessStatusT
}

const OrdersTakenTab: React.FC<OrdersTakenTabProps> = ({ status, accessStatus = 'none' }) => {
    const [ordersData, setOrdersData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [ordersType, setOrdersType] = useState<OrdersTakenTypeT>('all')

    useEffect(() => {
        const fetchAssigned = async () => {
            try {
                const userId = localStorage.getItem('user_id');
                const token = localStorage.getItem('token');
                if (!userId) {
                    throw new Error('User ID not found in localStorage');
                }
                
                const { data } = await api.get(`${API}/orders/master/${userId}/`,
                    { headers: { Authorization: `Token ${token}` } }
                );
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

    if (!accessStatus || accessStatus === 'none') {
        return <div className="container mx-auto p-6">
            <Card className="border-destructive">
                <CardContent className="pt-6">
                    <div className="text-center">
                        <h1 className="text-xl font-medium">
                            У вас нет доступа к этой странице
                        </h1>
                    </div>
                </CardContent>
            </Card>
        </div>
    }

    const availableTabs: OrdersTakenTypeT[] = ['all', 'in-progress', 'completed']
    const handleClick = (type: OrdersTakenTypeT) => setOrdersType(type)

    const getFilteredData = () => {
        console.log('All orders data:', ordersData); // Для отладки
        console.log('Current filter:', ordersType); // Для отладки
        
        switch (ordersType) {
            case 'in-progress':
                // Заказы в работе - все кроме завершенных
                return ordersData.filter(order => {
                    const status = order.status?.toLowerCase();
                    return status !== 'завершен' && 
                           status !== 'завершено' && 
                           status !== 'completed' &&
                           status !== 'проверен' &&
                           status !== 'одобрен';
                });
            case 'completed':
                // Завершенные заказы
                return ordersData.filter(order => {
                    const status = order.status?.toLowerCase();
                    return status === 'завершен' || 
                           status === 'завершено' || 
                           status === 'completed' ||
                           status === 'проверен' ||
                           status === 'одобрен';
                });
            case 'all':
            default:
                return ordersData;
        }
    }

    const renderContent = () => {
        if (loading) {
            return <div className="p-4 text-center">Загрузка заказов...</div>;
        }
        
        if (error) {
            return <div className="p-4 text-center text-red-500">Ошибка: {error}</div>;
        }

        const filteredData = getFilteredData();

        if (!filteredData.length) {
            return <div className="p-4 text-center text-muted-foreground">Нет заказов</div>;
        }

        return <OrdersTakenDataTable data={filteredData} columns={columns} />
    }

    const getTabTitle = () => {
        const count = getFilteredData().length;
        switch (ordersType) {
            case 'all': return `Все взятые заказы (${count})`;
            case 'in-progress': return `Заказы в работе (${count})`;
            case 'completed': return `Завершенные заказы (${count})`;
            default: return "Взятые заказы";
        }
    }

    const getTabDescription = () => {
        switch (ordersType) {
            case 'all': return "Все заказы, которые вы взяли в работу";
            case 'in-progress': return "Заказы, которые находятся в процессе выполнения";
            case 'completed': return "Заказы, которые вы успешно завершили";
            default: return "";
        }
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {getTabTitle()}
                    </h1>
                    <p className="text-muted-foreground">
                        {getTabDescription()}
                    </p>
                </div>
                <Badge variant="secondary" className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    {status === 'curator' ? 'Куратор' : status === 'master' ? 'Мастер' : 'Оператор'}
                </Badge>
            </div>

            {/* Tabs */}
            <div className="flex flex-row gap-3">
                {availableTabs.map((tab) => (
                    <Button
                        key={tab}
                        variant={ordersType === tab ? "default" : "outline"}
                        onClick={() => handleClick(tab)}
                        className="flex items-center gap-2"
                    >
                        {tab === 'all' && <Clock className="w-4 h-4" />}
                        {tab === 'in-progress' && <Clock className="w-4 h-4" />}
                        {tab === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                        {tab === 'all' ? 'Все' : 
                         tab === 'in-progress' ? 'В работе' :
                         'Завершенные'}
                    </Button>
                ))}
            </div>

            {/* Content */}
            <Card>
                <CardHeader>
                    <CardTitle>{getTabTitle()}</CardTitle>
                </CardHeader>
                <CardContent>
                    {renderContent()}
                </CardContent>
            </Card>
        </div>
    )
}

export default OrdersTakenTab
