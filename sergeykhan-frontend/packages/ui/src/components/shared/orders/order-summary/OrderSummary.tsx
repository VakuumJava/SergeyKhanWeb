"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/ui";
import { Badge } from "@workspace/ui/components/ui";
import { 
  FileText,
  DollarSign,
  Calendar,
  User,
  MapPin,
  Phone,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard
} from 'lucide-react';

interface OrderCardSummaryProps {
  order: {
    id: number;
    client_name: string;
    client_phone: string;
    status: string;
    created_at: string;
    estimated_cost?: string;
    final_cost?: string;
    service_type?: string;
    equipment_type?: string;
    due_date?: string;
    assigned_master?: string | null;
    address?: string;
    full_address?: string;
    public_address?: string;
    priority?: string;
    payment_method?: string;
    scheduled_date?: string;
    scheduled_time?: string;
  };
  compact?: boolean;
}

const OrderSummary: React.FC<OrderCardSummaryProps> = ({ order, compact = false }) => {
  const getStatusColor = (status: string) => {
    const colors = {
      'новый': 'bg-blue-100 text-blue-800 border-blue-200',
      'в обработке': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'назначен': 'bg-purple-100 text-purple-800 border-purple-200',
      'выполняется': 'bg-orange-100 text-orange-800 border-orange-200',
      'завершен': 'bg-green-100 text-green-800 border-green-200',
      'отклонен': 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };
  
  const getPriorityColor = (priority: string) => {
    const colors = {
      'низкий': 'bg-green-100 text-green-800 border-green-200',
      'обычный': 'bg-blue-100 text-blue-800 border-blue-200',
      'высокий': 'bg-orange-100 text-orange-800 border-orange-200',
      'срочный': 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getDisplayAddress = () => {
    if (order.full_address) return order.full_address;
    if (order.public_address) return order.public_address;
    return order.address || 'Не указан';
  };

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Заказ #{order.id}</h3>
            <div className="flex gap-2 items-center">
              {order.priority && order.priority !== 'обычный' && (
                <Badge variant="outline" className={getPriorityColor(order.priority)}>
                  {order.priority}
                </Badge>
              )}
              <Badge className={getStatusColor(order.status)}>
                {order.status}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>{order.client_name}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="truncate">{getDisplayAddress()}</span>
            </div>
            
            {order.scheduled_date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>
                  {new Date(order.scheduled_date).toLocaleDateString()}
                  {order.scheduled_time && ` в ${order.scheduled_time}`}
                </span>
              </div>
            )}
            
            {order.final_cost && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{order.final_cost} ₸</span>
                {order.payment_method && <span className="text-xs text-muted-foreground">({order.payment_method})</span>}
              </div>
            )}
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{new Date(order.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Заказ #{order.id}
          </CardTitle>
          <div className="flex gap-2 items-center">
            {order.priority && order.priority !== 'обычный' && (
              <Badge variant="outline" className={getPriorityColor(order.priority)}>
                {order.priority}
              </Badge>
            )}
            <Badge className={getStatusColor(order.status)}>
              {order.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Client Info */}
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
                <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Service and Cost Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          {order.service_type && (
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Тип услуги</p>
              <p className="font-medium">{order.service_type}</p>
            </div>
          )}
          
          {order.equipment_type && (
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Оборудование</p>
              <p className="font-medium">{order.equipment_type}</p>
            </div>
          )}
          
          {order.final_cost && (
            <div className="text-center p-3 bg-primary/10 rounded-lg">
              <p className="text-sm text-muted-foreground">Стоимость</p>
              <p className="text-lg font-semibold text-primary">{order.final_cost} ₸</p>
              {order.payment_method && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                  <CreditCard className="w-3 h-3" />
                  {order.payment_method}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="pt-4 border-t space-y-3">
          {order.due_date && (
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
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
                <p className="font-medium">
                  {new Date(order.scheduled_date).toLocaleDateString()}
                  {order.scheduled_time && ` в ${order.scheduled_time}`}
                </p>
              </div>
            </div>
          )}

          {order.priority && (
            <div className="flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Приоритет</p>
                <p className="font-medium">{order.priority}</p>
              </div>
            </div>
          )}
          
          {order.payment_method && (
            <div className="flex items-center gap-3">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Способ оплаты</p>
                <p className="font-medium">{order.payment_method}</p>
              </div>
            </div>
          )}
          
          {order.assigned_master && (
            <div className="flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Назначенный мастер</p>
                <p className="font-medium text-green-600">{order.assigned_master}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderSummary;
