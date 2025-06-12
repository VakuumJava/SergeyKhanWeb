"use client";

import React, { useState } from 'react';
import { Button } from "@workspace/ui/components/ui";
import { Input } from "@workspace/ui/components/ui";
import { Label } from "@workspace/ui/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/ui";
import { Textarea } from "@workspace/ui/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/ui";
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/ui";
import { Calendar } from "@workspace/ui/components/ui";
import { UserPlus, CalendarIcon, Clock, AlertCircle, CreditCard, FileText } from 'lucide-react';
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
  age: number;
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
  priority: string;
  payment_method: string;
  notes: string;
}

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
    age: 0,
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
    priority: 'обычный',
    payment_method: 'наличные',
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
        age: formData.age,
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
        priority: formData.priority,
        payment_method: formData.payment_method,
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
        age: 0,
        equipment_type: '',
        price: 0,
        promotion: '',
        due_date: '',
        estimated_cost: 0,
        final_cost: 0,
        expenses: 0,
        scheduled_date: '',
        scheduled_time: '',
        priority: 'обычный',
        payment_method: 'наличные',
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
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Создание заказа</h1>
          <p className="text-lg text-muted-foreground">
            Создайте новый заказ для клиента
          </p>
        </div>

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
                <Label htmlFor="age">Возраст *</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Введите возраст"
                  value={formData.age}
                  onChange={(e) => handleFieldChange('age', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="equipment_type">Тип оборудования *</Label>
                <Input
                  id="equipment_type"
                  placeholder="Введите тип оборудования"
                  value={formData.equipment_type}
                  onChange={(e) => handleFieldChange('equipment_type', e.target.value)}
                />
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="priority">
                    <AlertCircle className="h-4 w-4 inline mr-2" />
                    Приоритет заказа
                  </Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => handleFieldChange('priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите приоритет" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="низкий">Низкий</SelectItem>
                      <SelectItem value="обычный">Обычный</SelectItem>
                      <SelectItem value="высокий">Высокий</SelectItem>
                      <SelectItem value="срочный">Срочный</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_method">
                    <CreditCard className="h-4 w-4 inline mr-2" />
                    Способ оплаты
                  </Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) => handleFieldChange('payment_method', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите способ оплаты" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="наличные">Наличные</SelectItem>
                      <SelectItem value="карта">Банковская карта</SelectItem>
                      <SelectItem value="перевод">Банковский перевод</SelectItem>
                      <SelectItem value="элсом">Элсом</SelectItem>
                      <SelectItem value="mbанк">МБанк</SelectItem>
                    </SelectContent>
                  </Select>
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
                    age: 0,
                    equipment_type: '',
                    price: 0,
                    promotion: '',
                    due_date: '',
                    estimated_cost: 0,
                    final_cost: 0,
                    expenses: 0,
                    scheduled_date: '',
                    scheduled_time: '',
                    priority: 'обычный',
                    payment_method: 'наличные',
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
    </div>
  );
};

export default UnifiedOrderCreation;
