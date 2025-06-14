/**
 * Компонент для отображения предварительного расчета распределения прибыли по заказу
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/ui";
import { Badge } from "@workspace/ui/components/ui";
import { Separator } from "@workspace/ui/components/ui";
import { Alert, AlertDescription } from "@workspace/ui/components/ui";
import { Loader2, Calculator, TrendingUp, Wallet, Building } from "lucide-react";
import { API } from "@shared/constants/constants";
import axios from "axios";

interface ProfitDistribution {
  total_amount: string;
  master_paid: string;
  master_balance: string;
  curator_amount: string;
  company_amount: string;
  settings_used: {
    master_paid_percent: number;
    master_balance_percent: number;
    curator_percent: number;
    company_percent: number;
    is_individual: boolean;
    settings_id?: number | null;
  };
}

interface OrderProfitPreviewProps {
  orderId: string;
  userRole: 'master' | 'curator' | 'super-admin' | 'admin';
  finalCost?: number;
  masterName?: string;
  curatorName?: string;
}

export const OrderProfitPreview: React.FC<OrderProfitPreviewProps> = ({
  orderId,
  userRole,
  finalCost,
  masterName,
  curatorName,
}) => {
  // ──────────── STATE ────────────
  const [distribution, setDistribution] = useState<ProfitDistribution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

  // ──────────── HELPERS ────────────
  const fetchProfitPreview = async () => {
    if (!orderId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(
        `${API}/api/orders/${orderId}/profit-preview/`,
        { headers: { Authorization: `Token ${token}` } }
      );
      
      setDistribution(response.data.estimated_distribution);
    } catch (err: any) {
      console.error('Ошибка загрузки предварительного расчета:', err);
      setError('Не удалось загрузить расчет прибыли');
    } finally {
      setLoading(false);
    }
  };

  // ──────────── EFFECTS ────────────
  useEffect(() => {
    fetchProfitPreview();
  }, [orderId]);

  // ──────────── RENDER HELPERS ────────────
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const getVisibleInfo = () => {
    if (!distribution) return null;

    const masterTotal = parseFloat(distribution.master_paid) + parseFloat(distribution.master_balance);
    const curatorAmount = parseFloat(distribution.curator_amount);
    const companyAmount = parseFloat(distribution.company_amount);

    switch (userRole) {
      case 'master':
        return [
          {
            label: 'Ваша выплата',
            amount: distribution.master_paid,
            icon: <Wallet className="w-4 h-4" />,
            color: 'text-green-600',
            description: `${distribution.settings_used.master_paid_percent}% от суммы заказа`
          },
          {
            label: 'На ваш баланс',
            amount: distribution.master_balance,
            icon: <TrendingUp className="w-4 h-4" />,
            color: 'text-blue-600',
            description: `${distribution.settings_used.master_balance_percent}% от суммы заказа`
          },
          {
            label: 'Итого вам',
            amount: masterTotal.toString(),
            icon: <Calculator className="w-4 h-4" />,
            color: 'text-purple-600',
            description: `${distribution.settings_used.master_paid_percent + distribution.settings_used.master_balance_percent}% от суммы заказа`,
            isTotal: true
          }
        ];

      case 'curator':
        return [
          {
            label: 'Ваша доля',
            amount: distribution.curator_amount,
            icon: <TrendingUp className="w-4 h-4" />,
            color: 'text-blue-600',
            description: `${distribution.settings_used.curator_percent}% от суммы заказа`
          },
          {
            label: `Мастеру (${masterName || 'Мастер'})`,
            amount: masterTotal.toString(),
            icon: <Wallet className="w-4 h-4" />,
            color: 'text-green-600',
            description: `${distribution.settings_used.master_paid_percent + distribution.settings_used.master_balance_percent}% от суммы заказа`
          }
        ];

      case 'super-admin':
      case 'admin':
        return [
          {
            label: `Мастеру (${masterName || 'Мастер'})`,
            amount: masterTotal.toString(),
            icon: <Wallet className="w-4 h-4" />,
            color: 'text-green-600',
            description: `${distribution.settings_used.master_paid_percent + distribution.settings_used.master_balance_percent}% (${distribution.settings_used.master_paid_percent}% выплата + ${distribution.settings_used.master_balance_percent}% баланс)`
          },
          {
            label: `Куратору (${curatorName || 'Куратор'})`,
            amount: distribution.curator_amount,
            icon: <TrendingUp className="w-4 h-4" />,
            color: 'text-blue-600',
            description: `${distribution.settings_used.curator_percent}% от суммы заказа`
          },
          {
            label: 'Компании',
            amount: distribution.company_amount,
            icon: <Building className="w-4 h-4" />,
            color: 'text-orange-600',
            description: `${distribution.settings_used.company_percent}% от суммы заказа`
          }
        ];

      default:
        return [];
    }
  };

  // ──────────── RENDER ────────────
  if (!finalCost) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Распределение прибыли
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Расчет будет доступен после указания итоговой стоимости заказа
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Распределение прибыли
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="ml-2">Расчет прибыли...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Распределение прибыли
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!distribution) {
    return null;
  }

  const visibleInfo = getVisibleInfo();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Распределение прибыли
            </CardTitle>
            <CardDescription>
              Итоговая сумма: {formatCurrency(distribution.total_amount)}
            </CardDescription>
          </div>
          
          <Badge variant={distribution.settings_used.is_individual ? "secondary" : "outline"}>
            {distribution.settings_used.is_individual ? "Индивидуальные %" : "Глобальные %"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {visibleInfo && visibleInfo.map((item, index) => (
          <div key={index}>
            {item.isTotal && <Separator className="my-3" />}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={item.color}>{item.icon}</span>
                <div>
                  <span className={`font-medium ${item.isTotal ? 'text-lg' : ''}`}>
                    {item.label}
                  </span>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <span className={`text-right font-bold ${item.isTotal ? 'text-lg' : ''} ${item.color}`}>
                {formatCurrency(item.amount)}
              </span>
            </div>
          </div>
        ))}

        {/* Дополнительная информация для администраторов */}
        {(userRole === 'super-admin' || userRole === 'admin') && (
          <>
            <Separator />
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Мастеру к выплате:</span>
                <span>{formatCurrency(distribution.master_paid)}</span>
              </div>
              <div className="flex justify-between">
                <span>Мастеру на баланс:</span>
                <span>{formatCurrency(distribution.master_balance)}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
