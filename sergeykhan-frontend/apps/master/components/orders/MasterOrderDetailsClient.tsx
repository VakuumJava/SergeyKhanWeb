"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Order } from "@shared/constants/orders";
import { API } from "@shared/constants/constants";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@workspace/ui/components/table";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { ArrowLeft, User, Phone, MapPin, FileText, DollarSign, Calendar } from "lucide-react";

interface Props {
  id: string;
}

export default function MasterOrderDetailsClient({ id }: Props) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [takingOrder, setTakingOrder] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Неавторизованный");
      setLoading(false);
      return;
    }

    Promise.all([
      fetch(`${API}/api/orders/${id}/detail/`, {
        headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
      }).then(async (res) => {
        if (!res.ok) throw new Error("Не удалось загрузить заказ");
        return (await res.json()) as Order;
      }),
      fetch(`${API}/api/user/`, {
        headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
      }).then(async (res) => {
        if (!res.ok) throw new Error("Не удалось загрузить данные пользователя");
        return (await res.json()) as { id: number; role: string };
      }),
    ])
      .then(([orderData, userData]) => {
        setOrder(orderData);
        setCurrentUserId(userData.id);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleTakeOrder = async () => {
    if (!order || !currentUserId) return;
    
    // Add debugging to understand current order state
    console.log("Current order state:", {
      id: order.id,
      status: order.status,
      assigned_master: order.assigned_master,
      currentUserId: currentUserId
    });
    
    setTakingOrder(true);
    const token = localStorage.getItem("token");
    
    try {
      const res = await fetch(`${API}/assign/${order.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ 
          assigned_master: currentUserId
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = "Не удалось взять заказ";
        
        console.log("API Response Status:", res.status);
        console.log("API Response Text:", errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error || errorData.detail) {
            errorMessage = errorData.error || errorData.detail;
          }
          console.log("Parsed Error Data:", errorData);
          
          // Handle specific backend error messages
          if (errorMessage.includes("not found or not in processing state")) {
            errorMessage = "Заказ должен быть в статусе 'в обработке' для назначения мастера. Текущий статус: " + order.status;
          } else if (errorMessage.includes("already assigned")) {
            errorMessage = "Заказ уже назначен другому мастеру.";
          }
        } catch {
          console.error("HTTP Error:", res.status, errorText);
          if (res.status === 400) {
            errorMessage = "Заказ недоступен для взятия. Проверьте статус заказа.";
          } else if (res.status === 401) {
            errorMessage = "Необходима авторизация";
          } else if (res.status === 403) {
            errorMessage = "Недостаточно прав для выполнения действия";
          } else if (res.status === 404) {
            errorMessage = "Заказ не найден";
          } else if (res.status >= 500) {
            errorMessage = "Ошибка сервера";
          }
        }
        
        throw new Error(errorMessage);
      }

      // API успешно ответил (включая пустой объект {}), обновляем данные заказа с сервера
      try {
        const updatedOrderRes = await fetch(`${API}/api/orders/${order.id}/detail/`, {
          headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
        });
        
        if (updatedOrderRes.ok) {
          const updatedOrderData = await updatedOrderRes.json() as Order;
          setOrder(updatedOrderData);
        } else {
          // Fallback: обновляем локальное состояние
          const updatedOrder = { 
            ...order, 
            assigned_master: currentUserId.toString(),
            status: 'назначен'
          };
          setOrder(updatedOrder);
        }
      } catch (fetchError) {
        // Fallback: обновляем локальное состояние
        console.warn("Could not fetch updated order data:", fetchError);
        const updatedOrder = { 
          ...order, 
          assigned_master: currentUserId.toString(),
          status: 'назначен'
        };
        setOrder(updatedOrder);
      }
      
      // Показать уведомление об успехе
      alert("Заказ успешно взят!");
      
      // Перенаправить на страницу взятых заказов
      router.push("/orders-taken");
    } catch (e) {
      console.error("Error taking order:", e);
      const errorMessage = e instanceof Error ? e.message : "Неизвестная ошибка";
      alert(`Ошибка при взятии заказа: ${errorMessage}`);
      
      // Refresh order data to get current status
      try {
        const refreshRes = await fetch(`${API}/api/orders/${order.id}/detail/`, {
          headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
        });
        
        if (refreshRes.ok) {
          const refreshedOrder = await refreshRes.json() as Order;
          setOrder(refreshedOrder);
        }
      } catch (refreshError) {
        console.warn("Could not refresh order data:", refreshError);
      }
    } finally {
      setTakingOrder(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ru-RU') + '₸';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Загрузка заказа...</p>
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
              <span>⚠️</span>
              <span>Ошибка: {error}</span>
            </div>
            <Button 
              onClick={() => router.back()} 
              variant="outline" 
              className="mt-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) return null;

  const isOrderAvailable = !order.assigned_master && 
    (order.status === 'новый' || order.status === 'в обработке');
  const isMyOrder = order.assigned_master === currentUserId?.toString();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => router.back()} 
            variant="outline" 
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            Заказ #{order.id}
          </h1>
        </div>
        <Badge 
          variant={
            order.status === 'новый' ? 'default' : 
            order.status === 'в обработке' ? 'secondary' : 
            order.status === 'назначен' ? 'outline' :
            'destructive'
          }
          className={`text-sm ${
            order.status === 'новый' ? 'bg-blue-600 hover:bg-blue-700' : 
            order.status === 'в обработке' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 
            order.status === 'назначен' ? 'bg-green-600 hover:bg-green-700 text-white' :
            'text-muted-foreground'
          }`}
        >
          {order.status}
        </Badge>
      </div>

      {/* Order Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Детали заказа
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Client Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Клиент</p>
                  <p className="text-lg font-semibold">{order.client_name}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Телефон</p>
                  <p className="text-lg font-semibold text-muted-foreground italic">
                    <span className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <line x1="2" y1="2" x2="22" y2="22"></line>
                        <path d="M16.5 16.5C15.5 17.3 14.1 17.9 12.7 17.9C12.4 17.9 12.1 17.9 11.8 17.8C10 17.5 8.3 16.5 7 15.2C5.5 13.7 4.5 11.7 4.2 9.8C4.1 9.3 4 8.7 4 8.2C4.1 6.8 4.8 5.5 5.6 4.5"></path>
                        <path d="M18 6C18.9 7 19.5 8.2 19.6 9.5C19.6 9.9 19.6 10.3 19.5 10.7"></path>
                        <path d="M15.5 3.3C16.4 3.5 17.2 3.9 17.9 4.3"></path>
                        <path d="M12.2 3C12.6 3 13 3 13.4 3.1"></path>
                      </svg>
                      Скрыто для мастеров
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Адрес</p>
                  <p className="text-lg font-semibold">{order.address || 'Не указан'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Дата создания</p>
                  <p className="text-lg font-semibold">{formatDate(order.created_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Описание работ</p>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-base">{order.description}</p>
            </div>
          </div>

          {/* Cost */}
          {order.final_cost && (
            <div className="flex items-center gap-3 p-4  rounded-lg border border-green-200">
              <DollarSign className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">Стоимость заказа</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(order.final_cost)}
                </p>
              </div>
            </div>
          )}

          {/* Master Assignment Info */}
          {order.assigned_master && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-800">Назначен мастер</p>
              <p className="text-lg font-semibold text-blue-600">
                {isMyOrder ? "Вы" : `Мастер ID: ${order.assigned_master}`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {isOrderAvailable && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-lg font-medium">
                Этот заказ доступен для взятия
              </p>
              <Button 
                size="lg"
                disabled={takingOrder}
                onClick={handleTakeOrder}
                className="min-w-[200px]"
              >
                {takingOrder ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Обработка...
                  </div>
                ) : (
                  "Взять заказ"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isMyOrder && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-lg font-medium text-green-600">
                ✅ Этот заказ назначен на вас
              </p>
              <p className="text-muted-foreground">
                Вы можете найти его во вкладке "Взятые заказы"
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


