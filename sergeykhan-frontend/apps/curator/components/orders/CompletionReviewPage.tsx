"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API } from "@shared/constants/constants";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Textarea } from "@workspace/ui/components/textarea";
import { Label } from "@workspace/ui/components/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@workspace/ui/components/dialog";
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  User, 
  Phone, 
  MapPin, 
  FileText, 
  DollarSign, 
  Calendar,
  Camera,
  AlertCircle,
  Clock
} from "lucide-react";

interface Props {
  completionId: string;
}

interface OrderCompletion {
  id: number;
  order: {
    id: number;
    client_name: string;
    client_phone: string;
    address: string;
    description: string;
    final_cost: string;
    created_at: string;
    status: string;
  };
  master: {
    id: number;
    full_name: string;
    email: string;
    phone?: string;
  };
  work_description: string;
  parts_expenses: string;
  transport_costs: string;
  total_received: string;
  completion_date: string;
  status: 'ожидает_проверки' | 'одобрен' | 'отклонен';
  submitted_at: string;
  completion_photos: string[];
  curator_notes?: string;
  review_date?: string;
  created_at: string;
  updated_at: string;
}

export default function CompletionReviewPage({ completionId }: Props) {
  const router = useRouter();
  const [completion, setCompletion] = useState<OrderCompletion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCompletion();
  }, [completionId]);

  const fetchCompletion = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Неавторизованный");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API}/api/completions/${completionId}/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Не удалось загрузить завершение заказа");
      }

      const data = await response.json();
      setCompletion(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (action: 'approve' | 'reject') => {
    if (!completion) return;
    
    setIsSubmitting(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API}/api/completions/${completionId}/review/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          action,
          comment: comment.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.error || "Ошибка при обработке запроса");
      }

      const result = await response.json();
      
      if (action === 'approve') {
        alert(`Завершение заказа одобрено! Средства распределены:\n- Мастеру: ${result.master_payment}₸\n- Куратору: ${result.curator_payment}₸\n- Компании: ${result.company_payment}₸`);
      } else {
        alert("Завершение заказа отклонено. Заказ возвращен в работу.");
      }
      
      router.push("/completions");
    } catch (error) {
      console.error("Error reviewing completion:", error);
      alert(`Ошибка: ${error instanceof Error ? error.message : "Неизвестная ошибка"}`);
    } finally {
      setIsSubmitting(false);
      setShowApproveDialog(false);
      setShowRejectDialog(false);
      setComment("");
    }
  };

  const formatCurrency = (amount: string | number | undefined) => {
    if (amount === undefined || amount === null) return '0₸';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toLocaleString('ru-RU') + '₸';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateFinancials = () => {
    if (!completion) return { totalExpenses: 0, netProfit: 0 };
    
    const received = parseFloat(completion.total_received) || 0;
    const parts = parseFloat(completion.parts_expenses) || 0;
    const transport = parseFloat(completion.transport_costs) || 0;
    const totalExpenses = parts + transport;
    const netProfit = received - totalExpenses;
    
    return { totalExpenses, netProfit };
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Загрузка завершения заказа...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <span>Ошибка: {error}</span>
            </div>
            <Button onClick={() => router.back()} variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!completion) return null;

  const { totalExpenses, netProfit } = calculateFinancials();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.back()} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Завершение заказа #{completion.order.id}
            </h1>
            <p className="text-muted-foreground">
              Проверка работы мастера {completion.master.full_name}
            </p>
          </div>
        </div>
        <Badge 
          variant={
            completion.status === 'ожидает_проверки' ? 'secondary' :
            completion.status === 'одобрен' ? 'default' : 'destructive'
          }
          className="flex items-center gap-2"
        >
          {completion.status === 'ожидает_проверки' && <Clock className="w-4 h-4" />}
          {completion.status === 'одобрен' && <CheckCircle className="w-4 h-4" />}
          {completion.status === 'отклонен' && <XCircle className="w-4 h-4" />}
          {completion.status === 'ожидает_проверки' ? 'Ожидает проверки' :
           completion.status === 'одобрен' ? 'Одобрено' : 'Отклонено'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Информация о заказе
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Клиент</p>
                <p className="text-lg font-semibold">{completion.order.client_name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Телефон</p>
                <p className="text-lg font-semibold">{completion.order.client_phone}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Адрес</p>
                <p className="text-lg font-semibold">{completion.order.address}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Описание заказа</p>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-base">{completion.order.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">Стоимость заказа</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(completion.order.final_cost)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Master Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Информация о мастере
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Имя</p>
              <p className="text-lg font-semibold">{completion.master.full_name}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-lg font-semibold">{completion.master.email}</p>
            </div>

            {completion.master.phone && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Телефон</p>
                <p className="text-lg font-semibold">{completion.master.phone}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-muted-foreground">Дата завершения</p>
              <p className="text-lg font-semibold">{formatDate(completion.completion_date)}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Дата подачи</p>
              <p className="text-lg font-semibold">{formatDate(completion.submitted_at)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Work Description */}
      <Card>
        <CardHeader>
          <CardTitle>Описание выполненной работы</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-base whitespace-pre-wrap">{completion.work_description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Work Photos */}
      {completion.completion_photos && completion.completion_photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Фотографии работ ({completion.completion_photos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {completion.completion_photos.map((photo, index) => (
                <div key={index} className="relative">
                  <img
                    src={`${API}${photo}`}
                    alt={`Фото работы ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => window.open(`${API}${photo}`, '_blank')}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Финансовая сводка
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-800">Получено</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(completion.total_received)}
              </p>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-sm font-medium text-orange-800">Расходы на детали</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(completion.parts_expenses)}
              </p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm font-medium text-purple-800">Транспорт</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(completion.transport_costs)}
              </p>
            </div>

            <div className={`p-4 rounded-lg border ${
              netProfit >= 0 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <p className={`text-sm font-medium ${
                netProfit >= 0 ? 'text-green-800' : 'text-red-800'
              }`}>
                Чистая прибыль
              </p>
              <p className={`text-2xl font-bold ${
                netProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(netProfit)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {completion.status === 'ожидает_проверки' && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center gap-4">
              <Button
                size="lg"
                variant="destructive"
                onClick={() => setShowRejectDialog(true)}
                className="min-w-[150px]"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Отклонить
              </Button>
              <Button
                size="lg"
                onClick={() => setShowApproveDialog(true)}
                className="min-w-[150px] bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Одобрить
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Information for non-pending completions */}
      {completion.status !== 'ожидает_проверки' && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <div className={`text-lg font-medium ${
                completion.status === 'одобрен' ? 'text-green-600' : 'text-red-600'
              }`}>
                {completion.status === 'одобрен' ? '✅ Завершение одобрено' : '❌ Завершение отклонено'}
              </div>
              {completion.review_date && (
                <p className="text-muted-foreground">
                  Обработано: {formatDate(completion.review_date)}
                </p>
              )}
              {completion.curator_notes && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground">Комментарий куратора:</p>
                  <p className="text-base">{completion.curator_notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Одобрить завершение заказа</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Вы уверены, что хотите одобрить завершение этого заказа?</p>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                После одобрения средства будут автоматически распределены между мастером, куратором и компанией.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="approve-comment">Комментарий (необязательно)</Label>
              <Textarea
                id="approve-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Добавьте комментарий к одобрению..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApproveDialog(false);
                setComment("");
              }}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button
              onClick={() => handleReview('approve')}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "Обработка..." : "Одобрить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отклонить завершение заказа</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Вы уверены, что хотите отклонить завершение этого заказа?</p>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-800">
                После отклонения заказ вернется в работу, мастер сможет исправить проблемы и подать завершение заново.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reject-comment">Причина отклонения *</Label>
              <Textarea
                id="reject-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Укажите причину отклонения завершения..."
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setComment("");
              }}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleReview('reject')}
              disabled={isSubmitting || !comment.trim()}
            >
              {isSubmitting ? "Обработка..." : "Отклонить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
