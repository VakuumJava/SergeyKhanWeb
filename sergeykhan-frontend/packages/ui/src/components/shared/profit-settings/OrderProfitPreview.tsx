"use client";

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
  masterId?: number | null;
  masterName?: string;
  curatorName?: string;
  showTitle?: boolean;
  showPercentagesOnly?: boolean; // Новый параметр для показа только процентов
}

export const OrderProfitPreview: React.FC<OrderProfitPreviewProps> = ({
  orderId,
  userRole,
  finalCost,
  masterId,
  masterName,
  curatorName,
  showTitle = true,
  showPercentagesOnly = false,
}) => {
  // ──────────── STATE ────────────
  const [distribution, setDistribution] = useState<ProfitDistribution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [masterSettings, setMasterSettings] = useState<any>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

  // ──────────── HELPERS ────────────
  const fetchMasterSettings = async () => {
    if (userRole !== 'master' || !masterId) {
      console.log('Not fetching master settings:', { userRole, masterId });
      return;
    }
    
    console.log('Fetching master settings for masterId:', masterId);
    setLoading(true);
    
    try {
      // Теперь загружаем настройки прибыли для этого мастера
      const response = await axios.get(
        `${API}/api/profit-settings/master/${masterId}/`,
        { headers: { Authorization: `Token ${token}` } }
      );
      
      console.log('Master settings response:', response.data);
      
      if (response.data && response.data.settings) {
        setMasterSettings(response.data.settings);
      }
    } catch (err: any) {
      console.error('Ошибка загрузки настроек мастера:', err);
      // Если нет индивидуальных настроек, используем дефолтные
      setMasterSettings({
        master_paid_percent: 30,
        master_balance_percent: 30,
        curator_percent: 5,
        company_percent: 35,
        is_individual: false
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProfitPreview = async () => {
    if (!orderId) return;
    
    // Для мастеров не делаем запрос к profit-preview, только загружаем настройки
    if (userRole === 'master') {
      await fetchMasterSettings();
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(
        `${API}/api/orders/${orderId}/profit-preview/`,
        { headers: { Authorization: `Token ${token}` } }
      );
      
      console.log('Profit preview response:', response.data);
      
      if (response.data && response.data.estimated_distribution) {
        setDistribution(response.data.estimated_distribution);
      } else {
        throw new Error('Неверный формат ответа сервера');
      }
    } catch (err: any) {
      console.error('Ошибка загрузки предварительного расчета:', err);
      setError('Не удалось загрузить расчет прибыли');
    } finally {
      setLoading(false);
    }
  };

  // ──────────── EFFECTS ────────────
  useEffect(() => {
    console.log('OrderProfitPreview useEffect:', { userRole, orderId, masterId });
    
    if (userRole === 'master') {
      if (masterId) {
        fetchMasterSettings();
      } else {
        console.log('Waiting for masterId...');
        setLoading(false); // Останавливаем загрузку, если нет masterId
      }
    } else {
      fetchProfitPreview();
    }
  }, [orderId, userRole, masterId]); // Добавляем userRole в зависимости

  // ──────────── RENDER HELPERS ────────────
  const formatCurrency = (amount: string | number) => {
    // Если это процент (заканчивается на %), возвращаем как есть
    if (typeof amount === 'string' && amount.includes('%')) {
      return amount;
    }
    
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const getVisibleInfo = () => {
    // Для мастеров используем настройки мастера
    if (userRole === 'master') {
      if (!masterSettings) return null;
      
      return [
        {
          label: 'Ваша выплата',
          amount: `${masterSettings.master_paid_percent}%`,
          icon: <Wallet className="w-4 h-4" />,
          color: 'text-green-600',
          description: `${masterSettings.master_paid_percent}% от суммы заказа`
        },
        {
          label: 'На ваш баланс',
          amount: `${masterSettings.master_balance_percent}%`,
          icon: <TrendingUp className="w-4 h-4" />,
          color: 'text-blue-600',
          description: `${masterSettings.master_balance_percent}% от суммы заказа`
        },
        {
          label: 'Итого вам',
          amount: `${masterSettings.master_paid_percent + masterSettings.master_balance_percent}%`,
          icon: <Calculator className="w-4 h-4" />,
          color: 'text-purple-600',
          description: `${masterSettings.master_paid_percent + masterSettings.master_balance_percent}% от суммы заказа`,
          isTotal: true
        }
      ];
    }

    // Для остальных ролей используем distribution
    if (!distribution || !distribution.settings_used) return null;

    const masterTotal = parseFloat(distribution.master_paid) + parseFloat(distribution.master_balance);
    const curatorAmount = parseFloat(distribution.curator_amount);
    const companyAmount = parseFloat(distribution.company_amount);

    if (userRole === 'curator') {
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
    }

    if (userRole === 'super-admin' || userRole === 'admin') {
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
    }

    return [];
  };

  // ──────────── RENDER ────────────
  // Для мастеров без masterId показываем сообщение
  if (userRole === 'master' && !masterId) {
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
              Не удалось определить ваш ID для загрузки настроек процентов
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Для админов и кураторов требуется финальная стоимость для показа сумм
  if (!finalCost && userRole !== 'master' && !showPercentagesOnly) {
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

  // Для мастеров проверяем наличие настроек, для остальных - distribution
  if (userRole === 'master' && !masterSettings) {
    return null;
  }
  
  if (userRole !== 'master' && (!distribution || !distribution.settings_used)) {
    return null;
  }

  const visibleInfo = getVisibleInfo();

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Распределение прибыли
            </CardTitle>
            {userRole !== 'master' && distribution && (
              <CardDescription className="mt-1">
                Итоговая сумма: {formatCurrency(distribution.total_amount)}
              </CardDescription>
            )}
            {userRole === 'master' && (
              <CardDescription className="mt-1">
                Ваши процентные ставки
              </CardDescription>
            )}
          </div>
          
          <div className="flex-shrink-0">
            <Badge 
              variant={
                userRole === 'master' 
                  ? (masterSettings?.is_individual ? "secondary" : "outline")
                  : (distribution?.settings_used?.is_individual ? "secondary" : "outline")
              }
              className="text-xs px-2 py-1"
            >
              {(userRole === 'master' ? masterSettings?.is_individual : distribution?.settings_used?.is_individual) 
                ? "Индивидуальные %" 
                : "Глобальные %"
              }
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {visibleInfo && visibleInfo.map((item, index) => (
          <div key={index}>
            {item.isTotal && <Separator className="my-3" />}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2 flex-1">
                <span className={item.color}>{item.icon}</span>
                <div className="flex-1">
                  <span className={`font-medium ${item.isTotal ? 'text-lg' : ''} block`}>
                    {item.label}
                  </span>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <div className="flex-shrink-0 sm:text-right">
                <span className={`font-bold ${item.isTotal ? 'text-lg' : ''} ${item.color}`}>
                  {formatCurrency(item.amount)}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Дополнительная информация для администраторов */}
        {(userRole === 'super-admin' || userRole === 'admin') && distribution && (
          <>
            <Separator />
            <div className="text-xs text-muted-foreground space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex justify-between sm:block">
                  <span className="sm:block">Мастеру к выплате:</span>
                  <span className="font-medium sm:block sm:mt-1">{formatCurrency(distribution.master_paid)}</span>
                </div>
                <div className="flex justify-between sm:block">
                  <span className="sm:block">Мастеру на баланс:</span>
                  <span className="font-medium sm:block sm:mt-1">{formatCurrency(distribution.master_balance)}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
