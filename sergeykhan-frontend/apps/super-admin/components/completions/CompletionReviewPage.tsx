"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API } from "@shared/constants/constants";
import { Button } from "@workspace/ui/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/ui";
import { Badge } from "@workspace/ui/components/ui";
import { Textarea } from "@workspace/ui/components/ui";
import { Label } from "@workspace/ui/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@workspace/ui/components/ui";
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
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!completion) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">Завершение заказа не найдено</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { totalExpenses, netProfit } = calculateFinancials();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            Проверка завершения заказа #{completion.order.id}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={
              completion.status === 'ожидает_проверки' ? 'secondary' :
              completion.status === 'одобрен' ? 'default' : 'destructive'
            }>
              {completion.status === 'ожидает_проверки' ? 'Ожидает проверки' :
               completion.status === 'одобрен' ? 'Одобрен' : 'Отклонен'}
            </Badge>
            <span className="text-muted-foreground text-sm">
              Подано: {formatDate(completion.submitted_at)}
            </span>
          </div>
        </div>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Номер заказа</Label>
                <p className="font-medium">#{completion.order.id}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Статус заказа</Label>
                <p className="font-medium">{completion.order.status}</p>
              </div>
            </div>
            
            <div>
              <Label className="text-muted-foreground">Описание</Label>
              <p className="font-medium">{completion.order.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label className="text-muted-foreground">Клиент</Label>
                <p className="font-medium">{completion.order.client_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label className="text-muted-foreground">Телефон</Label>
                <p className="font-medium">{completion.order.client_phone}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label className="text-muted-foreground">Адрес</Label>
                <p className="font-medium">{completion.order.address}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label className="text-muted-foreground">Создан</Label>
                <p className="font-medium">{formatDate(completion.order.created_at)}</p>
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
              <Label className="text-muted-foreground">Мастер</Label>
              <p className="font-medium">{completion.master.full_name}</p>
            </div>

            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p className="font-medium">{completion.master.email}</p>
            </div>

            {completion.master.phone && (
              <div>
                <Label className="text-muted-foreground">Телефон</Label>
                <p className="font-medium">{completion.master.phone}</p>
              </div>
            )}

            <div>
              <Label className="text-muted-foreground">Дата завершения</Label>
              <p className="font-medium">{formatDate(completion.completion_date)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Work Description */}
      <Card>
        <CardHeader>
          <CardTitle>Описание выполненных работ</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{completion.work_description}</p>
        </CardContent>
      </Card>

      {/* Financial Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Финансовая информация
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg">
              <Label className="text-muted-foreground">Получено от клиента</Label>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(completion.total_received)}
              </p>
            </div>

            <div className="p-4 bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 rounded-lg">
              <Label className="text-muted-foreground">Расходы на запчасти</Label>
              <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                {formatCurrency(completion.parts_expenses)}
              </p>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg">
              <Label className="text-muted-foreground">Транспортные расходы</Label>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(completion.transport_costs)}
              </p>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 rounded-lg">
              <Label className="text-muted-foreground">Чистая прибыль</Label>
              <p className={`text-xl font-bold ${
                netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(netProfit)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photos */}
      {completion.completion_photos && completion.completion_photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Фотографии завершения ({completion.completion_photos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {completion.completion_photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photo}
                    alt={`Фото завершения ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => window.open(photo, '_blank')}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const nextEl = e.currentTarget.nextElementSibling as HTMLElement;
                      if (nextEl) {
                        nextEl.classList.remove('hidden');
                        nextEl.classList.add('flex');
                      }
                    }}
                  />
                  <div className="hidden w-full h-32 border border-dashed border-muted rounded-lg items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Camera className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">Не удалось загрузить</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Notes */}
      {completion.curator_notes && (
        <Card>
          <CardHeader>
            <CardTitle>Комментарии куратора</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{completion.curator_notes}</p>
            {completion.review_date && (
              <p className="text-sm text-muted-foreground mt-2">
                Проверено: {formatDate(completion.review_date)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {completion.status === 'ожидает_проверки' && (
        <div className="flex gap-4 justify-end">
          <Button
            variant="outline"
            onClick={() => setShowRejectDialog(true)}
            className="flex items-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            Отклонить
          </Button>
          <Button
            onClick={() => setShowApproveDialog(true)}
            className="flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Одобрить
          </Button>
        </div>
      )}

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Одобрить завершение заказа</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Вы уверены, что хотите одобрить завершение заказа #{completion.order.id}?
            </p>
            <div className="p-4 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg">
              <h4 className="font-medium mb-2 text-green-800 dark:text-green-300">Будет распределено:</h4>
              <ul className="text-sm space-y-1 text-green-700 dark:text-green-400">
                <li>• Чистая прибыль: {formatCurrency(netProfit)}</li>
                <li>• Средства будут автоматически распределены между участниками</li>
              </ul>
            </div>
            <div>
              <Label htmlFor="approve-comment">Комментарий (необязательно)</Label>
              <Textarea
                id="approve-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Добавьте комментарий к одобрению..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button
              onClick={() => handleReview('approve')}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                  Обработка...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Одобрить
                </>
              )}
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
            <p>
              Вы уверены, что хотите отклонить завершение заказа #{completion.order.id}?
            </p>
            <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg">
              <h4 className="font-medium mb-2 text-red-800 dark:text-red-300">Последствия отклонения:</h4>
              <ul className="text-sm space-y-1 text-red-700 dark:text-red-400">
                <li>• Заказ вернется в статус "в работе"</li>
                <li>• Мастер получит уведомление о необходимости доработки</li>
              </ul>
            </div>
            <div>
              <Label htmlFor="reject-comment">Причина отклонения *</Label>
              <Textarea
                id="reject-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Укажите причину отклонения..."
                className="mt-1"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleReview('reject')}
              disabled={isSubmitting || !comment.trim()}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                  Обработка...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Отклонить
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
