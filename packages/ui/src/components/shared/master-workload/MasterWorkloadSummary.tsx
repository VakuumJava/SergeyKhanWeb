import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  RefreshCw
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
}

interface MasterWorkloadSummaryProps {
  className?: string;
}

const MasterWorkloadSummary: React.FC<MasterWorkloadSummaryProps> = ({ className = "" }) => {
  const [workloadData, setWorkloadData] = useState<MasterWorkloadData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkloadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Токен аутентификации не найден');
      }

      const response = await axios.get(`${API}/api/masters/workload/all/`, {
        headers: { Authorization: `Token ${token}` }
      });
      
      setWorkloadData(response.data);
    } catch (error: any) {
      console.error('Ошибка получения данных рабочей нагрузки:', error);
      setError('Не удалось загрузить данные о нагрузке мастеров');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkloadData();
  }, []);

  const getWorkloadStatus = (master: MasterWorkloadData) => {
    if (!master.next_available_slot) {
      return { variant: "destructive" as const, text: "Недоступен", color: "text-red-600" };
    }
    if (master.total_orders_today > 5) {
      return { variant: "destructive" as const, text: "Высокая", color: "text-red-600" };
    }
    if (master.total_orders_today > 2) {
      return { variant: "default" as const, text: "Средняя", color: "text-yellow-600" };
    }
    return { variant: "secondary" as const, text: "Низкая", color: "text-green-600" };
  };

  const totalMasters = workloadData.length;
  const availableMasters = workloadData.filter(master => master.next_available_slot !== null).length;
  const totalOrdersToday = workloadData.reduce((sum, master) => sum + master.total_orders_today, 0);
  const workingMasters = workloadData.filter(master => master.total_orders_today > 0).length;

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Нагрузка мастеров
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
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Нагрузка мастеров
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button 
            onClick={fetchWorkloadData} 
            className="mt-4 w-full"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Попробовать снова
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Нагрузка мастеров
        </CardTitle>
        <CardDescription>
          Текущая информация о доступности и занятости мастеров
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Статистические карточки */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalMasters}</div>
            <div className="text-sm text-blue-600">Всего мастеров</div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{availableMasters}</div>
            <div className="text-sm text-green-600">Доступные</div>
          </div>
          
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{workingMasters}</div>
            <div className="text-sm text-orange-600">Работают сегодня</div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{totalOrdersToday}</div>
            <div className="text-sm text-purple-600">Заказов сегодня</div>
          </div>
        </div>

        {/* Список мастеров */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Список мастеров</h4>
            <Button 
              onClick={fetchWorkloadData} 
              size="sm" 
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Обновить
            </Button>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {workloadData.map((master) => {
              const status = getWorkloadStatus(master);
              return (
                <div key={master.master_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{master.master_email}</div>
                    <div className="text-xs text-muted-foreground">
                      {master.next_available_slot 
                        ? `Следующий слот: ${master.next_available_slot.date} в ${master.next_available_slot.start_time}`
                        : 'Нет доступных слотов'
                      }
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={status.variant} className="text-xs">
                      {status.text}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {master.total_orders_today}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {workloadData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Нет данных о мастерах</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MasterWorkloadSummary;
