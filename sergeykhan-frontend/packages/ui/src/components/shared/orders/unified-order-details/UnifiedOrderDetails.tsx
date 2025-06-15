"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API } from "@shared/constants/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/ui";
import { Badge } from "@workspace/ui/components/ui";
import { Button } from "@workspace/ui/components/ui";
import { 
  ArrowLeft, 
  User, 
  Phone, 
  MapPin, 
  FileText, 
  DollarSign, 
  Calendar,
  Settings,
  CheckCircle,
  MoreHorizontal,
  Clock,
  AlertCircle,
  CreditCard,
  Wrench,
  Package
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@workspace/ui/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/ui";
import OrderCompletionForm from "@shared/orders/completion/OrderCompletionForm";
import { OrderProfitPreview } from "../../profit-settings";
import { formatOrderForMaster, getAddressForMaster, maskPhoneForMaster } from "@shared/utils/masterDataUtils";
import OrderAssignmentPanel from "../order-assignment/OrderAssignmentPanel";

export interface Order {
  id: number;
  client_name: string;
  client_phone: string;
  description: string;
  address?: string;
  street?: string;
  house_number?: string;
  apartment?: string;
  entrance?: string;
  public_address?: string;
  full_address?: string;
  created_at: string;
  assigned_master: string | null;
  assigned_master_id?: number | null;
  estimated_cost: string;
  expenses: string;
  final_cost: string;
  status: string;
  completion?: any;
  
  // Дополнительные поля со страницы создания заказа
  service_type?: string;
  age?: number;
  equipment_type?: string;
  price?: number;
  promotion?: string;
  due_date?: string;
  operator?: string | null;
  curator?: string | null;
  
  // Планирование
  scheduled_date?: string;
  scheduled_time?: string;
  notes?: string;
}

export interface Master {
  id: number;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  full_name: string;
}

interface UnifiedOrderDetailsProps {
  id: string;
  userRole: 'master' | 'curator' | 'admin' | 'super-admin';
  currentUserId?: number | null;
}

interface OrderAction {
  label: string;
  onClick: () => void;
  icon: any;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
}

const UnifiedOrderDetails: React.FC<UnifiedOrderDetailsProps> = ({ id, userRole, currentUserId }) => {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [masterId, setMasterId] = useState<number | null>(null);

  // Dialog states
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [warrantyMasterId, setWarrantyMasterId] = useState("");
  const [warrantyMasters, setWarrantyMasters] = useState<Master[]>([]);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Неавторизованный");
        setLoading(false);
        return;
      }

      try {
        // Если это мастер, получаем его ID
        if (userRole === 'master') {
          try {
            const userResponse = await fetch(`${API}/api/user/`, {
              headers: { 
                "Content-Type": "application/json", 
                Authorization: `Token ${token}` 
              },
            });
            
            if (userResponse.ok) {
              const userData = await userResponse.json();
              setMasterId(userData.id);
            }
          } catch (userError) {
            console.warn("Не удалось получить ID пользователя:", userError);
          }
        }

        const orderResponse = await fetch(`${API}/api/orders/${id}/detail/`, {
          headers: { 
            "Content-Type": "application/json", 
            Authorization: `Token ${token}` 
          },
        });

        if (!orderResponse.ok) {
          throw new Error("Не удалось загрузить заказ");
        }

        const orderData = await orderResponse.json();
        
        // Форматируем данные для мастеров, скрывая конфиденциальную информацию
        if (userRole === 'master') {
          const formattedOrder = formatOrderForMaster(orderData, userRole, currentUserId || undefined);
          setOrder(formattedOrder as Order);
        } else {
          setOrder(orderData);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id, userRole]);

  const fetchWarrantyMasters = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API}/api/users/warranty-masters/`, {
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Token ${token}` 
        },
      });
      if (res.ok) {
        const data = await res.json();
        setWarrantyMasters(data);
      }
    } catch (error) {
      console.error("Ошибка при загрузке гарантийных мастеров:", error);
    }
  };

  const handleTakeOrder = async () => {
    if (!order || !currentUserId) return;

    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API}/assign/${order.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ assigned_master: currentUserId }),
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        setOrder(updatedOrder);
      }
    } catch (error) {
      console.error("Ошибка при взятии заказа:", error);
    }
  };

  const handleAssignMaster = async (masterId: number, slotData?: { scheduled_date: string; scheduled_time: string }) => {
    if (!order) return;

    const token = localStorage.getItem("token");
    try {
      const assignmentData: any = { assigned_master: masterId };
      
      // Add slot data if provided
      if (slotData) {
        assignmentData.scheduled_date = slotData.scheduled_date;
        assignmentData.scheduled_time = slotData.scheduled_time;
      }
      
      const response = await fetch(`${API}/assign/${order.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(assignmentData),
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        setOrder(updatedOrder);
        setIsAssignOpen(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при назначении мастера');
      }
    } catch (error: any) {
      console.error("Ошибка при назначении мастера:", error);
      alert(error.message || "Ошибка при назначении мастера");
    }
  };

  const handleRemoveMaster = async () => {
    if (!order) return;

    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API}/assign/${order.id}/remove/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        setOrder(updatedOrder);
      }
    } catch (error) {
      console.error("Ошибка при снятии мастера:", error);
    }
  };

  const handleTransferToWarranty = async (warrantyMasterId: number) => {
    if (!order) return;

    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API}/transfer/${order.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ warranty_master: warrantyMasterId }),
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        setOrder(updatedOrder);
        setIsTransferOpen(false);
        setWarrantyMasterId("");
      }
    } catch (error) {
      console.error("Ошибка при передаче гарантийному мастеру:", error);
    }
  };

  const handleDeleteOrder = async () => {
    if (!order) return;

    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API}/api/orders/${order.id}/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });

      if (response.ok) {
        router.push("/orders");
      }
    } catch (error) {
      console.error("Ошибка при удалении заказа:", error);
    }
  };

  const getAvailableActions = (): OrderAction[] => {
    if (!order) return [];

    const actions: OrderAction[] = [];
    
    if (userRole === 'master') {
      const isAssignedToCurrentUser = order.assigned_master_id === currentUserId;
      const hasCompletion = order.completion !== undefined && order.completion !== null;
      
      if (isAssignedToCurrentUser) {
        // Если заказ назначен мастеру - показать кнопку завершения
        const canComplete = ['назначен', 'выполняется'].includes(order.status) && !hasCompletion;
        if (canComplete) {
          actions.push({
            label: 'Завершить заказ',
            onClick: () => setShowCompletionForm(true),
            icon: CheckCircle,
            variant: 'default'
          });
        }
      } else {
        // Если заказ не назначен мастеру - показать кнопку "Взять заказ"
        const canTakeOrder = !order.assigned_master && 
          ['новый', 'ожидает'].includes(order.status);
        
        if (canTakeOrder) {
          actions.push({
            label: 'Взять заказ',
            onClick: handleTakeOrder,
            icon: User,
            variant: 'default'
          });
        }
      }
    } else if (userRole === 'curator' || userRole === 'admin' || userRole === 'super-admin') {
      // Админы и кураторы видят все действия
      if (order.assigned_master) {
        // Если мастер назначен
        actions.push({
          label: 'Завершить заказ',
          onClick: () => setShowCompletionForm(true),
          icon: CheckCircle,
          variant: 'default'
        });
        
        actions.push({
          label: 'Убрать мастера',
          onClick: handleRemoveMaster,
          icon: User
        });
        
        actions.push({
          label: 'Назначить гарантийного мастера',
          onClick: () => {
            fetchWarrantyMasters();
            setIsTransferOpen(true);
          },
          icon: Settings
        });
      } else {
        // Если мастер не назначен
        actions.push({
          label: 'Назначить мастера',
          onClick: () => {
            console.log('🔘 Кнопка "Назначить мастера" нажата');
            console.log('📋 Данные заказа:', { id: order?.id, status: order?.status });
            console.log('👤 Роль пользователя:', userRole);
            setIsAssignOpen(true);
            console.log('✅ isAssignOpen установлен в true');
          },
          icon: User
        });
        
        actions.push({
          label: 'Назначить гарантийного мастера',
          onClick: () => {
            fetchWarrantyMasters();
            setIsTransferOpen(true);
          },
          icon: Settings
        });
      }
      
      // Дополнительные действия для админов
      if (userRole === 'admin' || userRole === 'super-admin') {
        actions.push({
          label: 'Удалить заказ',
          onClick: handleDeleteOrder,
          icon: FileText,
          variant: 'destructive'
        });
      }
    }
    
    return actions;
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

    const config = statusConfig[status as keyof typeof statusConfig] || {
      color: 'bg-gray-600 hover:bg-gray-700 text-white',
      text: status
    };

    return (
      <Badge className={config.color}>
        {config.text}
      </Badge>
    );
  };

  const getDisplayAddress = () => {
    if (!order) return 'Не указан';

    if (userRole === 'admin' || userRole === 'curator' || userRole === 'super-admin') {
      // Админы, кураторы и супер-админы видят полный адрес
      return order.full_address || order.address || `${order.street || ''} ${order.house_number || ''}`.trim();
    } else if (userRole === 'master') {
      // Мастера видят отфильтрованный адрес (данные уже обработаны в formatOrderForMaster)
      const isAssignedToCurrentUser = order.assigned_master === currentUserId?.toString();
      const orderForAddress = {
        ...order,
        address: order.address || '',
        public_address: order.public_address,
        full_address: order.full_address,
        street: order.street,
        house_number: order.house_number
      };
      return getAddressForMaster(orderForAddress as any, userRole, isAssignedToCurrentUser);
    }
    return order.address || 'Не указан';
  };

  const getDisplayPhone = () => {
    if (!order) return 'Не указан';

    if (userRole === 'admin' || userRole === 'curator' || userRole === 'super-admin') {
      // Админы, кураторы и супер-админы видят полный номер
      return order.client_phone;
    } else if (userRole === 'master') {
      // Мастера всегда видят скрытый номер (данные уже отфильтрованы в formatOrderForMaster)
      return maskPhoneForMaster(order.client_phone);
    }
    return order.client_phone;
  };

  const actions = getAvailableActions();

  const handleCompletionSuccess = () => {
    setShowCompletionForm(false);
    // Обновить данные заказа
    const fetchUpdatedOrder = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await fetch(`${API}/api/orders/${id}/detail/`, {
          headers: { 
            "Content-Type": "application/json", 
            Authorization: `Token ${token}` 
          },
        });
        if (response.ok) {
          const updatedOrder = await response.json();
          setOrder(updatedOrder);
        }
      } catch (error) {
        console.error("Ошибка при обновлении заказа:", error);
      }
    };
    fetchUpdatedOrder();
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
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
          <h1 className="text-2xl font-bold">Заказ #{order.id}</h1>
          {getStatusBadge(order.status)}
        </div>

        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex gap-2">
            {userRole === 'master' && actions.length === 1 ? (
              // Для мастеров показываем единственную кнопку
              (() => {
                const action = actions[0];
                if (!action) return null;
                const Icon = action.icon;
                return (
                  <Button
                    onClick={action.onClick}
                    variant={action.variant || 'default'}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {action.label}
                  </Button>
                );
              })()
            ) : (
              // Для админов/кураторов показываем dropdown меню
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <MoreHorizontal className="w-4 h-4 mr-2" />
                    Действия
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Действия с заказом</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {actions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <DropdownMenuItem
                        key={index}
                        onClick={action.onClick}
                        className={action.variant === 'destructive' ? 'text-destructive' : ''}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {action.label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Информация о заказе
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
                      <p className="text-lg font-semibold">{getDisplayPhone()}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Адрес</p>
                      <p className="text-lg font-semibold">{getDisplayAddress()}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Дата создания</p>
                      <p className="text-lg font-semibold">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full order information for admins/curators */}
              {(userRole === 'curator' || userRole === 'admin' || userRole === 'super-admin') && (
                <>
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                      <Wrench className="w-4 h-4" />
                      Детали услуги
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {order.service_type && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Тип услуги</p>
                          <p className="text-base">{order.service_type}</p>
                        </div>
                      )}
                      {order.equipment_type && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            Тип оборудования
                          </p>
                          <p className="text-base">{order.equipment_type}</p>
                        </div>
                      )}
                      {order.promotion && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Акции</p>
                          <p className="text-base">{order.promotion}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Scheduling and Additional Info */}
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Планирование и дополнительно
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {order.due_date && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Срок исполнения</p>
                          <p className="text-base">{new Date(order.due_date).toLocaleDateString()}</p>
                        </div>
                      )}
                      {order.scheduled_date && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Запланированная дата</p>
                          <p className="text-base">{new Date(order.scheduled_date).toLocaleDateString()}</p>
                        </div>
                      )}
                      {order.scheduled_time && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Запланированное время</p>
                          <p className="text-base">{order.scheduled_time}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional Notes */}
                  {order.notes && (
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Дополнительные заметки
                      </h4>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-base">{order.notes}</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Description */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Описание работ</p>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-base">{order.description}</p>
                </div>
              </div>

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
        </div>

        {/* Financial Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Финансовая информация
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Предварительная стоимость:</span>
                <span className="font-semibold">{order.estimated_cost} ₸</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Итоговая стоимость:</span>
                <span className="font-semibold">{order.final_cost} ₸</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Расходы:</span>
                <span className="font-semibold">{order.expenses} ₸</span>
              </div>
            </CardContent>
          </Card>

          {/* Profit Distribution */}
          {(userRole === 'master' || userRole === 'curator' || userRole === 'admin' || userRole === 'super-admin') && (
            <OrderProfitPreview 
              orderId={id}
              userRole={userRole}
              finalCost={order.final_cost ? parseFloat(order.final_cost) : undefined}
              masterId={masterId}
              showTitle={true}
            />
          )}
        </div>
      </div>

      {/* Dialogs */}
      <OrderAssignmentPanel
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        onAssign={(masterId: number, slotData?: { scheduled_date: string; scheduled_time: string }) => {
          handleAssignMaster(masterId, slotData);
        }}
        orderId={order?.id}
        orderDate={order?.scheduled_date}
        orderTime={order?.scheduled_time}
      />

      <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Передать гарантийному мастеру</DialogTitle>
          </DialogHeader>
          <Select value={warrantyMasterId} onValueChange={setWarrantyMasterId}>
            <SelectTrigger className="mb-4">
              <SelectValue placeholder="Выберите гарантийного мастера" />
            </SelectTrigger>
            <SelectContent>
              {warrantyMasters.map((master) => (
                <SelectItem key={master.id} value={master.id.toString()}>
                  {master.full_name} ({master.email}) - ID: {master.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTransferOpen(false)}>
              Отмена
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (warrantyMasterId) {
                  handleTransferToWarranty(parseInt(warrantyMasterId));
                }
              }}
              disabled={!warrantyMasterId}
            >
              Передать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Completion Form */}
      {order && (
        <OrderCompletionForm
          orderId={order.id.toString()}
          isOpen={showCompletionForm}
          onClose={() => setShowCompletionForm(false)}
          onSuccess={handleCompletionSuccess}
        />
      )}
    </div>
  );
};

export default UnifiedOrderDetails;
