'use client'

import React, { useState, useEffect } from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { api } from "@shared/utils/api";

const PercentagesPage = () => {
    const [masterPaidPercent, setMasterPaidPercent] = useState(30);
    const [masterBalancePercent, setMasterBalancePercent] = useState(30);
    const [curatorPercent, setCuratorPercent] = useState(5);
    const [companyPercent, setCompanyPercent] = useState(35);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [updatedBy, setUpdatedBy] = useState<string | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await api.get("/profit-distribution/");
                setMasterPaidPercent(data.master_paid_percent);
                setMasterBalancePercent(data.master_balance_percent);
                setCuratorPercent(data.curator_percent);
                setCompanyPercent(data.company_percent);
                setLastUpdated(data.updated_at);
                setUpdatedBy(data.updated_by);
            } catch (error) {
                console.error("Ошибка при загрузке настроек:", error);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            const payload = {
                master_paid_percent: masterPaidPercent,
                master_balance_percent: masterBalancePercent,
                curator_percent: curatorPercent,
                company_percent: companyPercent,
            };

            const { data } = await api.put("/profit-distribution/", payload);
            console.log("Процентные ставки успешно обновлены", data);
            
            // Обновляем информацию о последнем изменении
            setLastUpdated(new Date().toISOString());
            
            alert("Настройки успешно сохранены!\n" + (data.changes || ""));
        } catch (error: any) {
            console.error("Ошибка при сохранении настроек:", error);
            const errorMessage = error.response?.data?.details?.join(', ') || 
                                error.response?.data?.error || 
                                "Неизвестная ошибка";
            alert(`Ошибка при сохранении: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const totalPercent = masterPaidPercent + masterBalancePercent + curatorPercent + companyPercent;
    const isValidTotal = totalPercent === 100;

    return (
        <div className="md:max-w-4xl md:mx-auto md:p-6">
            <h1 className="text-2xl font-bold mb-6 text-center">
                Настройки процентных ставок распределения прибыли
            </h1>

            {lastUpdated && (
                <div className="mb-6 p-4 bg-gray-100 rounded border">
                    <p className="text-sm text-gray-600">
                        Последнее обновление: {new Date(lastUpdated).toLocaleString('ru-RU')}
                        {updatedBy && ` пользователем ${updatedBy}`}
                    </p>
                </div>
            )}

            <div className="mb-8 border p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">
                    Распределение прибыли при завершении заказа
                </h2>
                <p className="mb-6 text-gray-600">
                    Настройка процентов распределения чистой прибыли (сумма заказа - расходы мастера) между участниками.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-800">Мастеру</h3>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Выплачено сразу (%)
                            </label>
                            <Input
                                type="number"
                                min="0"
                                max="100"
                                value={masterPaidPercent}
                                onChange={(e) => setMasterPaidPercent(Number(e.target.value))}
                                className="w-full"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Сумма которая сразу увеличивает выплаченный баланс мастера
                            </p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                На баланс мастера (%)
                            </label>
                            <Input
                                type="number"
                                min="0"
                                max="100"
                                value={masterBalancePercent}
                                onChange={(e) => setMasterBalancePercent(Number(e.target.value))}
                                className="w-full"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Сумма которая добавляется на баланс мастера
                            </p>
                        </div>
                        
                        <div className="p-3 bg-blue-50 rounded">
                            <p className="text-sm font-medium text-blue-800">
                                Итого мастеру: {masterPaidPercent + masterBalancePercent}%
                            </p>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-800">Остальные участники</h3>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Куратору на баланс (%)
                            </label>
                            <Input
                                type="number"
                                min="0"
                                max="100"
                                value={curatorPercent}
                                onChange={(e) => setCuratorPercent(Number(e.target.value))}
                                className="w-full"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Вознаграждение куратору за проверку завершения
                            </p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                В кассу компании (%)
                            </label>
                            <Input
                                type="number"
                                min="0"
                                max="100"
                                value={companyPercent}
                                onChange={(e) => setCompanyPercent(Number(e.target.value))}
                                className="w-full"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Доход компании от заказа
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-6 p-4 rounded border" style={{
                backgroundColor: isValidTotal ? '#f0f9ff' : '#fef2f2',
                borderColor: isValidTotal ? '#3b82f6' : '#ef4444'
            }}>
                <p className={`text-lg font-semibold ${isValidTotal ? 'text-blue-800' : 'text-red-800'}`}>
                    Общая сумма: {totalPercent}%
                </p>
                {!isValidTotal && (
                    <p className="text-red-600 text-sm mt-1">
                        ⚠️ Сумма должна быть равна 100%
                    </p>
                )}
                {isValidTotal && (
                    <p className="text-blue-600 text-sm mt-1">
                        ✅ Настройки корректны
                    </p>
                )}
            </div>

            <div className="flex justify-center">
                <Button 
                    onClick={handleSave}
                    disabled={!isValidTotal || loading}
                    className={`px-8 py-2 ${!isValidTotal ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {loading ? 'Сохранение...' : 'Сохранить изменения'}
                </Button>
            </div>
        </div>
    );
};

export default PercentagesPage;
