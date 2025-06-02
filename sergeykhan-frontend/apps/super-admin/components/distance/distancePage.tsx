"use client"

import React, { useState, useEffect } from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Badge } from "@workspace/ui/components/badge";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@workspace/ui/components/table";
import { useDistanceApi } from "../../hooks/useDistanceApi";

interface MasterDistanceInfo {
  master_id: number;
  master_email: string;
  distance_level: number;
  distance_level_name: string;
  statistics: {
    average_check: number;
    daily_revenue: number;
    net_turnover_10_days: number;
  };
  thresholds: {
    average_check_threshold: number;
    daily_order_sum_threshold: number;
    net_turnover_threshold: number;
  };
  meets_requirements?: {
    standard_distance: boolean;
    daily_distance_by_revenue: boolean;
    daily_distance_by_turnover: boolean;
  };
}

const DistancePage = () => {
    // Состояния для обычной дистанционки:
    const [averageCheckThreshold, setAverageCheckThreshold] = useState(65000);
    const [visiblePeriodStandard, setVisiblePeriodStandard] = useState(28); // часы

    // Состояния для суточной дистанционки:
    const [dailyOrderSumThreshold, setDailyOrderSumThreshold] = useState(350000);
    const [netTurnoverThreshold, setNetTurnoverThreshold] = useState(1500000);
    const [visiblePeriodDaily, setVisiblePeriodDaily] = useState(24); // часы

    // Состояния для списка мастеров с дистанционкой
    const [masters, setMasters] = useState<MasterDistanceInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const { 
        loading, 
        error, 
        fetchDistanceSettings, 
        updateDistanceSettings, 
        getAllMastersDistanceDetailed,
        forceUpdateAllMastersDistance,
        setMasterDistanceManually 
    } = useDistanceApi();

    // Загружаем настройки при монтировании компонента
    useEffect(() => {
        loadSettings();
        loadMasters();
    }, []);

    const loadSettings = async () => {
        const settings = await fetchDistanceSettings();
        if (settings) {
            setAverageCheckThreshold(settings.averageCheckThreshold);
            setVisiblePeriodStandard(settings.visiblePeriodStandard);
            setDailyOrderSumThreshold(settings.dailyOrderSumThreshold);
            setNetTurnoverThreshold(settings.netTurnoverThreshold);
            setVisiblePeriodDaily(settings.visiblePeriodDaily);
        }
    };

    const loadMasters = async () => {
        setIsLoading(true);
        const mastersData = await getAllMastersDistanceDetailed();
        if (mastersData) {
            setMasters(mastersData);
        }
        setIsLoading(false);
    };

    const handleSave = async () => {
        const settings = {
            averageCheckThreshold,
            visiblePeriodStandard,
            dailyOrderSumThreshold,
            netTurnoverThreshold,
            visiblePeriodDaily,
        };

        const success = await updateDistanceSettings(settings);
        if (success) {
            alert("Настройки успешно сохранены!");
        } else {
            alert("Ошибка при сохранении настроек");
        }
    };

    const handleForceUpdate = async () => {
        const success = await forceUpdateAllMastersDistance();
        if (success) {
            alert("Статусы дистанционки обновлены!");
            loadMasters(); // Перезагружаем список мастеров
        } else {
            alert("Ошибка при обновлении статусов");
        }
    };

    const handleSetMasterDistance = async (masterId: number, newLevel: number) => {
        const success = await setMasterDistanceManually(masterId, newLevel);
        if (success) {
            alert(`Уровень дистанционки установлен: ${newLevel}`);
            loadMasters(); // Перезагружаем список мастеров
        } else {
            alert("Ошибка при установке уровня дистанционки");
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold tracking-tight">
                    Настройки дистанционки
                </h1>
                <p className="text-muted-foreground mt-2">
                    Управление системой дистанционного доступа для мастеров
                </p>
            </div>

            {error && (
                <Card className="border-destructive">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-destructive">
                            <span>⚠️</span>
                            <span>Ошибка: {error}</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Обычная дистанционка */}
            <Card>
                <CardHeader>
                    <CardTitle>Обычная дистанционка</CardTitle>
                    <CardDescription>
                        Если средний чек за последние 10 заказов ≥ {averageCheckThreshold.toLocaleString()}₸, 
                        мастер видит заказы на +4 часа вперед (всего 28 часов).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Пороговый средний чек (₸)
                            </label>
                            <Input
                                type="number"
                                value={averageCheckThreshold}
                                onChange={(e) => setAverageCheckThreshold(Number(e.target.value))}
                                placeholder="65000"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Дополнительные часы видимости
                            </label>
                            <Input
                                type="number"
                                value={4}
                                disabled
                                className="bg-muted"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Суточная дистанционка */}
            <Card>
                <CardHeader>
                    <CardTitle>Суточная дистанционка</CardTitle>
                    <CardDescription>
                        Для получения суточной дистанционки требуется выполнение одного из условий: 
                        сумма заказов за сутки ≥ {dailyOrderSumThreshold.toLocaleString()}₸ или 
                        чистый вал за 10 дней ≥ {netTurnoverThreshold.toLocaleString()}₸. 
                        В таком случае заказы видны на +24 часа вперед (всего 48 часов).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Пороговая сумма заказов в сутки (₸)
                            </label>
                            <Input
                                type="number"
                                value={dailyOrderSumThreshold}
                                onChange={(e) => setDailyOrderSumThreshold(Number(e.target.value))}
                                placeholder="350000"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Пороговый чистый вал за 10 дней (₸)
                            </label>
                            <Input
                                type="number"
                                value={netTurnoverThreshold}
                                onChange={(e) => setNetTurnoverThreshold(Number(e.target.value))}
                                placeholder="1500000"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium">
                                Дополнительные часы видимости
                            </label>
                            <Input
                                type="number"
                                value={24}
                                disabled
                                className="bg-muted max-w-xs"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Мастера с дистанционкой */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Мастера с дистанционкой</CardTitle>
                            <CardDescription>
                                Управление уровнями дистанционки для всех мастеров
                            </CardDescription>
                        </div>
                        <Button 
                            onClick={handleForceUpdate} 
                            disabled={loading}
                            variant="outline"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    Обновление...
                                </div>
                            ) : (
                                "Обновить все статусы"
                            )}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                
                {isLoading ? (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="mt-2 text-muted-foreground">Загрузка...</p>
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email мастера</TableHead>
                                    <TableHead>Уровень дистанционки</TableHead>
                                    <TableHead className="text-right">Средний чек</TableHead>
                                    <TableHead className="text-right">Выручка за сутки</TableHead>
                                    <TableHead className="text-right">Чистый вал (10 дней)</TableHead>
                                    <TableHead className="text-center">Действия</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {masters.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            Нет мастеров с дистанционкой
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    masters.map((master) => (
                                        <TableRow key={master.master_id}>
                                            <TableCell className="font-medium">
                                                {master.master_email}
                                            </TableCell>
                                            <TableCell>
                                                <Badge 
                                                    variant={
                                                        master.distance_level === 2 ? "default" : 
                                                        master.distance_level === 1 ? "secondary" : 
                                                        "outline"
                                                    }
                                                    className={
                                                        master.distance_level === 2 ? "bg-green-600 hover:bg-green-700" :
                                                        master.distance_level === 1 ? "bg-blue-600 hover:bg-blue-700 text-white" :
                                                        "text-muted-foreground"
                                                    }
                                                >
                                                    {master.distance_level_name}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className="font-mono">
                                                        {master.statistics.average_check.toLocaleString()}₸
                                                    </span>
                                                    {master.meets_requirements?.standard_distance && (
                                                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                                            ✓
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className="font-mono">
                                                        {master.statistics.daily_revenue.toLocaleString()}₸
                                                    </span>
                                                    {master.meets_requirements?.daily_distance_by_revenue && (
                                                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                                            ✓
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className="font-mono">
                                                        {master.statistics.net_turnover_10_days.toLocaleString()}₸
                                                    </span>
                                                    {master.meets_requirements?.daily_distance_by_turnover && (
                                                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                                            ✓
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button 
                                                        onClick={() => handleSetMasterDistance(master.master_id, 0)} 
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={loading || master.distance_level === 0}
                                                        className="text-xs"
                                                    >
                                                        Сбросить
                                                    </Button>
                                                    <Button 
                                                        onClick={() => handleSetMasterDistance(master.master_id, 1)} 
                                                        variant={master.distance_level === 1 ? "default" : "outline"}
                                                        size="sm"
                                                        disabled={loading || master.distance_level === 1}
                                                        className="text-xs"
                                                    >
                                                        Обычная
                                                    </Button>
                                                    <Button 
                                                        onClick={() => handleSetMasterDistance(master.master_id, 2)} 
                                                        variant={master.distance_level === 2 ? "default" : "outline"}
                                                        size="sm"
                                                        disabled={loading || master.distance_level === 2}
                                                        className="text-xs"
                                                    >
                                                        Суточная
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
                </CardContent>
            </Card>

            <div className="flex justify-center">
                <Button onClick={handleSave} disabled={loading} size="lg">
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Сохранение...
                        </div>
                    ) : (
                        "Сохранить изменения"
                    )}
                </Button>
            </div>
        </div>
    );
};

export default DistancePage;
