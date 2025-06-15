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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/ui";
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
  BarChart3,
  Settings
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
  const [isCreateSlotOpen, setIsCreateSlotOpen] = useState(false);
  const [newSlot, setNewSlot] = useState({
    date: '',
    start_time: '',
    end_time: '',
    master: ''
  });

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

  const createAvailabilitySlot = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Токен не найден');

      await axios.post(`${API}/api/masters/${newSlot.master}/availability/`, {
        date: newSlot.date,
        start_time: newSlot.start_time,
        end_time: newSlot.end_time
      }, {
        headers: { Authorization: `Token ${token}` }
      });
      
      setIsCreateSlotOpen(false);
      setNewSlot({ date: '', start_time: '', end_time: '', master: '' });
      if (selectedMaster) {
        fetchMasterAvailability(selectedMaster.master_id);
      }
      refreshData();
    } catch (err) {
      console.error('Ошибка создания слота:', err);
    }
  };

  const deleteAvailabilitySlot = async (masterId: number, slotId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Токен не найден');

      await axios.delete(`${API}/api/masters/${masterId}/availability/${slotId}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      
      if (selectedMaster) {
        fetchMasterAvailability(selectedMaster.master_id);
      }
      refreshData();
    } catch (err) {
      console.error('Ошибка удаления слота:', err);
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
        return <Badge variant="default" className="bg-green-100 text-green-800">Доступен</Badge>;
      case 'busy':
        return <Badge variant="destructive">Занят</Badge>;
      case 'no_schedule':
        return <Badge variant="secondary">Нет расписания</Badge>;
      default:
        return <Badge variant="outline">Неизвестно</Badge>;
    }
  };

  const OverviewPanel = () => (
    <div className="space-y-6">
      {/* Общая статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{capacityData?.today.masters_stats.total_masters || 0}</div>
                <div className="text-sm text-muted-foreground">Всего мастеров</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{capacityData?.today.masters_stats.free_masters || 0}</div>
                <div className="text-sm text-muted-foreground">Свободные</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold">{capacityData?.today.masters_stats.busy_masters || 0}</div>
                <div className="text-sm text-muted-foreground">Заняты</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{capacityData?.today.capacity.capacity_utilization_percent || 0}%</div>
                <div className="text-sm text-muted-foreground">Загрузка</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ожидающие заказы */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Ожидающие заказы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{capacityData?.pending_orders.new_orders || 0}</div>
              <div className="text-sm text-muted-foreground">Новые</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{capacityData?.pending_orders.processing_orders || 0}</div>
              <div className="text-sm text-muted-foreground">В обработке</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{capacityData?.pending_orders.total_pending || 0}</div>
              <div className="text-sm text-muted-foreground">Всего</div>
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
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Список мастеров</h3>
        <Dialog open={isCreateSlotOpen} onOpenChange={setIsCreateSlotOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Добавить слот
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать новый слот</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Мастер</Label>
                <Select value={newSlot.master} onValueChange={(value) => setNewSlot({...newSlot, master: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите мастера" />
                  </SelectTrigger>
                  <SelectContent>
                    {mastersData.map((master) => (
                      <SelectItem key={master.master_id} value={master.master_id.toString()}>
                        {master.master_email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Дата</Label>
                <Input 
                  type="date" 
                  value={newSlot.date}
                  onChange={(e) => setNewSlot({...newSlot, date: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Время начала</Label>
                  <Input 
                    type="time" 
                    value={newSlot.start_time}
                    onChange={(e) => setNewSlot({...newSlot, start_time: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Время окончания</Label>
                  <Input 
                    type="time" 
                    value={newSlot.end_time}
                    onChange={(e) => setNewSlot({...newSlot, end_time: e.target.value})}
                  />
                </div>
              </div>
              <Button onClick={createAvailabilitySlot} className="w-full">
                Создать слот
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
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
                        <Settings className="h-4 w-4 mr-2" />
                        Управление
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Управление расписанием: {selectedMaster?.master_email}</DialogTitle>
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
                          <div className="flex justify-between items-center mb-2">
                            <Label>Доступные слоты</Label>
                            <Button 
                              size="sm"
                              onClick={() => {
                                setNewSlot({...newSlot, master: selectedMaster?.master_id.toString() || ''});
                                setIsCreateSlotOpen(true);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Добавить
                            </Button>
                          </div>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {availabilitySlots.map((slot) => (
                              <div key={slot.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                                <div>
                                  <div className="font-medium">{slot.date}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {slot.start_time} - {slot.end_time}
                                  </div>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => deleteAvailabilitySlot(selectedMaster!.master_id, slot.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
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
          <TabsTrigger value="masters">Управление мастерами</TabsTrigger>
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
