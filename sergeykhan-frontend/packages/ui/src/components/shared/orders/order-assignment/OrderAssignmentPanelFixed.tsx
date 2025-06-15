'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@workspace/ui/components/ui";
import { Button } from "@workspace/ui/components/ui";
import { Badge } from "@workspace/ui/components/ui";
import { Input } from "@workspace/ui/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/ui";
import { Separator } from "@workspace/ui/components/ui";
import { Clock, User, Calendar, AlertCircle, CheckCircle, Search, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface MasterAvailability {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
}

interface MasterWorkloadData {
  master_id: number;
  master_email: string;
  availability_slots: MasterAvailability[];
  orders_count_by_date: Record<string, number>;
  next_available_slot: {
    date: string;
    start_time: string;
    end_time: string;
    orders_on_date: number;
  } | null;
  total_orders_today: number;
}

interface Master {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
}

interface OrderAssignmentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (masterId: number) => void;
  orderId?: number;
  orderDate?: string;
  orderTime?: string;
  loading?: boolean;
}

const OrderAssignmentPanel: React.FC<OrderAssignmentPanelProps> = ({
  isOpen,
  onClose,
  onAssign,
  orderId,
  orderDate,
  orderTime,
  loading = false
}) => {
  const [masters, setMasters] = useState<Master[]>([]);
  const [mastersWorkload, setMastersWorkload] = useState<Record<number, MasterWorkloadData>>({});
  const [selectedMasterId, setSelectedMasterId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch masters and their workload data
  const fetchMastersData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Токен авторизации не найден');

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      console.log('Fetching masters from:', `${baseUrl}/users/masters/`);

      // Fetch masters list
      const mastersResponse = await fetch(`${baseUrl}/users/masters/`, {
        headers: { 
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Masters response status:', mastersResponse.status);
      
      if (!mastersResponse.ok) {
        const errorText = await mastersResponse.text();
        console.error('Masters fetch error:', errorText);
        throw new Error(`Ошибка загрузки мастеров: ${mastersResponse.status} ${mastersResponse.statusText}`);
      }
      
      const mastersData = await mastersResponse.json();
      console.log('Masters data received:', mastersData);
      
      if (!mastersData || mastersData.length === 0) {
        throw new Error('Мастера не найдены. Убедитесь, что в системе есть зарегистрированные мастера.');
      }
      
      setMasters(mastersData);

      // Fetch workload data for each master
      const workloadPromises = mastersData.map(async (master: Master) => {
        try {
          const workloadResponse = await fetch(
            `${baseUrl}/api/masters/${master.id}/workload/`,
            { 
              headers: { 
                Authorization: `Token ${token}`,
                'Content-Type': 'application/json'
              } 
            }
          );
          
          if (workloadResponse.ok) {
            const workloadData = await workloadResponse.json();
            return { masterId: master.id, workloadData };
          } else {
            console.warn(`Failed to fetch workload for master ${master.id}:`, workloadResponse.status);
            return { masterId: master.id, workloadData: null };
          }
        } catch (err) {
          console.warn(`Failed to fetch workload for master ${master.id}:`, err);
          return { masterId: master.id, workloadData: null };
        }
      });

      const workloadResults = await Promise.all(workloadPromises);
      const workloadMap: Record<number, MasterWorkloadData> = {};
      
      workloadResults.forEach(({ masterId, workloadData }) => {
        if (workloadData) {
          workloadMap[masterId] = workloadData;
        }
      });

      setMastersWorkload(workloadMap);
      console.log('Workload data set:', workloadMap);
    } catch (err: any) {
      console.error('Error fetching masters data:', err);
      setError(err.message);
      toast.error(`Ошибка загрузки мастеров: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMastersData();
    }
  }, [isOpen]);

  // Filter masters based on search term
  const filteredMasters = masters.filter(master =>
    master.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    master.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    master.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get availability status for a master
  const getAvailabilityStatus = (workload?: MasterWorkloadData) => {
    if (!workload) {
      return { status: 'Неизвестно', ordersCount: 0 };
    }

    const ordersCount = workload.total_orders_today || 0;
    
    if (ordersCount === 0) {
      return { status: 'Свободен', ordersCount };
    } else if (ordersCount <= 2) {
      return { status: 'Доступен', ordersCount };
    } else if (ordersCount <= 5) {
      return { status: 'Занят', ordersCount };
    } else {
      return { status: 'Перегружен', ordersCount };
    }
  };

  // Get workload color based on orders count
  const getWorkloadColor = (ordersCount: number): string => {
    if (ordersCount === 0) return 'border-green-200 bg-green-50 text-green-700';
    if (ordersCount <= 2) return 'border-blue-200 bg-blue-50 text-blue-700';
    if (ordersCount <= 5) return 'border-yellow-200 bg-yellow-50 text-yellow-700';
    return 'border-red-200 bg-red-50 text-red-700';
  };

  const handleAssign = () => {
    if (selectedMasterId) {
      onAssign(selectedMasterId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Назначить мастера на заказ #{orderId}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Search and Refresh */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Поиск мастеров по имени или email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchMastersData}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Error state */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Masters list */}
          <div className="flex-1 min-h-0 overflow-y-auto max-h-96">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                Загрузка мастеров...
              </div>
            ) : filteredMasters.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {searchTerm ? 'Мастера не найдены по запросу' : 'Нет доступных мастеров'}
                </p>
                {!searchTerm && (
                  <p className="text-xs mt-1 opacity-75">
                    Убедитесь, что в системе есть зарегистрированные мастера
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/30 rounded-t">
                  <div className="col-span-4">Мастер</div>
                  <div className="col-span-2">Загрузка</div>
                  <div className="col-span-3">Ближайший слот</div>
                  <div className="col-span-2">Заказы</div>
                  <div className="col-span-1">Действие</div>
                </div>
                
                {/* Master rows */}
                {filteredMasters.map((master) => {
                  const workload = mastersWorkload[master.id];
                  const availability = getAvailabilityStatus(workload);
                  const isSelected = selectedMasterId === master.id;

                  return (
                    <Card
                      key={master.id}
                      className={`cursor-pointer transition-all duration-200 ${
                        isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-accent/30'
                      }`}
                      onClick={() => setSelectedMasterId(master.id)}
                    >
                      <CardContent className="p-3">
                        <div className="grid grid-cols-12 gap-2 items-center">
                          {/* Master info */}
                          <div className="col-span-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">
                                  {master.first_name} {master.last_name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {master.email}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Workload status */}
                          <div className="col-span-2">
                            <div className="flex items-center gap-1">
                              <Badge
                                variant="outline"
                                className={`text-xs px-2 py-0.5 ${getWorkloadColor(availability.ordersCount)}`}
                              >
                                {availability.status}
                              </Badge>
                            </div>
                          </div>

                          {/* Next available slot */}
                          <div className="col-span-3">
                            {workload?.next_available_slot ? (
                              <div className="text-xs">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  <span>
                                    {new Date(workload.next_available_slot.date).toLocaleDateString('ru-RU', {
                                      day: '2-digit',
                                      month: '2-digit'
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {workload.next_available_slot.start_time} - {workload.next_available_slot.end_time}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Нет слотов
                              </span>
                            )}
                          </div>

                          {/* Orders count */}
                          <div className="col-span-2">
                            <div className="text-center">
                              <div className="text-sm font-medium">
                                {availability.ordersCount}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                заказов
                              </div>
                            </div>
                          </div>

                          {/* Action button */}
                          <div className="col-span-1">
                            <Button
                              size="sm"
                              variant={isSelected ? "default" : "outline"}
                              className="h-8 w-full text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isSelected) {
                                  handleAssign();
                                } else {
                                  setSelectedMasterId(master.id);
                                }
                              }}
                            >
                              {isSelected ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                'Выбрать'
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Expanded info for selected master */}
                        {isSelected && workload && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="text-muted-foreground">Всего заказов сегодня:</span>
                                <span className="ml-2 font-medium">{workload.total_orders_today}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Доступных слотов:</span>
                                <span className="ml-2 font-medium">
                                  {workload.availability_slots?.length || 0}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <Separator />

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Отмена
          </Button>
          <Button 
            onClick={handleAssign}
            disabled={!selectedMasterId || loading || isLoading}
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Назначение...
              </>
            ) : (
              'Назначить мастера'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderAssignmentPanel;
