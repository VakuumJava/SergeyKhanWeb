"use client";

import React, { useState } from "react";
import { Button } from "@workspace/ui/components/ui";
import { Input } from "@workspace/ui/components/ui";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@workspace/ui/components/ui";
import { Label } from "@workspace/ui/components/label";
import { Order } from "@shared/constants/orders";
import { API } from "@shared/constants/constants";

interface CompleteOrderDialogProps {
  order: Order;
  onOrderCompleted: (completedOrder: Order) => void;
}

interface CompletionData {
  beforePhoto: File | null;
  afterPhoto: File | null;
  workDescription: string;
  partsCost: number;
  transportCost: number;
  totalReceived: number;
  clientArrivalDate: string;
  clientArrivalTime: string;
}

export default function CompleteOrderDialog({ order, onOrderCompleted }: CompleteOrderDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CompletionData>({
    beforePhoto: null,
    afterPhoto: null,
    workDescription: "",
    partsCost: 0,
    transportCost: 0,
    totalReceived: 0,
    clientArrivalDate: "",
    clientArrivalTime: "",
  });

  const totalExpenses = formData.partsCost + formData.transportCost;
  const netProfit = formData.totalReceived - totalExpenses;

  const handleFileChange = (field: 'beforePhoto' | 'afterPhoto') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async () => {
    if (!formData.workDescription.trim()) {
      alert("Пожалуйста, заполните описание проделанной работы");
      return;
    }

    if (!formData.clientArrivalDate || !formData.clientArrivalTime) {
      alert("Пожалуйста, укажите дату и время приезда клиента");
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem("token");

    try {
      const formDataToSend = new FormData();
      
      // Добавляем файлы если они есть
      if (formData.beforePhoto) {
        formDataToSend.append("before_photo", formData.beforePhoto);
      }
      if (formData.afterPhoto) {
        formDataToSend.append("after_photo", formData.afterPhoto);
      }

      // Добавляем текстовые данные
      formDataToSend.append("work_description", formData.workDescription);
      formDataToSend.append("parts_cost", formData.partsCost.toString());
      formDataToSend.append("transport_cost", formData.transportCost.toString());
      formDataToSend.append("total_received", formData.totalReceived.toString());
      formDataToSend.append("net_profit", netProfit.toString());
      formDataToSend.append("client_arrival_datetime", `${formData.clientArrivalDate}T${formData.clientArrivalTime}`);
      formDataToSend.append("status", "завершен");

      const response = await fetch(`${API}/orders/${order.id}/complete/`, {
        method: "PATCH",
        headers: {
          Authorization: `Token ${token}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error("Ошибка при завершении заказа");
      }

      const completedOrder = await response.json();
      onOrderCompleted(completedOrder);
      setIsOpen(false);
      
      // Сброс формы
      setFormData({
        beforePhoto: null,
        afterPhoto: null,
        workDescription: "",
        partsCost: 0,
        transportCost: 0,
        totalReceived: 0,
        clientArrivalDate: "",
        clientArrivalTime: "",
      });

    } catch (error) {
      console.error("Ошибка при завершении заказа:", error);
      alert("Ошибка при завершении заказа. Попробуйте еще раз.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="bg-green-600 hover:bg-green-700">
          Завершить заказ
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Завершение заказа #{order.id}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Фотографии */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="beforePhoto">Фото до ремонта</Label>
              <Input
                id="beforePhoto"
                type="file"
                accept="image/*"
                onChange={handleFileChange('beforePhoto')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="afterPhoto">Фото после ремонта</Label>
              <Input
                id="afterPhoto"
                type="file"
                accept="image/*"
                onChange={handleFileChange('afterPhoto')}
              />
            </div>
          </div>

          {/* Описание работы */}
          <div className="space-y-2">
            <Label htmlFor="workDescription">Описание проделанной работы *</Label>
            <Textarea
              id="workDescription"
              placeholder="Подробно опишите выполненную работу..."
              value={formData.workDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, workDescription: e.target.value }))}
              rows={4}
            />
          </div>

          {/* Финансовые данные */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="partsCost">Расходы на детали (₸)</Label>
              <Input
                id="partsCost"
                type="number"
                min="0"
                step="0.01"
                value={formData.partsCost}
                onChange={(e) => setFormData(prev => ({ ...prev, partsCost: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transportCost">Транспортные расходы (₸)</Label>
              <Input
                id="transportCost"
                type="number"
                min="0"
                step="0.01"
                value={formData.transportCost}
                onChange={(e) => setFormData(prev => ({ ...prev, transportCost: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalReceived">Полная сумма полученная за заказ (₸)</Label>
            <Input
              id="totalReceived"
              type="number"
              min="0"
              step="0.01"
              value={formData.totalReceived}
              onChange={(e) => setFormData(prev => ({ ...prev, totalReceived: parseFloat(e.target.value) || 0 }))}
            />
          </div>

          {/* Расчет чистой прибыли */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Общие расходы:</span>
                <div className="text-red-600">{totalExpenses.toFixed(2)} ₸</div>
              </div>
              <div>
                <span className="font-medium">Получено:</span>
                <div className="text-blue-600">{formData.totalReceived.toFixed(2)} ₸</div>
              </div>
              <div>
                <span className="font-medium">Чистая прибыль:</span>
                <div className={`font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netProfit.toFixed(2)} ₸
                </div>
              </div>
            </div>
          </div>

          {/* Время приезда клиента */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientArrivalDate">Дата приезда клиента *</Label>
              <Input
                id="clientArrivalDate"
                type="date"
                value={formData.clientArrivalDate}
                onChange={(e) => setFormData(prev => ({ ...prev, clientArrivalDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientArrivalTime">Время приезда *</Label>
              <Input
                id="clientArrivalTime"
                type="time"
                value={formData.clientArrivalTime}
                onChange={(e) => setFormData(prev => ({ ...prev, clientArrivalTime: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline" disabled={isLoading}>
              Отмена
            </Button>
          </DialogClose>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? "Завершение..." : "Завершить заказ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
