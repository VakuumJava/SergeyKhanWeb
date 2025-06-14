"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/ui";
import { Badge } from "@workspace/ui/components/ui";
import { 
  User, 
  Phone, 
  MapPin, 
  Calendar,
  DollarSign,
  Wrench,
  Package,
  Clock,
  AlertCircle,
  CreditCard,
  FileText,
  Building
} from 'lucide-react';

interface Order {
  id: number;
  client_name: string;
  client_phone: string;
  description: string;
  address?: string;
  street?: string;
  house_number?: string;
  apartment?: string;
  entrance?: string;
  full_address?: string;
  public_address?: string;
  status: string;
  created_at: string;
  assigned_master?: string | null;
  estimated_cost?: string;
  final_cost?: string;
  expenses?: string;
  
  // Дополнительные поля
  service_type?: string;
  equipment_type?: string;
  promotion?: string;
  due_date?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  notes?: string;
}

interface OrderInfoCardProps {
  order: Order;
  userRole: 'master' | 'curator' | 'admin' | 'super-admin';
  showFullInfo?: boolean;
}

const OrderInfoCard: React.FC<OrderInfoCardProps> = ({ 
  order, 
  userRole, 
  showFullInfo = false 
}) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'новый': { variant: 'secondary', label: 'Новый' },
      'в обработке': { variant: 'default', label: 'В обработке' },
      'назначен': { variant: 'default', label: 'Назначен' },
      'выполняется': { variant: 'default', label: 'Выполняется' },
      'завершен': { variant: 'secondary', label: 'Завершен' },
      'отклонен': { variant: 'destructive', label: 'Отклонен' },
    } as const;

    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'secondary', label: status };
    
    return (
      <Badge variant={config.variant as any}>
        {config.label}
      </Badge>
    );
  };

  const getDisplayAddress = () => {
    if (order.full_address) return order.full_address;
    if (order.public_address) return order.public_address;
    return order.address || 'Не указан';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">Заказ #{order.id}</h2>
          {getStatusBadge(order.status)}
        </div>
        <div className="text-sm text-muted-foreground">
          {new Date(order.created_at).toLocaleDateString()}
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Основная информация
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Клиент</p>
                  <p className="font-medium">{order.client_name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Телефон</p>
                  <p className="font-medium">{order.client_phone}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Адрес</p>
                  <p className="font-medium">{getDisplayAddress()}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Дата создания</p>
                  <p className="font-medium">{new Date(order.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">Описание работ</p>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p>{order.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Details - показываем только админам/кураторам или если showFullInfo */}
      {(showFullInfo || userRole === 'curator' || userRole === 'admin' || userRole === 'super-admin') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Детали услуги
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {order.service_type && (
                <div className="flex items-center gap-3">
                  <Wrench className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Тип услуги</p>
                    <p className="font-medium">{order.service_type}</p>
                  </div>
                </div>
              )}
              
              {order.equipment_type && (
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Тип оборудования</p>
                    <p className="font-medium">{order.equipment_type}</p>
                  </div>
                </div>
              )}
              
              {order.promotion && (
                <div className="flex items-center gap-3">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Акции</p>
                    <p className="font-medium">{order.promotion}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Финансовая информация
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {order.estimated_cost && (
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Предварительная стоимость</p>
                <p className="text-lg font-semibold">{order.estimated_cost} ₸</p>
              </div>
            )}
            
            {order.final_cost && (
              <div className="text-center p-3 bg-primary/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Итоговая стоимость</p>
                <p className="text-lg font-semibold text-primary">{order.final_cost} ₸</p>
              </div>
            )}
            
            {order.expenses && (
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Расходы</p>
                <p className="text-lg font-semibold">{order.expenses} ₸</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scheduling and Additional Info - показываем только админам/кураторам или если showFullInfo */}
      {(showFullInfo || userRole === 'curator' || userRole === 'admin' || userRole === 'super-admin') && (
        order.due_date || order.scheduled_date || order.scheduled_time
      ) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Планирование и дополнительно
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {order.due_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Срок исполнения</p>
                    <p className="font-medium">{new Date(order.due_date).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
              
              {order.scheduled_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Запланированная дата</p>
                    <p className="font-medium">{new Date(order.scheduled_date).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
              
              {order.scheduled_time && (
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Запланированное время</p>
                    <p className="font-medium">{order.scheduled_time}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Notes */}
      {order.notes && (showFullInfo || userRole === 'curator' || userRole === 'admin' || userRole === 'super-admin') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Дополнительные заметки
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p>{order.notes}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Master Assignment */}
      {order.assigned_master && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Назначенный мастер
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="font-semibold text-blue-600 dark:text-blue-400">
                {order.assigned_master}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrderInfoCard;
