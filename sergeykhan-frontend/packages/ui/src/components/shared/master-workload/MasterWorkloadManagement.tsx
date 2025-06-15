"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/ui";
import { Button } from "@workspace/ui/components/ui";
import { Badge } from "@workspace/ui/components/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/ui/components/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/ui";
import { 
  Activity, 
  Users, 
  Clock, 
  Calendar, 
  User, 
  AlertCircle, 
  CheckCircle,
  RefreshCw,
  BarChart3,
  Eye
} from 'lucide-react';
import axios from 'axios';
import { API } from '@shared/constants/constants';

interface MasterWorkloadData {
  master_id: number;
  master_email: string;
  next_available_slot: {
    date: string;
    start_time: string;
    end_time: string;
  } | null;
  total_orders_today: number;
  status?: 'available' | 'busy' | 'no_schedule';
}

interface CapacityData {
  today: {
    date: string;
    masters_stats: {
      total_masters: number;
      masters_with_availability: number;
      free_masters: number;
      busy_masters: number;
    };
    capacity: {
      available_slots: number;
      occupied_slots: number;
      capacity_utilization_percent: number;
    };
  };
  tomorrow: {
    date: string;
    masters_stats: {
      total_masters: number;
      masters_with_availability: number;
      free_masters: number;
      busy_masters: number;
    };
    capacity: {
      available_slots: number;
      occupied_slots: number;
      capacity_utilization_percent: number;
    };
  };
  pending_orders: {
    new_orders: number;
    processing_orders: number;
    total_pending: number;
  };
  recommendations: Array<{
    type: string;
    message: string;
    action?: string;
  }>;
}

interface AvailabilitySlot {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  master: number;
}

