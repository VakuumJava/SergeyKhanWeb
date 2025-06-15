"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/ui";
import { Button } from "@workspace/ui/components/ui";
import { Badge } from "@workspace/ui/components/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/ui/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/ui";
import { WorkScheduleTable } from '@workspace/ui/components/shared/work-schedule';
import { 
  Users, 
  Clock, 
  Calendar,
  Settings,
  RefreshCw,
  Eye
} from 'lucide-react';

interface Master {
  id: number;
  email: string;
  name: string;
  available_slots_today: number;
  assigned_orders_today: number;
  capacity_percentage: number;
  total_orders_completed: number;
}

interface CuratorMasterManagementProps {
  userRole: 'curator' | 'super-admin';
}

const CuratorMasterManagement: React.FC<CuratorMasterManagementProps> = ({ userRole }) => {
  const [masters, setMasters] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaster, setSelectedMaster] = useState<Master | null>(null);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);

  const fetchMasters = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/masters/', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMasters(data.masters || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки мастеров:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMasters();
  }, []);

  const getCapacityBadge = (percentage: number) => {
    if (percentage >= 90) {
      return <Badge variant="destructive">Перегружен</Badge>;
    } else if (percentage >= 70) {
      return <Badge variant="secondary">Загружен</Badge>;
    } else if (percentage > 0) {
      return <Badge variant="default">Работает</Badge>;
    } else {
      return <Badge variant="outline">Не работает</Badge>;
    }
  };

  const openScheduleDialog = (master: Master) => {
    setSelectedMaster(master);
    setIsScheduleDialogOpen(true);
  };

  if (loading) {
    return (
      <Card className="bg-background border-border">
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="ml-2">Загрузка мастеров...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-background border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Управление мастерами
            <Button
              onClick={fetchMasters}
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
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium">Мастер</th>
                  <th className="text-center p-3 font-medium">Свободные слоты</th>
                  <th className="text-center p-3 font-medium">Назначено заказов</th>
                  <th className="text-center p-3 font-medium">Загрузка</th>
                  <th className="text-center p-3 font-medium">Статус</th>
                  <th className="text-center p-3 font-medium">Выполнено заказов</th>
                  <th className="text-center p-3 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {masters.map((master) => (
                  <tr key={master.id} className="border-b border-border hover:bg-muted">
                    <td className="p-3">
                      <div className="font-medium">{master.name || master.email}</div>
                      <div className="text-sm text-muted-foreground">ID: {master.id}</div>
                    </td>
                    <td className="text-center p-3">
                      <Badge variant="outline" className="flex items-center gap-1 justify-center">
                        <Clock className="h-3 w-3" />
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
                    <td className="text-center p-3">
                      <Badge variant="secondary">
                        {master.total_orders_completed || 0}
                      </Badge>
                    </td>
                    <td className="text-center p-3">
                      <div className="flex gap-2 justify-center">
                        <Button
                          onClick={() => openScheduleDialog(master)}
                          size="sm"
                          variant="outline"
                        >
                          <Calendar className="h-4 w-4 mr-1" />
                          Расписание
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Диалог управления расписанием мастера */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="max-w-6xl bg-background border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Расписание мастера: {selectedMaster?.name || selectedMaster?.email}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {selectedMaster && (
              <WorkScheduleTable 
                userRole={userRole}
                masterId={selectedMaster.id}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CuratorMasterManagement;
