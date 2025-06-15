"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/ui";
import { Button } from "@workspace/ui/components/ui";
import { Badge } from "@workspace/ui/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/ui/components/ui";
import { 
  Users, 
  Clock, 
  Package,
  CheckCircle,
  RefreshCw,
  AlertTriangle,
  Calendar
} from 'lucide-react';

interface Master {
  id: number;
  email: string;
  name: string;
  available_slots_today: number;
  assigned_orders_today: number;
  capacity_percentage: number;
}

interface PendingOrder {
  id: number;
  address: string;
  description: string;
  estimated_duration: number;
  price: number;
  client_phone: string;
  created_at: string;
  preferred_date?: string;
}

interface OrderDistributionProps {
  userRole: 'curator' | 'super-admin';
}

const OrderDistributionTable: React.FC<OrderDistributionProps> = ({ userRole }) => {
  const [masters, setMasters] = useState<Master[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<number | null>(null);
  const [selectedMaster, setSelectedMaster] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Получаем данные мастеров
      const mastersResponse = await fetch('http://127.0.0.1:8000/api/masters/workload/', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Получаем ожидающие заказы
      const ordersResponse = await fetch('http://127.0.0.1:8000/api/orders/pending/', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (mastersResponse.ok) {
        const mastersData = await mastersResponse.json();
        setMasters(mastersData.masters || []);
      }

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setPendingOrders(ordersData.orders || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }
    setLoading(false);
  };

  const assignOrder = async (orderId: number, masterId: number) => {
    setAssigning(orderId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/orders/${orderId}/assign/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ master_id: masterId })
      });

      if (response.ok) {
        alert('Заказ успешно назначен мастеру!');
        fetchData(); // Обновляем данные
        setIsDialogOpen(false);
      } else {
        const error = await response.json();
        alert(`Ошибка: ${error.message || 'Не удалось назначить заказ'}`);
      }
    } catch (error) {
      console.error('Ошибка назначения заказа:', error);
      alert('Ошибка назначения заказа');
    }
    setAssigning(null);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getCapacityBadge = (percentage: number) => {
    if (percentage >= 90) {
      return <Badge className="bg-red-100 dark:bg-black text-red-800 dark:text-red-300 border-0 dark:border dark:border-red-800">Перегружен</Badge>;
    } else if (percentage >= 70) {
      return <Badge className="bg-yellow-100 dark:bg-black text-yellow-800 dark:text-yellow-300 border-0 dark:border dark:border-yellow-800">Загружен</Badge>;
    } else {
      return <Badge className="bg-green-100 dark:bg-black text-green-800 dark:text-green-300 border-0 dark:border dark:border-green-800">Доступен</Badge>;
    }
  };

  const openAssignDialog = (order: PendingOrder) => {
    setSelectedOrder(order);
    setSelectedMaster(null);
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-700">
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="ml-2">Загрузка данных...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Загрузка мастеров */}
      <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Загрузка мастеров на сегодня
            <Button
              onClick={fetchData}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left p-3 font-medium">Мастер</th>
                  <th className="text-center p-3 font-medium">Свободные слоты</th>
                  <th className="text-center p-3 font-medium">Назначено заказов</th>
                  <th className="text-center p-3 font-medium">Загрузка</th>
                  <th className="text-center p-3 font-medium">Статус</th>
                </tr>
              </thead>
              <tbody>
                {masters.map((master) => (
                  <tr key={master.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="p-3">
                      <div className="font-medium">{master.name || master.email}</div>
                      <div className="text-sm text-muted-foreground">{master.email}</div>
                    </td>
                    <td className="text-center p-3">
                      <Badge variant="outline">
                        {master.available_slots_today}
                      </Badge>
                    </td>
                    <td className="text-center p-3">
                      <Badge variant="outline">
                        {master.assigned_orders_today}
                      </Badge>
                    </td>
                    <td className="text-center p-3">
                      <div className="text-sm font-medium">
                        {master.capacity_percentage}%
                      </div>
                    </td>
                    <td className="text-center p-3">
                      {getCapacityBadge(master.capacity_percentage)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Ожидающие заказы */}
      <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Ожидающие распределения заказы
            <Badge variant="secondary">{pendingOrders.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingOrders.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Нет ожидающих заказов</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left p-3 font-medium">ID</th>
                    <th className="text-left p-3 font-medium">Адрес</th>
                    <th className="text-left p-3 font-medium">Описание</th>
                    <th className="text-center p-3 font-medium">Время</th>
                    <th className="text-center p-3 font-medium">Цена</th>
                    <th className="text-center p-3 font-medium">Дата создания</th>
                    <th className="text-center p-3 font-medium">Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOrders.map((order) => (
                    <tr key={order.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900">
                      <td className="p-3 font-medium">#{order.id}</td>
                      <td className="p-3">{order.address}</td>
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
                      <td className="text-center p-3 text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="text-center p-3">
                        <Button
                          onClick={() => openAssignDialog(order)}
                          size="sm"
                        >
                          <Users className="h-4 w-4 mr-1" />
                          Назначить
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Диалог назначения заказа */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-black border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle>Назначить заказ #{selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-700 rounded">
              <div className="text-sm text-muted-foreground">Адрес:</div>
              <div className="font-medium">{selectedOrder?.address}</div>
              <div className="text-sm text-muted-foreground mt-2">Время работы:</div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {selectedOrder?.estimated_duration}ч
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Выберите мастера:</label>
              <Select value={selectedMaster?.toString()} onValueChange={(value) => setSelectedMaster(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите мастера" />
                </SelectTrigger>
                <SelectContent>
                  {masters
                    .filter(master => master.capacity_percentage < 90) // Исключаем перегруженных
                    .map((master) => (
                      <SelectItem key={master.id} value={master.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span>{master.name || master.email}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {master.available_slots_today} слотов, {master.capacity_percentage}%
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {masters.filter(m => m.capacity_percentage < 90).length === 0 && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-black border border-red-200 dark:border-red-800 rounded">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-800 dark:text-red-300">
                  Все мастера перегружены! Заказ можно назначить принудительно.
                </span>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => selectedMaster && selectedOrder && assignOrder(selectedOrder.id, selectedMaster)}
                disabled={!selectedMaster || assigning === selectedOrder?.id}
                className="flex-1"
              >
                {assigning === selectedOrder?.id ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Назначить
              </Button>
              <Button
                onClick={() => setIsDialogOpen(false)}
                variant="outline"
              >
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderDistributionTable;
