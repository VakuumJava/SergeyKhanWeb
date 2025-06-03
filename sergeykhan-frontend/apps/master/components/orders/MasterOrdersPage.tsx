"use client"

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Eye } from "lucide-react";
import { useDistanceApi } from "@/hooks/useDistanceApi";
interface Order {
  id: number;
  client_name: string;
  client_phone: string;
  description: string;
  address?: string;
  // New address fields from backend
  street?: string;
  house_number?: string;
  apartment?: string;
  entrance?: string;
  public_address?: string;  // Street + house number only (for masters before taking)
  full_address?: string;    // Complete address including apartment/entrance (for taken orders)
  status: string;
  final_cost?: string;  // Changed from number to string to match backend
  created_at: string;
  assigned_master?: string | null;
}

interface MasterDistanceInfo {
  distance_info: {
    distance_level: number;
    distance_level_name: string;
    visibility_hours: number;
  };
  orders: Order[];
  total_orders: number;
}

const MasterOrdersPage = () => {
    const router = useRouter();
    const [distanceData, setDistanceData] = useState<MasterDistanceInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [takingOrderId, setTakingOrderId] = useState<number | null>(null);

    const { 
        loading, 
        error, 
        fetchMasterDistanceWithOrders,
        takeOrder
    } = useDistanceApi();

    const getDisplayAddress = (order: Order): string => {
        // For available orders, show only public address (street + house number)
        if (order.public_address) {
            return order.public_address;
        }
        // Fallback to original address if public_address not available
        return order.address || 'Не указан';
    };

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

    const getVisibilityDescription = (hours: number) => {
        if (hours === 24) return "Стандартная видимость: 24 часа";
        if (hours === 28) return "Обычная дистанционка: +4 часа (28 часов всего)";
        if (hours === 48) return "Суточная дистанционка: +24 часа (48 часов всего)";
        return `Видимость: ${hours} часов`;
    };

    if (isLoading || loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="text-muted-foreground">Загрузка заказов...</p>
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
                            <p>Нет данных о заказах</p>
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
                    Доступные заказы
                </h1>
                <p className="text-muted-foreground mt-2">
                    {getVisibilityDescription(distanceData.distance_info.visibility_hours)}
                </p>
            </div>

            {/* Доступные заказы */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>
                                Заказы ({distanceData.total_orders})
                            </CardTitle>
                            <CardDescription>
                                Заказы за последние {distanceData.distance_info.visibility_hours} часов
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-3">
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
                                                <p className="font-medium">{getDisplayAddress(order)}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Описание</p>
                                                <p className="font-medium">{order.description}</p>
                                            </div>

                                            {order.final_cost && (
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground">Стоимость</p>
                                                    <p className="text-lg font-semibold text-green-600">
                                                        {formatCurrency(parseFloat(order.final_cost))}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between pt-2 gap-2">
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
                                                <div className="flex gap-2">
                                                    <Button 
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => router.push(`/orders/${order.id}`)}
                                                    >
                                                        <Eye className="w-3 h-3 mr-1" />
                                                        Подробнее
                                                    </Button>
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
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default MasterOrdersPage;
