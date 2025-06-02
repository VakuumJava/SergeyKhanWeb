'use client'

import React, { useState, useEffect } from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {api} from "@shared/utils/api";



const PercentagesPage = () => {
    // Section 1: Calculation of clean profit distribution
    const [masterAdvance, setMasterAdvance] = useState(0); // advance_percent (%)
    const [masterCashDesk, setMasterCashDesk] = useState(0); // initial_kassa_percent (%)

    // Section 2: Distribution of money by the curator
    const [immediateCash, setImmediateCash] = useState(0); // cash_percent (%)
    const [creditedBalance, setCreditedBalance] = useState(0); // balance_percent (%)
    const [curatorPercent, setCuratorPercent] = useState(0); // curator_percent (%)
    const [companyDesk, setCompanyDesk] = useState(0); // final_kassa_percent (%)

    // Fetch existing settings on mount
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await api.get("/profit-distribution/");
                setMasterAdvance(data.advance_percent);
                setMasterCashDesk(data.initial_kassa_percent);
                setImmediateCash(data.cash_percent);
                setCreditedBalance(data.balance_percent);
                setCuratorPercent(data.curator_percent);
                setCompanyDesk(data.final_kassa_percent);
            } catch (error) {
                console.error("Ошибка при загрузке настроек:", error);
            }
        };
        fetchSettings();
    }, []);

    // Save settings via PUT
    const handleSave = async () => {
        try {
            const payload = {
                advance_percent: masterAdvance,
                initial_kassa_percent: masterCashDesk,
                cash_percent: immediateCash,
                balance_percent: creditedBalance,
                curator_percent: curatorPercent,
                final_kassa_percent: companyDesk,
            };
            await api.put("/profit-distribution/", payload);
            console.log("Процентные ставки успешно обновлены", payload);
        } catch (error) {
            console.error("Ошибка при сохранении настроек:", error);
        }
    };

    return (
        <div className="md:max-w-3xl md:mx-auto md:p-6">
            <h1 className="text-2xl font-bold mb-6 text-center">
                Настройки процентных ставок
            </h1>

            {/* Section 1: Clean Profit Calculation */}
            <div className="mb-8 border p-4 rounded">
                <h2 className="text-xl font-semibold mb-2">Расчёт чистой прибыли</h2>
                <p className="mb-4 text-gray-600">
                    Чистая прибыль = сумма заказа - расходы мастера.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Аванс мастеру (%)
                        </label>
                        <Input
                            type="number"
                            value={masterAdvance}
                            onChange={(e) => setMasterAdvance(Number(e.target.value))}
                            className="mt-1 block w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Сдача в кассу (%)
                        </label>
                        <Input
                            type="number"
                            value={masterCashDesk}
                            onChange={(e) => setMasterCashDesk(Number(e.target.value))}
                            className="mt-1 block w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Section 2: Distribution of Funds */}
            <div className="mb-8 border p-4 rounded">
                <h2 className="text-xl font-semibold mb-2">
                    Распределение финансов куратором
                </h2>
                <p className="mb-4 text-gray-600">
                    Мастер передает деньги куратору, который распределяет их следующим образом:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Наличные мастеру сразу (%)
                        </label>
                        <Input
                            type="number"
                            value={immediateCash}
                            onChange={(e) => setImmediateCash(Number(e.target.value))}
                            className="mt-1 block w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Зачисление на баланс мастеру (%)
                        </label>
                        <Input
                            type="number"
                            value={creditedBalance}
                            onChange={(e) => setCreditedBalance(Number(e.target.value))}
                            className="mt-1 block w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Куратору (%)
                        </label>
                        <Input
                            type="number"
                            value={curatorPercent}
                            onChange={(e) => setCuratorPercent(Number(e.target.value))}
                            className="mt-1 block w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Касса компании (%)
                        </label>
                        <Input
                            type="number"
                            value={companyDesk}
                            onChange={(e) => setCompanyDesk(Number(e.target.value))}
                            className="mt-1 block w-full"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-center">
                <Button onClick={handleSave}>Сохранить изменения</Button>
            </div>
        </div>
    );
};

export default PercentagesPage;
