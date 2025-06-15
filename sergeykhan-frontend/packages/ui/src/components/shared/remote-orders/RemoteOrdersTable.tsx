"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/ui";
import { Button } from "@workspace/ui/components/ui";
import { Badge } from "@workspace/ui/components/ui";
import { 
  MapPin, 
  Clock, 
  Package,
  CheckCircle,
  RefreshCw,
  Eye
} from 'lucide-react';

interface RemoteOrder {
  id: number;
  address: string;
  description: string;
  estimated_duration: number;
  price: number;
  status: 'available' | 'taken' | 'completed';
  distance?: number;
  created_at: string;
  client_phone?: string;
}

interface RemoteOrdersProps {
  userRole: 'master';
}

const RemoteOrdersTable: React.FC<RemoteOrdersProps> = ({ userRole }) => {
  const [orders, setOrders] = useState<RemoteOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [takingOrder, setTakingOrder] = useState<number | null>(null);

  const fetchRemoteOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/master/remote-orders/', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки дистанционных заказов:', error);
    }
    setLoading(false);
  };

  const takeOrder = async (orderId: number) => {
    setTakingOrder(orderId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/master/remote-orders/${orderId}/take/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('Заказ успешно взят!');
        fetchRemoteOrders(); // Обновляем список
      } else {
        const error = await response.json();
        alert(`Ошибка: ${error.message || 'Не удалось взять заказ'}`);
      }
    } catch (error) {
      console.error('Ошибка взятия заказа:', error);
      alert('Ошибка взятия заказа');
    }
    setTakingOrder(null);
  };

  useEffect(() => {
    fetchRemoteOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-100 dark:bg-black text-green-800 dark:text-green-300 border-0 dark:border dark:border-green-800">Доступен</Badge>;
      case 'taken':
        return <Badge className="bg-blue-100 dark:bg-black text-blue-800 dark:text-blue-300 border-0 dark:border dark:border-blue-800">Взят</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 dark:bg-black text-gray-800 dark:text-gray-300 border-0 dark:border dark:border-gray-800">Завершен</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-700">
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="ml-2">Загрузка дистанционных заказов...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Дистанционные заказы
          <Button
            onClick={fetchRemoteOrders}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Нет доступных дистанционных заказов</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left p-3 font-medium">Адрес</th>
                  <th className="text-left p-3 font-medium">Описание</th>
                  <th className="text-center p-3 font-medium">Время</th>
                  <th className="text-center p-3 font-medium">Цена</th>
                  <th className="text-center p-3 font-medium">Расстояние</th>
                  <th className="text-center p-3 font-medium">Статус</th>
                  <th className="text-center p-3 font-medium">Действие</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{order.address}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="max-w-xs truncate" title={order.description}>
                        {order.description}
                      </div>
                    </td>
                    <td className="text-center p-3">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{order.estimated_duration}ч</span>
                      </div>
                    </td>
                    <td className="text-center p-3 font-medium">
                      {order.price.toLocaleString()} ₸
                    </td>
                    <td className="text-center p-3">
                      {order.distance ? `${order.distance} км` : 'N/A'}
                    </td>
                    <td className="text-center p-3">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="text-center p-3">
                      {order.status === 'available' ? (
                        <Button
                          onClick={() => takeOrder(order.id)}
                          disabled={takingOrder === order.id}
                          size="sm"
                        >
                          {takingOrder === order.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Взять
                            </>
                          )}
                        </Button>
                      ) : order.status === 'taken' ? (
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Детали
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RemoteOrdersTable;
