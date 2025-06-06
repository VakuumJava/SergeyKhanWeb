"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { API } from "@shared/constants/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { Label } from "@workspace/ui/components/label";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Upload, Calculator, DollarSign, Camera, FileText } from "lucide-react";

interface Props {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface CompletionFormData {
  work_description: string;
  parts_cost: string;
  transport_cost: string;
  received_amount: string;
  completion_date: string;
  work_photos: File[];
}

export default function OrderCompletionForm({ orderId, isOpen, onClose, onSuccess }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<CompletionFormData>({
    work_description: "",
    parts_cost: "0",
    transport_cost: "0",
    received_amount: "0",
    completion_date: new Date().toISOString().split('T')[0] || new Date().toISOString().substring(0, 10),
    work_photos: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Расчет финансовых показателей
  const partsCost = parseFloat(formData.parts_cost) || 0;
  const transportCost = parseFloat(formData.transport_cost) || 0;
  const receivedAmount = parseFloat(formData.received_amount) || 0;
  const totalExpenses = partsCost + transportCost;
  const netProfit = receivedAmount - totalExpenses;

  const handleInputChange = (field: keyof CompletionFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleFileChange called', e.target.files);
    const files = Array.from(e.target.files || []);
    if (files.length > 5) {
      alert("Можно загрузить максимум 5 фотографий");
      return;
    }

    // Проверяем размер файлов (максимум 5MB каждый)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      alert("Размер каждого файла не должен превышать 5MB");
      return;
    }

    setFormData(prev => ({ ...prev, work_photos: files }));

    // Создаем preview для изображений
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(newPreviewUrls);
  };

  const removePhoto = (index: number) => {
    const newFiles = formData.work_photos.filter((_, i) => i !== index);
    const newPreviews = previewUrls.filter((_, i) => i !== index);
    
    // Очищаем старые URL
    const urlToRevoke = previewUrls[index];
    if (urlToRevoke) {
      URL.revokeObjectURL(urlToRevoke);
    }
    
    setFormData(prev => ({ ...prev, work_photos: newFiles }));
    setPreviewUrls(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.work_description.trim()) {
      alert("Пожалуйста, укажите описание выполненной работы");
      return;
    }

    if (receivedAmount <= 0) {
      alert("Пожалуйста, укажите полученную сумму");
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem("token");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("order", orderId);
      formDataToSend.append("work_description", formData.work_description);
      formDataToSend.append("parts_expenses", formData.parts_cost);
      formDataToSend.append("transport_costs", formData.transport_cost);
      formDataToSend.append("total_received", formData.received_amount);
      
      // Преобразуем дату в правильный формат для Django (ISO 8601)
      const completionDate = new Date(formData.completion_date);
      formDataToSend.append("completion_date", completionDate.toISOString());

      // Добавляем фотографии
      formData.work_photos.forEach((file, index) => {
        formDataToSend.append(`completion_photos`, file);
      });

      console.log("FormData being sent:");
      for (let pair of formDataToSend.entries()) {
        console.log(pair[0] + ': ' + (pair[1] instanceof File ? `File(${pair[1].name})` : pair[1]));
      }

      const response = await fetch(`${API}/api/orders/${orderId}/complete/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server response:", response.status, errorText);
        
        let errorMessage = "Ошибка при завершении заказа";
        try {
          const errorData = JSON.parse(errorText);
          console.error("Parsed error data:", errorData);
          errorMessage = errorData.detail || errorData.error || JSON.stringify(errorData);
        } catch (e) {
          console.error("Could not parse error as JSON:", e);
          errorMessage = errorText;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      alert("Заказ успешно отправлен на подтверждение!");
      
      // Очищаем preview URLs
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      
      onClose();
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/orders-taken");
      }
    } catch (error) {
      console.error("Error completing order:", error);
      alert(`Ошибка: ${error instanceof Error ? error.message : "Неизвестная ошибка"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ru-RU') + '₸';
  };

  // Очищаем URLs при размонтировании компонента
  React.useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Завершение заказа #{orderId}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Описание работы */}
          <div className="space-y-2">
            <Label htmlFor="work_description">Описание выполненной работы *</Label>
            <Textarea
              id="work_description"
              placeholder="Подробно опишите выполненные работы..."
              value={formData.work_description}
              onChange={(e) => handleInputChange("work_description", e.target.value)}
              rows={4}
              required
            />
          </div>

          {/* Фотографии работ */}
          <div className="space-y-2">
            <Label>Фотографии выполненной работы</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Camera className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Загрузите фотографии работ
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    PNG, JPG до 5MB каждая. Максимум 5 фотографий.
                  </span>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="mt-3"
                    onClick={() => {
                      console.log('Button clicked, trying to trigger file input');
                      console.log('File input ref:', fileInputRef.current);
                      if (fileInputRef.current) {
                        fileInputRef.current.click();
                        console.log('File input clicked via ref');
                      } else {
                        console.error('File input ref is null');
                      }
                    }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Выбрать файлы
                  </Button>
                </div>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Превью фотографий */}
            {previewUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Фото работы ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Финансовые данные */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Финансовые данные
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parts_cost">Расходы на детали (₸)</Label>
                  <Input
                    id="parts_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.parts_cost}
                    onChange={(e) => handleInputChange("parts_cost", e.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transport_cost">Транспортные расходы (₸)</Label>
                  <Input
                    id="transport_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.transport_cost}
                    onChange={(e) => handleInputChange("transport_cost", e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="received_amount">Полученная сумма (₸) *</Label>
                <Input
                  id="received_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.received_amount}
                  onChange={(e) => handleInputChange("received_amount", e.target.value)}
                  placeholder="0"
                  required
                />
              </div>

              {/* Автоматические расчёты */}
              <div className="border p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Общие расходы:</span>
                  <span className="font-medium">{formatCurrency(totalExpenses)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold">
                  <span>Чистая прибыль:</span>
                  <span className={netProfit >= 0 ? "text-green-600" : "text-red-600"}>
                    {formatCurrency(netProfit)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Дата завершения */}
          <div className="space-y-2">
            <Label htmlFor="completion_date">Дата завершения работ</Label>
            <Input
              id="completion_date"
              type="date"
              value={formData.completion_date}
              onChange={(e) => handleInputChange("completion_date", e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Отправка...
                </div>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Завершить заказ
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
