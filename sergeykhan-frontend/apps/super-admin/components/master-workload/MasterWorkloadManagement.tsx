"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/ui";
import { Button } from "@workspace/ui/components/ui";
import { Badge } from "@workspace/ui/components/ui";
import { Input } from "@workspace/ui/components/ui";
import { Label } from "@workspace/ui/components/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/ui/components/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/ui";
import { Calendar } from "@workspace/ui/components/ui";
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/ui";
import { 
  Activity, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  AlertCircle, 
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Users,
  BarChart3
} from 'lucide-react';
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import axios from 'axios';
import { API } from '@shared/constants/constants';

interface MasterData {
  master_id: number;
  master_email: string;
  master_name?: string;
  next_available_slot: {
    date: string;
    start_time: string;
    end_time: string;
  } | null;
  total_orders_today: number;
  status: 'available' | 'busy' | 'no_schedule';
}

interface AvailabilitySlot {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  master: number;
  master_email?: string;
}

interface CapacityData {
  today: {
    date: string;
    masters_stats: {
      total_masters: number;
      masters_with_availability: number;
      free_masters: number;
      busy_masters: number;
      masters_without_schedule: number;
    };
    capacity: {
      total_time_slots: number;
      occupied_slots: number;
      available_slots: number;
      capacity_utilization_percent: number;
    };
    masters_details: Array<{
      id: number;
      email: string;
      name: string;
      availability_slots: number;
      assigned_orders: number;
      status: string;
    }>;
  };
  tomorrow: any;
  pending_orders: {
    new_orders: number;
    processing_orders: number;
    total_pending: number;
  };
  recommendations: Array<{
    type: string;
    message: string;
    action: string;
  }>;
}

const MasterWorkloadManagement: React.FC = () => {
  const [mastersData, setMastersData] = useState<MasterData[]>([]);
  const [capacityData, setCapacityData] = useState<CapacityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMaster, setSelectedMaster] = useState<MasterData | null>(null);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Загрузка данных
  const fetchMastersWorkload = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Токен не найден');

      const response = await axios.get(`${API}/api/masters/workload/all/`, {
        headers: { Authorization: `Token ${token}` }
      });
      
      setMastersData(response.data);
    } catch (err) {
      console.error('Ошибка загрузки данных мастеров:', err);
      setError('Не удалось загрузить данные мастеров');
    }
  };

  const fetchCapacityAnalysis = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Токен не найден');

      const response = await axios.get(`${API}/api/capacity/analysis/`, {
        headers: { Authorization: `Token ${token}` }
      });
      
      setCapacityData(response.data);
    } catch (err) {
      console.error('Ошибка загрузки анализа мощности:', err);
    }
  };

  const fetchMasterAvailability = async (masterId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Токен не найден');

      const response = await axios.get(`${API}/api/masters/${masterId}/availability/`, {
        headers: { Authorization: `Token ${token}` }
      });
      
      setAvailabilitySlots(response.data);
    } catch (err) {
      console.error('Ошибка загрузки расписания мастера:', err);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([
      fetchMastersWorkload(),
      fetchCapacityAnalysis()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="default" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700">Доступен</Badge>;
      case 'busy':
        return <Badge variant="destructive" className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700">Занят</Badge>;
      case 'no_schedule':
        return <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700">Нет расписания</Badge>;
      default:
        return <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">Неизвестно</Badge>;
    }
  };

  const OverviewPanel = () => (
    <div className="space-y-6">
      {/* Общая статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border bg-card hover:shadow-lg dark:hover:shadow-2xl transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <div className="text-2xl font-bold text-foreground">{capacityData?.today.masters_stats.total_masters || 0}</div>
                <div className="text-sm text-muted-foreground">Всего мастеров</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border bg-card hover:shadow-lg dark:hover:shadow-2xl transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <div className="text-2xl font-bold text-foreground">{capacityData?.today.masters_stats.free_masters || 0}</div>
                <div className="text-sm text-muted-foreground">Свободные</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border bg-card hover:shadow-lg dark:hover:shadow-2xl transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <div className="text-2xl font-bold text-foreground">{capacityData?.today.masters_stats.busy_masters || 0}</div>
                <div className="text-sm text-muted-foreground">Заняты</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border bg-card hover:shadow-lg dark:hover:shadow-2xl transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <div>
                <div className="text-2xl font-bold text-foreground">{capacityData?.today.capacity.capacity_utilization_percent || 0}%</div>
                <div className="text-sm text-muted-foreground">Загрузка</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ожидающие заказы */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Clock className="h-5 w-5 text-foreground" />
            Ожидающие заказы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{capacityData?.pending_orders.new_orders || 0}</div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Новые</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{capacityData?.pending_orders.processing_orders || 0}</div>
              <div className="text-sm text-orange-700 dark:text-orange-300">В обработке</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{capacityData?.pending_orders.total_pending || 0}</div>
              <div className="text-sm text-purple-700 dark:text-purple-300">Всего</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Рекомендации */}
      {capacityData?.recommendations && capacityData.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Рекомендации по планированию</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {capacityData.recommendations.map((rec, index) => (
                <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="font-medium text-blue-900">{rec.message}</div>
                  {rec.action && (
                    <div className="text-sm text-blue-700 mt-1">{rec.action}</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const MastersListPanel = () => (
    <div className="space-y-4">
      <div className="grid gap-4">
        {mastersData.map((master) => (
          <Card key={master.master_id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="h-8 w-8 text-blue-600" />
                  <div>
                    <div className="font-medium">{master.master_email}</div>
                    <div className="text-sm text-muted-foreground">ID: {master.master_id}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold">{master.total_orders_today}</div>
                    <div className="text-xs text-muted-foreground">Заказы сегодня</div>
                  </div>
                  
                  <div className="text-center">
                    {master.next_available_slot ? (
                      <>
                        <div className="text-sm font-medium">{master.next_available_slot.date}</div>
                        <div className="text-xs text-muted-foreground">
                          {master.next_available_slot.start_time} - {master.next_available_slot.end_time}
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-red-600">Нет слотов</div>
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
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Расписание мастера: {selectedMaster?.master_email}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Заказы сегодня</Label>
                            <div className="text-lg font-bold">{selectedMaster?.total_orders_today}</div>
                          </div>
                          <div>
                            <Label>Статус</Label>
                            <div>{selectedMaster && getStatusBadge(selectedMaster.status)}</div>
                          </div>
                        </div>
                        
                        <div>
                          <Label>Доступные слоты</Label>
                          <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                            {availabilitySlots.map((slot) => (
                              <div key={slot.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span>{slot.date}</span>
                                <span>{slot.start_time} - {slot.end_time}</span>
                              </div>
                            ))}
                            {availabilitySlots.length === 0 && (
                              <div className="text-center text-muted-foreground py-4">
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
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Нагрузка мастеров</h1>
          <p className="text-muted-foreground">Управление расписанием и нагрузкой мастеров</p>
        </div>
        <Button onClick={refreshData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Обновить
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="masters">Мастера</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <OverviewPanel />
        </TabsContent>
        
        <TabsContent value="masters">
          <MastersListPanel />
        </TabsContent>
      </Tabs>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterWorkloadManagement;
