"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/ui";
import { Button } from "@workspace/ui/components/ui";
import { Badge } from "@workspace/ui/components/ui";
import { 
  Users, 
  RefreshCw, 
  AlertCircle, 
  Clock,
  CheckCircle,
  Calendar
} from 'lucide-react';

interface CapacityData {
  today: {
    date: string;
    date_display: string;
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
      theoretical_max_capacity: number;
      realistic_capacity: number;
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
  analysis_timestamp: string;
}

interface MasterWorkloadData {
  master_id: number;
  master_email: string;
  next_available_slot: {
    date: string;
    start_time: string;
    end_time: string;
  } | null;
  total_orders_today: number;
  status: 'available' | 'busy' | 'no_schedule';
}

const CapacityAnalysisComponent: React.FC = () => {
  const [capacityData, setCapacityData] = useState<CapacityData | null>(null);
  const [mastersData, setMastersData] = useState<MasterWorkloadData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCapacityData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Токен авторизации не найден');
      }

      const response = await fetch('http://127.0.0.1:8000/api/capacity/analysis/', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }

      const data = await response.json();
      setCapacityData(data);
    } catch (err) {
      console.error('Ошибка загрузки данных планирования:', err);
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  const fetchMastersWorkload = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://127.0.0.1:8000/api/masters/workload/all/', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMastersData(data);
      }
    } catch (err) {
      console.error('Ошибка загрузки данных мастеров:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchCapacityData(), fetchMastersWorkload()]);
    };
    loadData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="default" className="bg-green-100 dark:bg-black text-green-800 dark:text-green-400">Доступен</Badge>;
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Планирование заказов
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Планирование заказов
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 dark:bg-black border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
          <Button onClick={fetchCapacityData} className="w-full" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Попробовать снова
          </Button>
        </CardContent>
      </Card>
    );
  }

  const today = capacityData?.today;
  const tomorrow = capacityData?.tomorrow;
  const pending = capacityData?.pending_orders;
  const recommendations = capacityData?.recommendations || [];

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Планирование заказов
            <Button 
              onClick={fetchCapacityData}
              size="sm"
              variant="ghost"
              className="ml-auto"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Ожидающие заказы */}
          <div className="bg-blue-50 dark:bg-black border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-blue-900 dark:text-blue-100">Ожидающие заказы</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-300">
              <div>Новые: {pending?.new_orders || 0}</div>
              <div>В обработке: {pending?.processing_orders || 0}</div>
            </div>
            <div className="font-bold text-blue-900 dark:text-blue-100 mt-1">
              Всего: {pending?.total_pending || 0} заказов
            </div>
          </div>

          {/* Пропускная способность на сегодня и завтра */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 dark:bg-black border border-green-200 dark:border-green-800 rounded-lg p-3">
              <div className="font-medium text-green-900 dark:text-green-100 mb-1">Сегодня</div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                {today?.capacity?.available_slots || 0}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">свободных слотов</div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                Работает: {today?.masters_stats?.masters_with_availability || 0} мастеров
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-black border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="font-medium text-blue-900 dark:text-blue-100 mb-1">Завтра</div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                {tomorrow?.capacity?.available_slots || 0}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">свободных слотов</div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Работает: {tomorrow?.masters_stats?.masters_with_availability || 0} мастеров
              </div>
            </div>
          </div>

          {/* Рекомендации */}
          {recommendations.length > 0 && (
            <div className="space-y-2">
              <div className="font-medium text-gray-900 dark:text-gray-100 mb-2">Рекомендации:</div>
              {recommendations.map((rec: any, index: number) => (
                <div 
                  key={index} 
                  className="p-2 bg-amber-50 dark:bg-black border border-amber-200 dark:border-amber-800 rounded text-sm"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-3 w-3 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <span className="text-amber-800 dark:text-amber-200">{rec.message}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Статус мастеров */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Статус мастеров
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mastersData.slice(0, 8).map((master) => (
              <div key={master.master_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-black border-0 dark:border dark:border-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-black border-0 dark:border dark:border-blue-800 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      {master.master_email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">{master.master_email}</div>
                    <div className="text-xs text-muted-foreground">
                      Заказы сегодня: {master.total_orders_today}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {master.next_available_slot ? (
                    <div className="text-right">
                      <div className="text-xs font-medium">{master.next_available_slot.date}</div>
                      <div className="text-xs text-muted-foreground">
                        {master.next_available_slot.start_time}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-red-600">Нет слотов</div>
                  )}
                  {getStatusBadge(master.status)}
                </div>
              </div>
            ))}
            
            {mastersData.length > 8 && (
              <div className="text-center pt-2">
                <span className="text-sm text-muted-foreground">
                  И еще {mastersData.length - 8} мастеров...
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CapacityAnalysisComponent;