export const MasterWorkloadManagement: React.FC = () => {
  const [mastersData, setMastersData] = useState<MasterWorkloadData[]>([]);
  const [capacityData, setCapacityData] = useState<CapacityData | null>(null);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [selectedMaster, setSelectedMaster] = useState<MasterWorkloadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState("overview");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Токен авторизации не найден');
      }

      const headers = {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      };

      const [workloadResponse, capacityResponse] = await Promise.all([
        axios.get(`${API}/api/masters/workload/all/`, { headers }),
        axios.get(`${API}/api/capacity/analysis/`, { headers })
      ]);

      setMastersData(workloadResponse.data);
      setCapacityData(capacityResponse.data);
    } catch (err) {
      console.error('Ошибка загрузки данных:', err);
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterAvailability = async (masterId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API}/api/masters/${masterId}/availability/`, {
        headers: { Authorization: `Token ${token}` }
      });
      
      setAvailabilitySlots(response.data);
    } catch (err) {
      console.error('Ошибка загрузки расписания мастера:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-100 dark:bg-black text-green-800 dark:text-green-300 border-0 dark:border dark:border-green-800">Доступен</Badge>;
      case 'busy':
        return <Badge variant="destructive">Занят</Badge>;
      case 'no_schedule':
        return <Badge variant="secondary">Нет расписания</Badge>;
      default:
        return <Badge variant="outline">Неизвестно</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 dark:bg-black border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span>Ошибка: {error}</span>
          </div>
        </div>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Попробовать снова
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Activity className="h-8 w-8" />
            Нагрузка мастеров
          </h1>
          <p className="text-muted-foreground mt-1">
            Управление рабочей нагрузкой и планирование заказов
          </p>
        </div>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Обновить
        </Button>
      </div>

      {/* Вкладки */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">📊 Обзор</TabsTrigger>
          <TabsTrigger value="masters">👥 Мастера</TabsTrigger>
          <TabsTrigger value="planning">📅 Планирование</TabsTrigger>
        </TabsList>

        {/* Вкладка: Обзор */}
        <TabsContent value="overview" className="space-y-6">
          {capacityData && (
            <>
              {/* Общая статистика */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {capacityData.today.masters_stats.total_masters}
                        </div>
                        <div className="text-sm text-muted-foreground">Всего мастеров</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {capacityData.today.masters_stats.free_masters}
                        </div>
                        <div className="text-sm text-muted-foreground">Свободные</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {capacityData.today.masters_stats.busy_masters}
                        </div>
                        <div className="text-sm text-muted-foreground">Заняты</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {capacityData.today.capacity.capacity_utilization_percent}%
                        </div>
                        <div className="text-sm text-muted-foreground">Загрузка</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Ожидающие заказы */}
              <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <Clock className="h-5 w-5" />
                    Ожидающие заказы
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 dark:bg-black rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {capacityData.pending_orders.new_orders}
                      </div>
                      <div className="text-sm text-blue-800 dark:text-blue-300">Новые</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 dark:bg-black rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {capacityData.pending_orders.processing_orders}
                      </div>
                      <div className="text-sm text-orange-800 dark:text-orange-300">В обработке</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-black rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {capacityData.pending_orders.total_pending}
                      </div>
                      <div className="text-sm text-purple-800 dark:text-purple-300">Всего</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Рекомендации */}
              {capacityData.recommendations && capacityData.recommendations.length > 0 && (
                <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-gray-100">Рекомендации по планированию</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {capacityData.recommendations.map((rec, index) => (
                        <div 
                          key={index}
                          className={`p-3 rounded-lg border ${
                            rec.type === 'warning' 
                              ? 'bg-yellow-50 dark:bg-black border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300' 
                              : rec.type === 'danger'
                              ? 'bg-red-50 dark:bg-black border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
                              : 'bg-blue-50 dark:bg-black border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300'
                          }`}
                        >
                          <div className="font-medium">{rec.message}</div>
                          {rec.action && (
                            <div className="text-sm mt-1 opacity-80">{rec.action}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Вкладка: Мастера */}
        <TabsContent value="masters" className="space-y-6">
          <div className="grid gap-4">
            {mastersData.map((master) => (
              <Card key={master.master_id} className="bg-white dark:bg-black border-gray-200 dark:border-gray-700 hover:shadow-md dark:hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-blue-100 dark:bg-black rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">{master.master_email}</div>
                        <div className="text-sm text-muted-foreground">ID: {master.master_id}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">
                          {master.total_orders_today}
                        </div>
                        <div className="text-xs text-muted-foreground">Заказов сегодня</div>
                      </div>
                      <div className="text-center">
                        {master.next_available_slot ? (
                          <div>
                            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              {master.next_available_slot.date}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {master.next_available_slot.start_time} - {master.next_available_slot.end_time}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="secondary">Нет свободных слотов</Badge>
                        )}
                      </div>
                      {getStatusBadge(master.status)}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedMaster(master);
                              fetchMasterAvailability(master.master_id);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Детали
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl bg-white dark:bg-black border-gray-200 dark:border-gray-700">
                          <DialogHeader>
                            <DialogTitle className="text-gray-900 dark:text-gray-100">
                              Расписание мастера: {selectedMaster?.master_email}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-sm font-medium text-muted-foreground">Заказы сегодня</div>
                                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                  {selectedMaster?.total_orders_today}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-muted-foreground">Статус</div>
                                <div>{selectedMaster && getStatusBadge(selectedMaster.status)}</div>
                              </div>
                            </div>
                            
                            <div>
                              <div className="text-sm font-medium text-muted-foreground mb-2">Доступные слоты</div>
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {availabilitySlots.map((slot) => (
                                  <div 
                                    key={slot.id} 
                                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-black rounded border border-gray-200 dark:border-gray-600"
                                  >
                                    <span className="text-gray-900 dark:text-gray-100">{slot.date}</span>
                                    <span className="text-gray-700 dark:text-gray-300">
                                      {slot.start_time} - {slot.end_time}
                                    </span>
                                  </div>
                                ))}
                                {availabilitySlots.length === 0 && (
                                  <div className="text-center py-4 text-muted-foreground">
                                    Нет доступных слотов
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Вкладка: Планирование */}
        <TabsContent value="planning" className="space-y-6">
          <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Calendar className="h-5 w-5" />
                Планирование расписания
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Функционал планирования расписания будет доступен в следующих обновлениях</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
