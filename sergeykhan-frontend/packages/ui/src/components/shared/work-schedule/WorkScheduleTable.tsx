"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/ui";
import { Button } from "@workspace/ui/components/ui";
import { Badge } from "@workspace/ui/components/ui";
import { Checkbox } from "@workspace/ui/components/ui";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@workspace/ui/components/ui";
import { 
  Clock, 
  Save, 
  RefreshCw,
  Calendar,
  Users,
  ExternalLink,
  Eye
} from 'lucide-react';

interface TimeSlot {
  time: string;
  display: string;
}

interface WorkDay {
  date: string;
  day: string;
  isSelected: boolean;
  selectedSlots: string[];
  assignedOrders: { [key: string]: any }; // Заказы, назначенные на слоты
}

interface WorkScheduleProps {
  userRole: 'master' | 'curator' | 'super-admin';
  masterId?: number;
}

const WorkScheduleTable: React.FC<WorkScheduleProps> = ({ userRole, masterId }) => {
  const [workDays, setWorkDays] = useState<WorkDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedOrderModal, setSelectedOrderModal] = useState<{
    isOpen: boolean;
    order: any | null;
  }>({ isOpen: false, order: null });

  // Временные слоты с 9:00 до 18:00
  const timeSlots: TimeSlot[] = [
    { time: '09:00', display: '09:00-10:00' },
    { time: '10:00', display: '10:00-11:00' },
    { time: '11:00', display: '11:00-12:00' },
    { time: '12:00', display: '12:00-13:00' },
    { time: '13:00', display: '13:00-14:00' },
    { time: '14:00', display: '14:00-15:00' },
    { time: '15:00', display: '15:00-16:00' },
    { time: '16:00', display: '16:00-17:00' },
    { time: '17:00', display: '17:00-18:00' },
  ];

  // Генерируем следующие 7 дней
  const generateWeekDays = (): WorkDay[] => {
    const days: WorkDay[] = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
      
      days.push({
        date: date.toISOString().split('T')[0] || '',
        day: `${dayNames[date.getDay()]} ${date.getDate()}.${date.getMonth() + 1}`,
        isSelected: false,
        selectedSlots: [],
        assignedOrders: {}
      });
    }
    
    return days;
  };

  const fetchWorkSchedule = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const scheduleUrl = userRole === 'master' 
        ? 'http://127.0.0.1:8000/api/master/schedule/'
        : `http://127.0.0.1:8000/api/master/schedule/${masterId}/`;
        
      // Получаем расписание
      const scheduleResponse = await fetch(scheduleUrl, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      let scheduleData = null;
      if (scheduleResponse.ok) {
        scheduleData = await scheduleResponse.json();
        console.log('Loaded schedule data:', scheduleData);
      }

      // Получаем заказы для отображения занятых слотов
      const targetMasterId = userRole === 'master' ? undefined : masterId;
      const ordersUrl = targetMasterId 
        ? `http://127.0.0.1:8000/api/orders/?assigned_master=${targetMasterId}&status=назначен,выполняется`
        : 'http://127.0.0.1:8000/api/orders/master-orders/?status=назначен,выполняется';
        
      let ordersData = [];
      try {
        const ordersResponse = await fetch(ordersUrl, {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (ordersResponse.ok) {
          ordersData = await ordersResponse.json();
          console.log('Loaded orders data:', ordersData);
        }
      } catch (ordersError) {
        console.warn('Could not fetch orders data:', ordersError);
      }

      // Обновляем рабочие дни с данными с сервера
      const updatedDays = generateWeekDays().map(day => {
        const serverDay = scheduleData?.schedule?.find((d: any) => d.date === day.date);
        let selectedSlots: string[] = [];
        let assignedOrders: { [key: string]: any } = {};
        
        if (serverDay && serverDay.slots && serverDay.slots.length > 0) {
          // Конвертируем слоты из backend формата в frontend формат
          selectedSlots = serverDay.slots.map((slot: any) => {
            // Из backend приходят объекты с start_time и end_time
            // Нужно найти соответствующий timeSlot
            const matchingTimeSlot = timeSlots.find(ts => {
              const [start, end] = ts.display.split('-');
              return start === slot.start_time && end === slot.end_time;
            });
            return matchingTimeSlot ? matchingTimeSlot.time : slot.start_time;
          }).filter(Boolean); // Убираем undefined значения
        }

        // Находим заказы для этого дня
        if (Array.isArray(ordersData)) {
          ordersData.forEach((order: any) => {
            if (order.scheduled_date === day.date && order.scheduled_time) {
              // Находим соответствующий временной слот
              const orderTime = order.scheduled_time.substring(0, 5); // "HH:MM"
              const matchingSlot = timeSlots.find(slot => slot.time === orderTime);
              if (matchingSlot) {
                assignedOrders[matchingSlot.time] = {
                  id: order.id,
                  client_name: order.client_name,
                  description: order.description,
                  status: order.status
                };
              }
            }
          });
        }
        
        return {
          ...day,
          isSelected: selectedSlots.length > 0,
          selectedSlots: selectedSlots,
          assignedOrders: assignedOrders
        };
      });
      
      setWorkDays(updatedDays);
    } catch (error) {
      console.error('Ошибка загрузки расписания:', error);
      setWorkDays(generateWeekDays());
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkSchedule();
  }, [userRole, masterId]);

  const toggleDaySelection = (dayIndex: number) => {
    if (userRole !== 'master' && userRole !== 'super-admin') return; // Только мастер и супер-админ могут редактировать
    
    setWorkDays(prev => prev.map((day, index) => 
      index === dayIndex 
        ? { ...day, isSelected: !day.isSelected, selectedSlots: day.isSelected ? [] : day.selectedSlots }
        : day
    ));
  };

  const toggleTimeSlot = (dayIndex: number, timeSlot: string) => {
    if (userRole !== 'master' && userRole !== 'super-admin') return; // Только мастер и супер-админ могут редактировать
    
    setWorkDays(prev => prev.map((day, index) => {
      if (index === dayIndex && day.isSelected) {
        const newSlots = day.selectedSlots.includes(timeSlot)
          ? day.selectedSlots.filter(slot => slot !== timeSlot)
          : [...day.selectedSlots, timeSlot];
        return { ...day, selectedSlots: newSlots };
      }
      return day;
    }));
  };

  const handleOrderClick = (order: any) => {
    setSelectedOrderModal({ isOpen: true, order });
  };

  const navigateToOrder = (orderId: number) => {
    if (typeof window !== 'undefined') {
      // Навигация зависит от роли пользователя
      if (userRole === 'super-admin') {
        window.open(`/orders/${orderId}`, '_blank');
      } else if (userRole === 'curator') {
        window.open(`/orders/${orderId}`, '_blank');
      } else {
        window.open(`/orders/${orderId}`, '_blank');
      }
    }
  };

  const saveSchedule = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const scheduleData = workDays
        .filter(day => day.isSelected && day.selectedSlots.length > 0)
        .map(day => ({
          date: day.date,
          slots: day.selectedSlots.map(timeSlot => {
            // Конвертируем время в формат start_time и end_time
            const currentSlot = timeSlots.find(slot => slot.time === timeSlot);
            if (!currentSlot) {
              throw new Error(`Invalid time slot: ${timeSlot}`);
            }
            
            // Извлекаем время начала и конца из display
            const [start_time, end_time] = currentSlot.display.split('-');
            return {
              start_time: start_time,
              end_time: end_time
            };
          })
        }));

      console.log('Sending schedule data:', scheduleData);

      // URL зависит от роли: супер-админ может редактировать расписание любого мастера
      const saveUrl = userRole === 'master' 
        ? 'http://127.0.0.1:8000/api/master/schedule/'
        : `http://127.0.0.1:8000/api/master/schedule/${masterId}/`;

      const response = await fetch(saveUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ schedule: scheduleData })
      });

      const responseData = await response.json();
      console.log('Response:', responseData);

      if (response.ok) {
        alert('Расписание сохранено успешно!');
        fetchWorkSchedule(); // Обновляем данные
      } else {
        const errorMessage = responseData.error || responseData.message || 'Неизвестная ошибка';
        alert(`Ошибка сохранения расписания: ${errorMessage}`);
        console.error('Server error:', responseData);
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Ошибка сохранения расписания: проблема с сетью');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-700">
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="ml-2">Загрузка расписания...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-white dark:bg-black border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {userRole === 'master' ? 'Мое рабочее расписание' : `Расписание мастера #${masterId}`}
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                <span className="text-muted-foreground">Свободно: {
                  workDays.reduce((acc, day) => {
                    return acc + day.selectedSlots.filter(slot => !day.assignedOrders[slot]).length;
                  }, 0)
                }</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                <span className="text-muted-foreground">Занято: {
                  workDays.reduce((acc, day) => {
                    return acc + day.selectedSlots.filter(slot => day.assignedOrders[slot]).length;
                  }, 0)
                }</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left p-3 font-medium">День</th>
                  {timeSlots.map(slot => (
                    <th key={slot.time} className="text-center p-2 text-sm font-medium min-w-[100px]">
                      {slot.display}
                    </th>
                  ))}
                  <th className="text-center p-3 font-medium">Всего слотов</th>
                </tr>
              </thead>
              <tbody>
                {workDays.map((day, dayIndex) => (
                  <tr key={day.date} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {(userRole === 'master' || userRole === 'super-admin') && (
                          <Checkbox
                            checked={day.isSelected}
                            onCheckedChange={() => toggleDaySelection(dayIndex)}
                          />
                        )}
                        <span className="font-medium">{day.day}</span>
                      </div>
                    </td>
                    {timeSlots.map(slot => {
                      const hasSlot = day.selectedSlots.includes(slot.time);
                      const hasOrder = day.assignedOrders[slot.time];
                      
                      return (
                        <td key={slot.time} className="text-center p-2">
                          {day.isSelected ? (
                            <div className="flex flex-col items-center gap-1">
                              {(userRole === 'master' || userRole === 'super-admin') ? (
                                <Checkbox
                                  checked={hasSlot}
                                  onCheckedChange={() => toggleTimeSlot(dayIndex, slot.time)}
                                  disabled={hasOrder ? true : false} // Нельзя убрать слот если есть заказ
                                />
                              ) : (
                                <div className={`w-4 h-4 rounded ${hasSlot ? 'bg-green-500' : 'bg-gray-300'}`} />
                              )}
                              
                              {hasSlot && hasOrder && (
                                <div className="text-center">
                                  <div 
                                    className="cursor-pointer hover:shadow-md transition-shadow group"
                                    onClick={() => handleOrderClick(hasOrder)}
                                    title={`Заказ #${hasOrder.id}\nКлиент: ${hasOrder.client_name}\nОписание: ${hasOrder.description}\nСтатус: ${hasOrder.status}\nКликните для подробностей`}
                                  >
                                    <Badge 
                                      variant="destructive" 
                                      className="text-xs px-2 py-1 mb-1 group-hover:bg-red-600 transition-colors"
                                    >
                                      <Eye className="w-3 h-3 mr-1" />
                                      #{hasOrder.id}
                                    </Badge>
                                    <div className="text-xs text-muted-foreground max-w-[80px] truncate font-medium">
                                      {hasOrder.client_name}
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {hasSlot && !hasOrder && (
                                <Badge variant="default" className="text-xs px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Свободен
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="text-center p-3">
                      <div className="flex flex-col items-center gap-1">
                        <Badge variant={day.selectedSlots.length > 0 ? "default" : "secondary"}>
                          {day.selectedSlots.length}
                        </Badge>
                        {day.selectedSlots.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            <span className="text-green-600">
                              {day.selectedSlots.filter(slot => !day.assignedOrders[slot]).length} свободно
                            </span>
                            {day.selectedSlots.filter(slot => day.assignedOrders[slot]).length > 0 && (
                              <>
                                <br />
                                <span className="text-red-600">
                                  {day.selectedSlots.filter(slot => day.assignedOrders[slot]).length} занято
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {(userRole === 'master' || userRole === 'super-admin') && (
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t dark:border-gray-700">
              <Button
                onClick={fetchWorkSchedule}
                variant="outline"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Обновить
              </Button>
              <Button
                onClick={saveSchedule}
                disabled={saving}
              >
                <Save className={`h-4 w-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
                {saving ? 'Сохранение...' : 'Сохранить расписание'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Модальное окно с деталями заказа */}
      <Dialog 
        open={selectedOrderModal.isOpen} 
        onOpenChange={(open) => setSelectedOrderModal({ isOpen: open, order: null })}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Заказ #{selectedOrderModal.order?.id}
            </DialogTitle>
            <DialogDescription>
              Детали запланированного заказа
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrderModal.order && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Клиент</label>
                  <p className="text-sm font-semibold">{selectedOrderModal.order.client_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Статус</label>
                  <p className="text-sm">
                    <Badge 
                      variant={selectedOrderModal.order.status === 'completed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {selectedOrderModal.order.status}
                    </Badge>
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Описание</label>
                <p className="text-sm mt-1 p-3 bg-muted rounded-lg">
                  {selectedOrderModal.order.description || 'Описание не указано'}
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => {
                    navigateToOrder(selectedOrderModal.order.id);
                    setSelectedOrderModal({ isOpen: false, order: null });
                  }}
                  className="flex-1"
                  size="sm"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Перейти к заказу
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedOrderModal({ isOpen: false, order: null })}
                  size="sm"
                >
                  Закрыть
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkScheduleTable;
