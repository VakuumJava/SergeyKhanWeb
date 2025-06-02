"use client"

import React, { useState, useEffect } from "react";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { useDistanceApi } from "@/hooks/useDistanceApi";

interface Order {
  id: number;
  client_name: string;
  client_phone: string;
  description: string;
  address?: string;
  status: string;
  final_cost?: number;
  created_at: string;
}

interface MasterDistanceInfo {
  distance_info: {
    distance_level: number;
    distance_level_name: string;
    visibility_hours: number;
    statistics: {
      average_check: number;
      daily_revenue: number;
      net_turnover_10_days: number;
    };
    thresholds: {
      average_check_threshold: number;
      daily_revenue_threshold: number;
      net_turnover_threshold: number;
    };
    meets_requirements: {
      level_1: boolean;
      level_2: boolean;
    };
  };
  orders: Order[];
  total_orders: number;
}

const MasterDistancePage = () => {
    const [distanceData, setDistanceData] = useState<MasterDistanceInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [takingOrderId, setTakingOrderId] = useState<number | null>(null);

    const { 
        loading, 
        error, 
        fetchMasterDistanceWithOrders,
        takeOrder
    } = useDistanceApi();

    useEffect(() => {
        loadDistanceData();
    }, []);

    const loadDistanceData = async () => {
        setIsLoading(true);
        const data = await fetchMasterDistanceWithOrders();
        if (data) {
            setDistanceData(data);
        }
        setIsLoading(false);
    };

    const handleTakeOrder = async (orderId: number) => {
        setTakingOrderId(orderId);
        const success = await takeOrder(orderId);
        if (success) {
            await loadDistanceData();
        }
        setTakingOrderId(null);
    };

    const getDistanceColor = (level: number) => {
        switch (level) {
            case 0: return "bg-gray-100 text-gray-800";
            case 1: return "bg-blue-100 text-blue-800";
            case 2: return "bg-green-100 text-green-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const getVisibilityDescription = (hours: number) => {
        if (hours === 24) return "Стандартная видимость: 24 часа";
        if (hours === 28) return "Обычная дистанционка: +4 часа (28 часов всего)";
        if (hours === 48) return "Суточная дистанционка: +24 часа (48 часов всего)";
        return `Видимость: ${hours} часов`;
    };

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('ru-RU') + '₸';
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

    if (isLoading || loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="text-muted-foreground">Загрузка данных о дистанционке...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-6">
                <Card className="border-destructive">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-destructive">
                            <span>⚠️</span>
                            <span>Ошибка: {error}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!distanceData) {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center text-muted-foreground">
                            <p>Нет данных о дистанционке</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold tracking-tight">
                    Дистанционка мастера
                </h1>
                <p className="text-muted-foreground mt-2">
                    Ваш текущий статус и доступные заказы
                </p>
            </div>

            {/* Информация о дистанционке */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Ваш статус дистанционки</CardTitle>
                            <CardDescription>
                                {getVisibilityDescription(distanceData.distance_info.visibility_hours)}
                            </CardDescription>
                        </div>
                        <Badge 
                            variant={
                                distanceData.distance_info.distance_level === 2 ? "default" : 
                                distanceData.distance_info.distance_level === 1 ? "secondary" : 
                                "outline"
                            }
                            className={`text-sm ${
                                distanceData.distance_info.distance_level === 2 ? "bg-green-600 hover:bg-green-700" :
                                distanceData.distance_info.distance_level === 1 ? "bg-blue-600 hover:bg-blue-700 text-white" :
                                "text-muted-foreground"
                            }`}
                        >
                            {distanceData.distance_info.distance_level_name}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Статистика */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="pt-4">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground">Средний чек</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-2xl font-bold">
                                            {formatCurrency(distanceData.distance_info.statistics.average_check)}
                                        </p>
                                        {distanceData.distance_info.meets_requirements.level_1 && (
                                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                                ✓
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Требуется: {formatCurrency(distanceData.distance_info.thresholds.average_check_threshold)}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-4">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground">Выручка за сутки</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-2xl font-bold">
                                            {formatCurrency(distanceData.distance_info.statistics.daily_revenue)}
                                        </p>
                                        {distanceData.distance_info.meets_requirements.level_2 && (
                                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                                ✓
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Требуется: {formatCurrency(distanceData.distance_info.thresholds.daily_revenue_threshold)}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-4">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground">Чистый вал (10 дней)</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-2xl font-bold">
                                            {formatCurrency(distanceData.distance_info.statistics.net_turnover_10_days)}
                                        </p>
                                        {distanceData.distance_info.meets_requirements.level_2 && (
                                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                                ✓
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Требуется: {formatCurrency(distanceData.distance_info.thresholds.net_turnover_threshold)}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </CardContent>
            </Card>

            {/* Доступные заказы */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>
                                Доступные заказы ({distanceData.total_orders})
                            </CardTitle>
                            <CardDescription>
                                Заказы, видимые с учетом вашего уровня дистанционки
                            </CardDescription>
                        </div>
                        <Button 
                            onClick={loadDistanceData}
                            disabled={loading}
                            variant="outline"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    Обновление...
                                </div>
                            ) : (
                                "Обновить"
                            )}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {distanceData.orders.length === 0 ? (
                            <div className="text-center py-8 space-y-2">
                                <p className="text-muted-foreground">Нет доступных заказов</p>
                                <p className="text-sm text-muted-foreground">
                                    Заказы появятся в зависимости от вашего уровня дистанционки
                                </p>
                            </div>
                        ) : (
                            distanceData.orders.map((order) => (
                                <Card key={order.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="pt-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="font-semibold text-lg">
                                                Заказ #{order.id}
                                            </h3>
                                            <span className="text-sm text-muted-foreground">
                                                {formatDate(order.created_at)}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-muted-foreground">Клиент</p>
                                                <p className="font-medium">{order.client_name}</p>
                                                <p className="text-sm text-muted-foreground">{order.client_phone}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-muted-foreground">Адрес</p>
                                                <p className="font-medium">{order.address || 'Не указан'}</p>
                                            </div>
                                        </div>                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Описание</p>
                                                <p className="font-medium">{order.description}</p>
                                            </div>

                                            {order.final_cost && (
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground">Стоимость</p>
                                                    <p className="text-lg font-semibold text-green-600">
                                                        {formatCurrency(order.final_cost)}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between pt-2">
                                                <Badge 
                                                    variant={
                                                        order.status === 'новый' ? 'default' : 
                                                        order.status === 'в обработке' ? 'secondary' : 
                                                        'outline'
                                                    }
                                                    className={
                                                        order.status === 'новый' ? 'bg-blue-600 hover:bg-blue-700' : 
                                                        order.status === 'в обработке' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 
                                                        'text-muted-foreground'
                                                    }
                                                >
                                                    {order.status}
                                                </Badge>
                                                <Button 
                                                    size="sm"
                                                    disabled={takingOrderId === order.id || loading}
                                                    onClick={() => handleTakeOrder(order.id)}
                                                >
                                                    {takingOrderId === order.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                                                            Обработка...
                                                        </div>
                                                    ) : (
                                                        "Взять заказ"
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Справочная информация */}
            <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                    <CardTitle className="text-blue-900">Как получить дистанционку?</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-sm text-blue-800">
                        <div className="flex items-start gap-2">
                            <span className="font-medium">•</span>
                            <div>
                                <span className="font-semibold">Обычная дистанционка (+4 часа):</span> 
                                <span className="ml-1">Средний чек за последние 10 заказов ≥ 65,000₸</span>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="font-medium">•</span>
                            <div>
                                <span className="font-semibold">Суточная дистанционка (+24 часа):</span> 
                                <span className="ml-1">Заказы в сутки ≥ 350,000₸ ИЛИ чистый вал за 10 дней ≥ 1,500,000₸</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default MasterDistancePage;
