"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@workspace/ui/components/ui";
import { Input } from "@workspace/ui/components/ui";
import { Label } from "@workspace/ui/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/ui";
import { Textarea } from "@workspace/ui/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/ui";
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/ui";
import { Calendar } from "@workspace/ui/components/ui";
import { UserPlus, CalendarIcon, Clock, FileText, Users, RefreshCw, AlertCircle } from 'lucide-react';
import { format } from "date-fns";
import axios from 'axios';
import { API } from '@shared/constants/constants';

interface OrderFormData {
  client_name: string;
  client_phone: string;
  street: string;
  house_number: string;
  apartment: string;
  entrance: string;
  service_type: string;
  description: string;
  equipment_type: string;
  price: number;
  promotion: string;
  due_date: string;
  estimated_cost: number;
  final_cost: number;
  expenses: number;
  // Дополнительные поля для расширенной информации о заказе
  scheduled_date: string;
  scheduled_time: string;
  notes: string;
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
}

// Компонент для анализа пропускной способности и планирования
const CapacityAnalysis: React.FC = () => {
  const [capacityData, setCapacityData] = useState<any>(null);
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

  useEffect(() => {
    fetchCapacityData();
  }, []);

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
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
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
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
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
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="font-medium text-green-900 dark:text-green-100 mb-1">Сегодня</div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
              {today?.capacity?.available_slots || 0}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">свободных слотов</div>
            <div className="text-xs text-green-600 dark:text-green-400 mt-1">
              Работает: {today?.masters_stats?.masters_with_availability || 0} мастеров
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
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
        <div className="space-y-2">
          <div className="font-medium text-gray-900 dark:text-gray-100 mb-2">Рекомендации:</div>
          {recommendations.map((rec: any, index: number) => (
            <div 
              key={index}
              className={`p-3 rounded-lg border text-sm ${
                rec.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200' :
                rec.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200' :
                rec.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200' :
                'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
              }`}
            >
              <div className="font-medium mb-1">{rec.title}</div>
              <div className="text-xs opacity-90">{rec.message}</div>
              <div className="text-xs font-medium mt-2 opacity-95">
                💡 {rec.action}
              </div>
            </div>
          ))}
        </div>

        {/* Детали по мастерам */}
        <div className="border-t dark:border-gray-700 pt-4">
          <div className="font-medium text-gray-900 dark:text-gray-100 mb-3">Статус мастеров на сегодня:</div>
          <div className="space-y-2">
            {today?.masters_details?.map((master: any) => (
              <div key={master.id} className="flex items-center justify-between text-sm">
                <div className="flex-1">
                  <div className="font-medium truncate text-gray-900 dark:text-gray-100">{master.name || master.email}</div>
                  <div className="text-gray-500 dark:text-gray-400 text-xs">
                    Слотов: {master.availability_slots} | Заказов: {master.assigned_orders}
                  </div>
                </div>
                <div className="ml-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    master.status === 'available' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                    master.status === 'busy' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                    'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}>
                    {master.status === 'available' ? 'Доступен' :
                     master.status === 'busy' ? 'Занят' : 'Нет расписания'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const UnifiedOrderCreation: React.FC = () => {
  const [formData, setFormData] = useState<OrderFormData>({
    client_name: '',
    client_phone: '',
    street: '',
    house_number: '',
    apartment: '',
    entrance: '',
    service_type: '',
    description: '',
    equipment_type: '',
    price: 0,
    promotion: '',
    due_date: '',
    estimated_cost: 0,
    final_cost: 0,
    expenses: 0,
    // Дополнительные поля
    scheduled_date: '',
    scheduled_time: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const handleFieldChange = (field: keyof OrderFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const submitForm = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      // Подготавливаем данные в том формате, который ожидает бэкенд
      const payload = {
        client_name: formData.client_name,
        client_phone: formData.client_phone,
        street: formData.street,
        house_number: formData.house_number,
        apartment: formData.apartment,
        entrance: formData.entrance,
        equipment_type: formData.equipment_type,
        service_type: formData.service_type,
        price: Number(formData.price).toFixed(2),
        promotion: formData.promotion,
        due_date: formData.due_date,
        description: formData.description,
        status: "новый",
        operator: null,
        curator: null,
        assigned_master: null,
        estimated_cost: formData.estimated_cost || (formData.price * 0.9).toFixed(2),
        final_cost: formData.final_cost || Number(formData.price).toFixed(2),
        expenses: formData.expenses || (formData.price - formData.price * 0.9).toFixed(2),
        // Дополнительные поля
        scheduled_date: formData.scheduled_date || null,
        scheduled_time: formData.scheduled_time || null,
        notes: formData.notes,
      };
      
      console.log('Отправляем данные на сервер:', payload);
      console.log('Токен:', token);
      console.log('API URL:', `${API}/orders/create/`);
      
      const response = await axios.post(`${API}/orders/create/`, payload, {
        headers: { 
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Успешный ответ:', response.data);
      alert('Заказ успешно создан!');
      
      // Сброс формы
      setFormData({
        client_name: '',
        client_phone: '',
        street: '',
        house_number: '',
        apartment: '',
        entrance: '',
        service_type: '',
        description: '',
        equipment_type: '',
        price: 0,
        promotion: '',
        due_date: '',
        estimated_cost: 0,
        final_cost: 0,
        expenses: 0,
        scheduled_date: '',
        scheduled_time: '',
        notes: '',
      });
      setSelectedDate(undefined);
      
    } catch (error: any) {
      console.error('Ошибка создания заказа:', error);
      
      if (error.response) {
        // Сервер ответил с кодом ошибки
        console.error('Данные ошибки:', error.response.data);
        console.error('Статус ошибки:', error.response.status);
        console.error('Заголовки ответа:', error.response.headers);
        
        const errorMessage = error.response.data?.error || 
                            error.response.data?.detail || 
                            JSON.stringify(error.response.data) || 
                            `Ошибка ${error.response.status}`;
        
        alert(`Ошибка при создании заказа: ${errorMessage}`);
      } else if (error.request) {
        // Запрос был отправлен, но ответ не получен
        console.error('Нет ответа от сервера:', error.request);
        alert('Ошибка: сервер не отвечает');
      } else {
        // Что-то другое
        console.error('Неизвестная ошибка:', error.message);
        alert(`Неизвестная ошибка: ${error.message}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="container mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Создание заказа</h1>
          <p className="text-lg text-muted-foreground">
            Создайте новый заказ для клиента
          </p>
        </div>

        {/* Основная сетка: форма и информация о мастерах */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Форма создания заказа */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Создание заказа
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-6">
            {/* Основная информация о заказе */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="client_name">Имя клиента *</Label>
                <Input
                  id="client_name"
                  placeholder="Введите имя клиента"
                  value={formData.client_name}
                  onChange={(e) => handleFieldChange('client_name', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="client_phone">Телефон клиента *</Label>
                <Input
                  id="client_phone"
                  placeholder="+7 (xxx) xxx-xx-xx"
                  value={formData.client_phone}
                  onChange={(e) => handleFieldChange('client_phone', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="street_address">Адрес: улица, район, дом *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    id="street"
                    placeholder="Улица, район"
                    value={formData.street}
                    onChange={(e) => handleFieldChange('street', e.target.value)}
                  />
                  <Input
                    id="house_number"
                    placeholder="Номер дома"
                    value={formData.house_number}
                    onChange={(e) => handleFieldChange('house_number', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apartment_entrance">Подъезд, квартира</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    id="entrance"
                    placeholder="Подъезд"
                    value={formData.entrance}
                    onChange={(e) => handleFieldChange('entrance', e.target.value)}
                  />
                  <Input
                    id="apartment"
                    placeholder="Квартира"
                    value={formData.apartment}
                    onChange={(e) => handleFieldChange('apartment', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="service_type">Тип услуги *</Label>
                <Select
                  value={formData.service_type}
                  onValueChange={(value) => handleFieldChange('service_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип услуги" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ремонт">Ремонт</SelectItem>
                    <SelectItem value="установка">Установка</SelectItem>
                    <SelectItem value="обслуживание">Обслуживание</SelectItem>
                    <SelectItem value="диагностика">Диагностика</SelectItem>
                    <SelectItem value="консультация">Консультация</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipment_type">Тип оборудования *</Label>
                <Input
                  id="equipment_type"
                  placeholder="Введите тип оборудования"
                  value={formData.equipment_type}
                  onChange={(e) => handleFieldChange('equipment_type', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Цена *</Label>
              <Input
                id="price"
                type="number"
                placeholder="Введите цену"
                value={formData.price}
                onChange={(e) => handleFieldChange('price', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="promotion">Акции</Label>
                <Input
                  id="promotion"
                  placeholder="Введите акции или скидки"
                  value={formData.promotion}
                  onChange={(e) => handleFieldChange('promotion', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Срок исполнения *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Выберите дату"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start">
                    <Calendar 
                      mode="single" 
                      selected={selectedDate} 
                      onSelect={(date) => {
                        setSelectedDate(date);
                        if (date) {
                          handleFieldChange('due_date', format(date, "yyyy-MM-dd"));
                        }
                      }} 
                      initialFocus 
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="estimated_cost">Предварительная стоимость</Label>
                <Input
                  id="estimated_cost"
                  type="number"
                  placeholder="Авто-расчет"
                  value={formData.estimated_cost}
                  onChange={(e) => handleFieldChange('estimated_cost', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="final_cost">Итоговая стоимость</Label>
                <Input
                  id="final_cost"
                  type="number"
                  placeholder="Авто-расчет"
                  value={formData.final_cost}
                  onChange={(e) => handleFieldChange('final_cost', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expenses">Расходы</Label>
                <Input
                  id="expenses"
                  type="number"
                  placeholder="Авто-расчет"
                  value={formData.expenses}
                  onChange={(e) => handleFieldChange('expenses', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Дополнительная информация о заказе */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Планирование и дополнительная информация
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Дата выполнения</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.scheduled_date ? format(new Date(formData.scheduled_date), "PPP") : "Выберите дату"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start">
                      <Calendar 
                        mode="single"
                        selected={formData.scheduled_date ? new Date(formData.scheduled_date) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            handleFieldChange('scheduled_date', format(date, "yyyy-MM-dd"));
                          }
                        }}
                        initialFocus 
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduled_time">Время выполнения</Label>
                  <Input
                    id="scheduled_time"
                    type="time"
                    value={formData.scheduled_time}
                    onChange={(e) => handleFieldChange('scheduled_time', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">
                  <FileText className="h-4 w-4 inline mr-2" />
                  Дополнительные заметки
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Особые требования, дополнительная информация..."
                  value={formData.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  className="min-h-20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание заказа</Label>
              <Textarea
                id="description"
                placeholder="Подробное описание заказа..."
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                className="min-h-24"
              />
            </div>

            {/* Кнопки действий */}
            <div className="flex gap-4 pt-6">
              <Button
                onClick={submitForm}
                disabled={submitting || !formData.client_name || !formData.client_phone || !formData.street || !formData.house_number || !formData.service_type || !formData.equipment_type || !formData.price || !formData.due_date}
                className="flex-1"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Создание...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Создать заказ
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setFormData({
                    client_name: '',
                    client_phone: '',
                    street: '',
                    house_number: '',
                    apartment: '',
                    entrance: '',
                    service_type: '',
                    description: '',
                    equipment_type: '',
                    price: 0,
                    promotion: '',
                    due_date: '',
                    estimated_cost: 0,
                    final_cost: 0,
                    expenses: 0,
                    scheduled_date: '',
                    scheduled_time: '',
                    notes: '',
                  });
                  setSelectedDate(undefined);
                }}
              >
                Очистить форму
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Информация о нагрузке мастеров */}
      <div className="lg:col-span-1">
        <CapacityAnalysis />
      </div>
    </div>
  </div>
</div>
  );
};

export default UnifiedOrderCreation;
