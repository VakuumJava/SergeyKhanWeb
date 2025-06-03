"use client";

import React, { useState, useEffect } from "react";
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
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Trash2, UserCheck, UserX, AlertTriangle, User, Phone, MapPin, FileText, DollarSign, Calendar } from "lucide-react";
import CompleteOrderDialog from "./CompleteOrderDialog";
import { useRouter } from "next/navigation";

interface Props {
  id: string;
}

interface Master {
  id: number;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  full_name: string;
}

export default function SuperAdminOrderDetailsClient({ id }: Props) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Assign Master Dialog
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [newMasterId, setNewMasterId] = useState("");
  const [masters, setMasters] = useState<Master[]>([]);
  const [mastersLoading, setMastersLoading] = useState(false);

  // Transfer to Warranty Master Dialog
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [warrantyMasterId, setWarrantyMasterId] = useState("");
  const [warrantyMasters, setWarrantyMasters] = useState<Master[]>([]);
  const [warrantyMastersLoading, setWarrantyMastersLoading] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);

  // Delete Order Dialog
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchMasters = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setMastersLoading(true);
    try {
      // Try original endpoint first
      let res = await fetch(`${API}/users/masters/`, {
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Token ${token}` 
        },
      });

      // If that fails, try with /api/ prefix
      if (!res.ok && res.status === 404) {
        res = await fetch(`${API}/api/users/masters/`, {
          headers: { 
            "Content-Type": "application/json", 
            Authorization: `Token ${token}` 
          },
        });
      }

      if (res.ok) {
        const data = await res.json();
        setMasters(data);
      } else {
        console.error("Failed to fetch masters:", res.status, res.statusText);
      }
    } catch (error) {
      console.error("Ошибка при загрузке мастеров:", error);
    } finally {
      setMastersLoading(false);
    }
  };

  const fetchWarrantyMasters = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setWarrantyMastersLoading(true);
    try {
      // Используем правильный endpoint для гарантийных мастеров
      let res = await fetch(`${API}/api/users/warranty-masters/`, {
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Token ${token}` 
        },
      });

      // Если не работает, попробуем без /api/ префикса
      if (!res.ok && res.status === 404) {
        res = await fetch(`${API}/users/warranty-masters/`, {
          headers: { 
            "Content-Type": "application/json", 
            Authorization: `Token ${token}` 
          },
        });
      }

      if (res.ok) {
        const data = await res.json();
        console.log("Warranty masters data:", data); // Для отладки
        setWarrantyMasters(data);
      } else {
        console.error("Failed to fetch warranty masters:", res.status, res.statusText);
        // Попробуем альтернативный endpoint, если основной не работает
        const altRes = await fetch(`${API}/get_warranty_masters/`, {
          headers: { 
            "Content-Type": "application/json", 
            Authorization: `Token ${token}` 
          },
        });
        if (altRes.ok) {
          const altData = await altRes.json();
          setWarrantyMasters(altData);
        }
      }
    } catch (error) {
      console.error("Ошибка при загрузке гарантийных мастеров:", error);
    } finally {
      setWarrantyMastersLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Неавторизованный");
      setLoading(false);
      return;
    }

    fetch(`${API}/api/orders/${id}/detail/`, {
      headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Не удалось загрузить заказ");
        return (await res.json()) as Order;
      })
      .then((orderData) => {
        setOrder(orderData);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAssignSubmit = async () => {
    if (!order || !newMasterId) return;
    const token = localStorage.getItem("token");
    const masterIdNum = parseInt(newMasterId, 10);
    if (isNaN(masterIdNum)) {
      console.warn("Некорректный ID мастера");
      return;
    }

    try {
      // Use the correct endpoint pattern
      const res = await fetch(`${API}/assign/${order.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ assigned_master: masterIdNum }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = "Не удалось назначить мастера";
        
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error || errorData.detail) {
            errorMessage = errorData.error || errorData.detail;
          }
          
          // Handle specific backend error messages
          if (errorMessage.includes("not found or not in processing state")) {
            errorMessage = "Заказ должен быть в статусе 'в обработке' для назначения мастера. Текущий статус: " + order.status;
          } else if (errorMessage.includes("already assigned")) {
            errorMessage = "Заказ уже назначен другому мастеру.";
          }
        } catch {
          if (res.status === 400) {
            errorMessage = "Заказ недоступен для назначения. Проверьте статус заказа.";
          } else if (res.status === 401) {
            errorMessage = "Необходима авторизация";
          } else if (res.status === 403) {
            errorMessage = "Недостаточно прав для выполнения действия";
          } else if (res.status === 404) {
            errorMessage = "Заказ не найден или неверный эндпоинт";
          } else if (res.status >= 500) {
            errorMessage = "Ошибка сервера";
          }
        }
        
        throw new Error(errorMessage);
      }

      // API успешно ответил, обновляем данные заказа с сервера
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
            assigned_master: masterIdNum.toString(),
            status: 'назначен'
          };
          setOrder(updatedOrder);
        }
      } catch (fetchError) {
        // Fallback: обновляем локальное состояние
        console.warn("Could not fetch updated order data:", fetchError);
        const updatedOrder = { 
          ...order, 
          assigned_master: masterIdNum.toString(),
          status: 'назначен'
        };
        setOrder(updatedOrder);
      }

      setIsAssignOpen(false);
      setNewMasterId("");
      alert("Мастер успешно назначен!");
    } catch (e) {
      console.error("Error assigning master:", e);
      const errorMessage = e instanceof Error ? e.message : "Неизвестная ошибка";
      alert(`Ошибка при назначении мастера: ${errorMessage}`);
      
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
    }
  };

  const handleRemoveMaster = async () => {
    if (!order || !order.assigned_master) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API}/assign/${order.id}/remove/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
      });

      if (res.ok) {
        setOrder({ ...order, assigned_master: null } as Order);
        alert("Мастер успешно снят с заказа!");
      } else {
        throw new Error("Не удалось снять мастера");
      }
    } catch (e) {
      console.error(e);
      alert("Ошибка при снятии мастера");
    }
  };

  const handleTransferSubmit = async () => {
    if (!order || !warrantyMasterId) return;
    const token = localStorage.getItem("token");
    const warrantyMasterIdNum = parseInt(warrantyMasterId, 10);
    if (isNaN(warrantyMasterIdNum)) {
      console.warn("Некорректный ID гарантийного мастера");
      alert("Некорректный ID гарантийного мастера");
      return;
    }

    setTransferLoading(true);

    try {
      // Use the correct endpoint for transferring order to warranty master
      const res = await fetch(`${API}/orders/${order.id}/transfer/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Token ${token}` 
        },
        body: JSON.stringify({ warranty_master_id: warrantyMasterIdNum }),
      });

      if (res.ok) {
        const result = await res.json();
        console.log("Transfer successful:", result);
        
        // Update order status - the API returns status 'передан на гарантию'
        setOrder({ ...order, status: 'передан на гарантию', transferred_to: warrantyMasterIdNum } as Order);
        setIsTransferOpen(false);
        setWarrantyMasterId("");
        alert(`Заказ успешно передан гарантийному мастеру! ${result.fine_applied ? `Применен штраф: ${result.fine_applied} ₸` : ''}`);
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error("Transfer failed:", errorData);
        
        let errorMessage = "Не удалось передать заказ гарантийному мастеру.";
        
        if (res.status === 400) {
          errorMessage = errorData.error || "Неверные данные запроса";
        } else if (res.status === 401) {
          errorMessage = "Необходима авторизация";
        } else if (res.status === 403) {
          errorMessage = errorData.error || "Недостаточно прав для выполнения действия";
        } else if (res.status === 404) {
          errorMessage = "Заказ не найден";
        }
        
        alert(errorMessage);
      }
    } catch (e) {
      console.error("Unexpected error during warranty transfer:", e);
      alert("Произошла неожиданная ошибка при передаче заказа гарантийному мастеру");
    } finally {
      setTransferLoading(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!order) return;
    const token = localStorage.getItem("token");
    setDeleteLoading(true);

    try {
      const res = await fetch(`${API}/api/orders/${order.id}/`, {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Token ${token}` 
        },
      });

      if (!res.ok) {
        throw new Error("Не удалось удалить заказ");
      }

      // Перенаправляем на страницу заказов после успешного удаления
      router.push("/orders");
    } catch (e) {
      console.error(e);
      alert("Ошибка при удалении заказа");
    } finally {
      setDeleteLoading(false);
      setIsDeleteOpen(false);
    }
  };

  const handleOrderCompleted = (completedOrder: Order) => {
    setOrder(completedOrder);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'новый': { color: 'bg-blue-600 hover:bg-blue-700', text: 'Новый' },
      'в обработке': { color: 'bg-yellow-600 hover:bg-yellow-700 text-white', text: 'В обработке' },
      'назначен': { color: 'bg-purple-600 hover:bg-purple-700 text-white', text: 'Назначен' },
      'в работе': { color: 'bg-orange-600 hover:bg-orange-700 text-white', text: 'В работе' },
      'завершен': { color: 'bg-green-600 hover:bg-green-700 text-white', text: 'Завершен' },
      'отменен': { color: 'bg-red-600 hover:bg-red-700 text-white', text: 'Отменен' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['новый'];
    return <Badge className={config.color}>{config.text}</Badge>;
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

  if (loading) return <div className="p-4 text-center">Загрузка заказа…</div>;
  if (error) return <div className="p-4 text-red-500">Ошибка: {error}</div>;
  if (!order) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
          >
            Назад
          </Button>
          <h1 className="text-2xl font-bold">Заказ #{order.id}</h1>
        </div>
        {getStatusBadge(order.status)}
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
                  <p className="text-lg font-semibold">{order.client_phone}</p>
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
            <div className="flex items-center gap-3 p-4 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-300">Стоимость заказа</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(Number(order.final_cost) || 0)}
                </p>
              </div>
            </div>
          )}

          {/* Master Assignment Info */}
          {order.assigned_master && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Назначен мастер</p>
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {order.assigned_master}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold">Действия с заказом</h3>
        
        <div className="flex flex-wrap gap-3">
          {/* Assign Master */}
          <Dialog open={isAssignOpen} onOpenChange={(open) => {
            setIsAssignOpen(open);
            if (open && masters.length === 0) {
              fetchMasters();
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Передать обычному мастеру
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Назначить мастера</DialogTitle>
              </DialogHeader>
              <Select value={newMasterId} onValueChange={setNewMasterId}>
                <SelectTrigger className="mb-4">
                  <SelectValue placeholder={mastersLoading ? "Загрузка..." : "Выберите мастера"} />
                </SelectTrigger>
                <SelectContent>
                  {masters.map((master) => (
                    <SelectItem key={master.id} value={master.id.toString()}>
                      {master.full_name} ({master.email}) - ID: {master.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Отмена</Button>
                </DialogClose>
                <Button 
                  onClick={handleAssignSubmit}
                  disabled={!newMasterId || mastersLoading}
                >
                  Назначить
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Transfer to Warranty Master */}
          <Dialog open={isTransferOpen} onOpenChange={(open) => {
            setIsTransferOpen(open);
            if (open && warrantyMasters.length === 0) {
              fetchWarrantyMasters();
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2" disabled={transferLoading}>
                <AlertTriangle className="h-4 w-4" />
                Передать гарантийному мастеру
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Передать гарантийному мастеру</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Передача заказа гарантийному мастеру для выполнения гарантийных работ.
                </div>
                <Select value={warrantyMasterId} onValueChange={setWarrantyMasterId} disabled={transferLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={warrantyMastersLoading ? "Загрузка..." : "Выберите гарантийного мастера"} />
                  </SelectTrigger>
                  <SelectContent>
                    {warrantyMasters.length === 0 && !warrantyMastersLoading ? (
                      <SelectItem value="no-masters" disabled>
                        Гарантийные мастера не найдены
                      </SelectItem>
                    ) : (
                      warrantyMasters.map((master) => (
                        <SelectItem key={master.id} value={master.id.toString()}>
                          {master.full_name} ({master.email}) - ID: {master.id}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" disabled={transferLoading}>
                    Отмена
                  </Button>
                </DialogClose>
                <Button 
                  variant="destructive" 
                  onClick={handleTransferSubmit}
                  disabled={!warrantyMasterId || warrantyMastersLoading || transferLoading || warrantyMasters.length === 0}
                >
                  {transferLoading ? "Передача..." : "Передать"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Remove Master */}
          {order.assigned_master && (
            <Button
              variant="outline"
              onClick={handleRemoveMaster}
              className="flex items-center gap-2"
            >
              <UserX className="h-4 w-4" />
              Снять мастера
            </Button>
          )}

          {/* Complete Order */}
          {order.status !== 'завершен' && (
            <CompleteOrderDialog 
              order={order} 
              onOrderCompleted={handleOrderCompleted}
            />
          )}

          {/* Delete Order */}
          <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Удалить заказ
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Подтверждение удаления</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p>Вы уверены, что хотите удалить заказ #{order.id}?</p>
                <p className="text-sm text-red-600 mt-2">
                  Это действие необратимо. Все данные заказа будут потеряны.
                </p>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" disabled={deleteLoading}>
                    Отмена
                  </Button>
                </DialogClose>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteOrder}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? "Удаление..." : "Удалить"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Order History / Additional Info */}
      {order.status === 'завершен' && (
        <div className="mt-8 p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-2">
            Заказ завершен
          </h3>
          <p className="text-green-700 dark:text-green-300">
            Данный заказ был успешно завершен. Все данные сохранены в системе.
          </p>
        </div>
      )}
    </div>
  );
}
