"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { useDistanceApi } from "@/hooks/useDistanceApi";

interface MasterDistanceTableProps {
  masterId: string;
}

const MasterDistanceTable: React.FC<MasterDistanceTableProps> = ({ masterId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [distanceInfo, setDistanceInfo] = useState<any>(null);
  const { loading, error, fetchMasterDistanceInfo, setMasterDistanceManually, resetMasterDistanceToAutomatic } = useDistanceApi();

  const loadDistanceData = async () => {
    setIsLoading(true);
    const data = await fetchMasterDistanceInfo(parseInt(masterId));
    if (data) {
      setDistanceInfo(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (masterId) {
      loadDistanceData();
    }
  }, [masterId]);

  const handleManualSet = async (level: number) => {
    const success = await setMasterDistanceManually(parseInt(masterId), level);
    if (success) {
      await loadDistanceData();
    }
  };

  const handleReset = async () => {
    const success = await resetMasterDistanceToAutomatic(parseInt(masterId));
    if (success) {
      await loadDistanceData();
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ru-RU') + '₸';
  };

  const getDistanceLevelBadge = (level: number, name: string) => {
    return (
      <Badge 
        variant={level === 2 ? "default" : level === 1 ? "secondary" : "outline"}
        className={`text-sm ${
          level === 2 ? "bg-green-600 hover:bg-green-700" :
          level === 1 ? "bg-blue-600 hover:bg-blue-700 text-white" :
          "text-muted-foreground"
        }`}
      >
        {name}
      </Badge>
    );
  };

  if (isLoading || loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-4 space-y-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-muted-foreground">Загрузка данных дистанционки...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <span>⚠️</span>
            <span>Ошибка: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!distanceInfo) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <p>Нет данных о дистанционке для этого мастера</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Данные дистанционки</CardTitle>
            <CardDescription>
              Текущий уровень видимости: {distanceInfo.distance_level_name} ({distanceInfo.is_manual ? "установлен вручную" : "автоматический"})
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {getDistanceLevelBadge(distanceInfo.distance_level, distanceInfo.distance_level_name)}
            <Button 
              onClick={loadDistanceData}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              Обновить
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium">Средний чек</h3>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-2xl font-bold">{formatCurrency(distanceInfo.statistics.average_check)}</span>
                  <Badge 
                    variant={distanceInfo.meets_requirements.standard_distance ? "default" : "outline"}
                    className={`${distanceInfo.meets_requirements.standard_distance ? "bg-green-600" : "text-muted-foreground"}`}
                  >
                    {distanceInfo.meets_requirements.standard_distance ? "✓" : "✗"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Порог: {formatCurrency(distanceInfo.thresholds.average_check_threshold)}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium">Сумма заказов за сутки</h3>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-2xl font-bold">{formatCurrency(distanceInfo.statistics.daily_revenue)}</span>
                  <Badge 
                    variant={distanceInfo.meets_requirements.daily_distance_by_revenue ? "default" : "outline"}
                    className={`${distanceInfo.meets_requirements.daily_distance_by_revenue ? "bg-green-600" : "text-muted-foreground"}`}
                  >
                    {distanceInfo.meets_requirements.daily_distance_by_revenue ? "✓" : "✗"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Порог: {formatCurrency(distanceInfo.thresholds.daily_order_sum_threshold)}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium">Чистый вал за 10 дней</h3>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-2xl font-bold">{formatCurrency(distanceInfo.statistics.net_turnover_10_days)}</span>
                  <Badge 
                    variant={distanceInfo.meets_requirements.daily_distance_by_turnover ? "default" : "outline"}
                    className={`${distanceInfo.meets_requirements.daily_distance_by_turnover ? "bg-green-600" : "text-muted-foreground"}`}
                  >
                    {distanceInfo.meets_requirements.daily_distance_by_turnover ? "✓" : "✗"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Порог: {formatCurrency(distanceInfo.thresholds.net_turnover_threshold)}
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6">
            <h3 className="font-medium mb-3">Ручное управление уровнем</h3>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleManualSet(0)}
                disabled={loading}
              >
                Базовый уровень
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleManualSet(1)}
                disabled={loading}
              >
                Обычная дистанционка
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleManualSet(2)}
                disabled={loading}
              >
                Суточная дистанционка
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={handleReset}
                disabled={loading || !distanceInfo.is_manual}
              >
                Сбросить на автоматический
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MasterDistanceTable;
