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
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone?: string;
}

interface OrderAssignmentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (masterId: number, slotData?: { scheduled_date: string; scheduled_time: string }) => void;
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
  // Отладочный лог рендера
  console.log('🎨 OrderAssignmentPanel рендерится:', { 
    isOpen, 
    orderId, 
    orderDate, 
    orderTime, 
    loading 
  });

  const [masters, setMasters] = useState<Master[]>([]);
  const [mastersWorkload, setMastersWorkload] = useState<Record<number, MasterWorkloadData>>({});
  const [selectedMasterId, setSelectedMasterId] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<MasterAvailability | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch masters and their workload data
  const fetchMastersData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Токен авторизации не найден. Пожалуйста, войдите в систему заново.');
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      console.log('🔍 Начинаем загрузку мастеров...');
      console.log('📍 API URL:', baseUrl);
      console.log('🔑 Токен найден:', token ? 'Да' : 'Нет');

      // Fetch masters list
      const mastersResponse = await fetch(`${baseUrl}/users/masters/`, {
        headers: { 
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Статус ответа мастеров:', mastersResponse.status);
      console.log('📋 Заголовки ответа:', Object.fromEntries(mastersResponse.headers.entries()));
      
      if (!mastersResponse.ok) {
        const errorText = await mastersResponse.text();
        console.error('❌ Ошибка загрузки мастеров:', errorText);
        
        if (mastersResponse.status === 401) {
          throw new Error('Нет доступа. Проверьте права супер-админа или куратора.');
        } else if (mastersResponse.status === 403) {
          throw new Error('Недостаточно прав для просмотра списка мастеров.');
        } else {
          throw new Error(`Ошибка сервера: ${mastersResponse.status} - ${errorText}`);
        }
      }
      
      const mastersData = await mastersResponse.json();
      console.log('✅ Данные мастеров получены:', mastersData);
      console.log('👥 Количество мастеров:', mastersData?.length || 0);
      
      if (!mastersData || !Array.isArray(mastersData) || mastersData.length === 0) {
        throw new Error('В системе не найдено ни одного мастера. Обратитесь к администратору для добавления мастеров.');
      }
      
      setMasters(mastersData);
      console.log('💾 Мастера сохранены в состояние:', mastersData.length);

      // Fetch workload data for each master
      console.log('🔄 Начинаем загрузку данных о загрузке мастеров...');
      const workloadPromises = mastersData.map(async (master: Master) => {
        try {
          console.log(`📊 Загружаем данные для мастера ${master.id} (${master.email})`);
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
            console.log(`✅ Данные загрузки для мастера ${master.id}:`, workloadData);
            console.log(`📅 Доступные слоты мастера ${master.id}:`, workloadData.availability_slots);
            return { masterId: master.id, workloadData };
          } else {
            console.warn(`⚠️ Не удалось загрузить данные для мастера ${master.id}:`, workloadResponse.status);
            return { masterId: master.id, workloadData: null };
          }
        } catch (err) {
          console.warn(`❌ Ошибка загрузки данных для мастера ${master.id}:`, err);
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
      console.log('✅ Данные о загрузке мастеров сохранены:', Object.keys(workloadMap).length, 'из', mastersData.length);
      
      // Показываем успешное сообщение если все загрузилось
      if (mastersData.length > 0) {
        toast.success(`Загружено ${mastersData.length} мастеров`);
      }
    } catch (err: any) {
      console.error('💥 Ошибка загрузки данных мастеров:', err);
      setError(err.message);
      toast.error(`Ошибка: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      console.log('🚀 OrderAssignmentPanel открыт, начинаем загрузку мастеров...');
      console.log('📋 Параметры:', { orderId, orderDate, orderTime });
      fetchMastersData();
    } else {
      // Сброс состояния при закрытии
      setSelectedMasterId(null);
      setSelectedSlot(null);
      setSearchTerm('');
      setError(null);
    }
  }, [isOpen]);

  // Filter masters based on search term
  const filteredMasters = masters.filter(master => {
    try {
      const firstName = master?.first_name || '';
      const lastName = master?.last_name || '';
      const email = master?.email || '';
      const searchTermLower = (searchTerm || '').toLowerCase();
      
      return firstName.toLowerCase().includes(searchTermLower) ||
             lastName.toLowerCase().includes(searchTermLower) ||
             email.toLowerCase().includes(searchTermLower);
    } catch (error) {
      console.error('❌ Ошибка фильтрации мастера:', error, 'Master:', master);
      return false;
    }
  });

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

  // Get master display name
  const getMasterDisplayName = (master: Master): string => {
    if (master.full_name) {
      return master.full_name;
    }
    
    const firstName = master.first_name || '';
    const lastName = master.last_name || '';
    
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    
    return master.email || `Мастер #${master.id}`;
  };

  // Get workload color based on orders count - адаптивно для темной темы (только черный/белый фон)
  const getWorkloadColor = (ordersCount: number): string => {
    if (ordersCount === 0) return 'border-border bg-background text-foreground';
    if (ordersCount <= 2) return 'border-border bg-background text-foreground';
    if (ordersCount <= 5) return 'border-border bg-background text-foreground';
    return 'border-border bg-background text-foreground';
  };

  const handleAssign = () => {
    if (selectedMasterId && selectedSlot) {
      // Назначаем с конкретным слотом
      const slotData = {
        masterId: selectedMasterId,
        scheduled_date: selectedSlot.date,
        scheduled_time: selectedSlot.start_time // Не добавляем секунды, время уже в правильном формате
      };
      onAssign(selectedMasterId, slotData);
    } else if (selectedMasterId) {
      // Назначаем без конкретного слота (будет проверка доступности на backend)
      onAssign(selectedMasterId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">,
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Назначить мастера на заказ #{orderId}
            {/* Диагностическая информация в заголовке */}
            <span className="text-xs text-muted-foreground ml-auto">
              {masters.length > 0 ? `${masters.length} мастеров` : 'Загрузка...'}
            </span>
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

          {/* Error state - адаптивный дизайн */}
          {error && (
            <div className="bg-background dark:bg-background border border-destructive dark:border-destructive rounded-lg p-4">
              <div className="flex items-center gap-2 text-destructive dark:text-destructive mb-2">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Ошибка загрузки мастеров</span>
              </div>
              <p className="text-sm text-destructive/80 dark:text-destructive/80 mb-3">{error}</p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={fetchMastersData}
                  disabled={isLoading}
                  className="text-destructive dark:text-destructive border-destructive/30 dark:border-destructive/30 hover:bg-background dark:hover:bg-background"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                  Попробовать снова
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => {
                    console.log('🔍 Диагностическая информация:');
                    console.log('Token:', localStorage.getItem('token') ? 'Найден' : 'Отсутствует');
                    console.log('API URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');
                    console.log('Masters count:', masters.length);
                    console.log('Current user role:', localStorage.getItem('userRole'));
                    toast.info('Диагностическая информация выведена в консоль браузера');
                  }}
                  className="text-muted-foreground"
                >
                  Диагностика
                </Button>
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
                <p className="text-sm font-medium mb-1">
                  {searchTerm ? 'Мастера не найдены по запросу' : 'Нет доступных мастеров'}
                </p>
                {!searchTerm && masters.length === 0 && (
                  <div className="space-y-2">
                    <p className="text-xs opacity-75">
                      В системе не найдено ни одного мастера
                    </p>
                    <div className="flex justify-center gap-2 mt-3">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={fetchMastersData}
                        disabled={isLoading}
                      >
                        <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                        Обновить
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => {
                          console.log('🔍 Проверка доступа:');
                          console.log('URL:', `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/users/masters/`);
                          console.log('Token:', localStorage.getItem('token') ? 'Найден' : 'Отсутствует');
                          console.log('User role:', localStorage.getItem('userRole'));
                          toast.info('Проверьте консоль браузера для диагностики');
                        }}
                      >
                        Диагностика
                      </Button>
                    </div>
                  </div>
                )}
                {!searchTerm && masters.length > 0 && (
                  <p className="text-xs opacity-75">
                    Попробуйте изменить критерии поиска
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {/* Enhanced Table Header - адаптивный дизайн */}
                <div className="grid grid-cols-12 gap-3 px-4 py-3 text-xs font-semibold text-muted-foreground bg-background dark:bg-background border border-border dark:border-border rounded-lg">
                  <div className="col-span-3">👤 Мастер</div>
                  <div className="col-span-2">📊 Статус загрузки</div>
                  <div className="col-span-3">📅 Доступные слоты</div>
                  <div className="col-span-2">📋 Активные заказы</div>
                  <div className="col-span-2">⚡ Действие</div>
                </div>

                {/* Master rows with enhanced design */}
                <div className="space-y-1">
                  {filteredMasters.map((master) => {
                    const workload = mastersWorkload[master.id];
                    const availability = getAvailabilityStatus(workload);
                    const isSelected = selectedMasterId === master.id;
                    const ordersCount = workload?.total_orders_today || 0;

                    return (
                      <Card
                        key={master.id}
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                          isSelected 
                            ? 'ring-2 ring-primary bg-background border-primary' 
                            : 'hover:bg-accent/50 border-border/50'
                        }`}
                        onClick={() => setSelectedMasterId(master.id)}
                      >
                        <CardContent className="p-4">
                          <div className="grid grid-cols-12 gap-3 items-center">
                            {/* Enhanced Master info */}
                            <div className="col-span-3">
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-muted dark:bg-muted text-muted-foreground dark:text-muted-foreground">
                                  <User className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold truncate">
                                    {getMasterDisplayName(master)}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {master.email || 'Нет email'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Enhanced Workload status */}
                            <div className="col-span-2">
                              <div className="flex flex-col gap-1">
                                <Badge
                                  variant="outline"
                                  className="text-xs px-2 py-1 font-medium border-border bg-background text-foreground"
                                >
                                  {ordersCount === 0 ? '🟢 Свободен' :
                                   ordersCount <= 2 ? '🟡 Доступен' :
                                   ordersCount <= 5 ? '🟠 Занят' : '🔴 Перегружен'}
                                </Badge>
                                <div className="text-xs text-muted-foreground">
                                  Нагрузка: {ordersCount}/8 заказов
                                </div>
                              </div>
                            </div>

                            {/* Enhanced Available slots display */}
                            <div className="col-span-3">
                              {workload?.availability_slots && workload.availability_slots.length > 0 ? (
                                <div className="text-xs space-y-1">
                                  <div className="flex items-center gap-1 text-muted-foreground mb-1">
                                    <Calendar className="h-3 w-3" />
                                    <span className="font-medium">Доступные слоты ({workload.availability_slots.length})</span>
                                  </div>
                                  {/* Show first 2-3 available slots */}
                                  {workload.availability_slots.slice(0, 3).map((slot, index) => (
                                    <div key={index} className="flex items-center gap-1 text-muted-foreground">
                                      <Clock className="h-3 w-3" />
                                      <span className="font-medium">
                                        {new Date(slot.date).toLocaleDateString('ru-RU', {
                                          day: '2-digit',
                                          month: '2-digit'
                                        })} {slot.start_time}-{slot.end_time}
                                      </span>
                                    </div>
                                  ))}
                                  {workload.availability_slots.length > 3 && (
                                    <div className="text-xs text-muted-foreground">
                                      +{workload.availability_slots.length - 3} еще...
                                    </div>
                                  )}
                                  <div className="text-xs text-foreground">
                                    ✅ Доступен для записи
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-center">
                                  <div className="text-destructive dark:text-destructive font-medium">❌ Нет слотов</div>
                                  <div className="text-muted-foreground">Недоступен</div>
                                </div>
                              )}
                            </div>

                            {/* Enhanced Orders count */}
                            <div className="col-span-2">
                              <div className="text-center">
                                <div className="text-lg font-bold text-foreground">
                                  {ordersCount}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  активных заказов
                                </div>
                                {workload && Object.keys(workload.orders_count_by_date || {}).length > 0 && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    📅 {Object.keys(workload.orders_count_by_date).length} дней в расписании
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Enhanced Action button */}
                            <div className="col-span-2">                                <Button
                                size="sm"
                                variant={isSelected ? "default" : "outline"}
                                className={`w-full font-medium ${
                                  isSelected 
                                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
                                    : 'hover:bg-accent hover:border-border'
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMasterId(master.id);
                                  setSelectedSlot(null); // Сбрасываем выбранный слот при смене мастера
                                }}
                              >
                                {isSelected ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Выбран
                                  </>
                                ) : (
                                  'Выбрать'
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* Expandable details section */}
                          {isSelected && workload && (
                            <div className="mt-4 pt-4 border-t border-border">
                              <div className="grid grid-cols-1 gap-4 text-xs">
                                {/* Статистика */}
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-muted-foreground">📊 Статистика</h4>
                                  <div className="space-y-1">
                                    <div className="flex justify-between">
                                      <span>Всего заказов сегодня:</span>
                                      <span className="font-medium">{workload.total_orders_today}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Доступных слотов:</span>
                                      <span className="font-medium">
                                        {workload.availability_slots?.length || 0}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Все доступные слоты */}
                                {workload.availability_slots && workload.availability_slots.length > 0 && (
                                  <div className="space-y-2">
                                    <h4 className="font-semibold text-muted-foreground">🕒 Все доступные слоты</h4>
                                    <div className="max-h-32 overflow-y-auto space-y-1 bg-muted/20 p-2 rounded">
                                      {workload.availability_slots.map((slot, index) => (
                                        <div key={index} className="flex justify-between items-center py-1 px-2 bg-background rounded text-xs">
                                          <span className="font-medium">
                                            {new Date(slot.date).toLocaleDateString('ru-RU', {
                                              day: '2-digit',
                                              month: '2-digit',
                                              year: '2-digit'
                                            })}
                                          </span>
                                          <span className="text-muted-foreground">
                                            {slot.start_time} - {slot.end_time}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Ближайшие дни с заказами */}
                                {Object.keys(workload.orders_count_by_date || {}).length > 0 && (
                                  <div className="space-y-2">
                                    <h4 className="font-semibold text-muted-foreground">📅 Ближайшие дни с заказами</h4>
                                    <div className="space-y-1">
                                      {Object.entries(workload.orders_count_by_date || {}).slice(0, 5).map(([date, count]) => (
                                        <div key={date} className="flex justify-between">
                                          <span>{new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}:</span>
                                          <span className="font-medium">{count} заказов</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Slot Selection Section */}
          {selectedMasterId && mastersWorkload[selectedMasterId]?.availability_slots && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Выберите конкретное время для назначения
                <span className="text-sm font-normal text-muted-foreground">
                  (опционально - можно назначить без выбора слота)
                </span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
                {mastersWorkload[selectedMasterId].availability_slots.map((slot, index) => {
                  const isSlotSelected = selectedSlot?.date === slot.date && selectedSlot?.start_time === slot.start_time;
                  
                  return (
                    <Card
                      key={index}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                        isSlotSelected 
                          ? 'ring-2 ring-green-500 bg-green-50 border-green-200' 
                          : 'hover:bg-accent/50 border-border/50'
                      }`}
                      onClick={() => setSelectedSlot(isSlotSelected ? null : slot)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">
                              {new Date(slot.date).toLocaleDateString('ru-RU', {
                                day: '2-digit',
                                month: '2-digit',
                                year: '2-digit'
                              })}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {slot.start_time} - {slot.end_time}
                            </div>
                          </div>
                          {isSlotSelected && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {selectedSlot && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Выбрано: {new Date(selectedSlot.date).toLocaleDateString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })} в {selectedSlot.start_time} - {selectedSlot.end_time}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
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
            ) : selectedSlot ? (
              `Назначить на ${selectedSlot.start_time}`
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
