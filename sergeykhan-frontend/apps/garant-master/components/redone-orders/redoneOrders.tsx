'use client';

import React, { useState } from 'react';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from '@workspace/ui/components/dialog';
// import { ordersData } from '@shared/constants/orders';
import type { Order } from '@shared/constants/orders';

const RedoneOrders = () => {
    // const [orderId, setOrderId] = useState<string>('');
    // const [order, setOrder] = useState<Order | null>(null);
    // const [searchError, setSearchError] = useState<string>('');
    //
    // // Состояния для формы закрытия заказа
    // const [photo, setPhoto] = useState<File | null>(null);
    // const [description, setDescription] = useState<string>('');
    // const [deductAmount, setDeductAmount] = useState<string>('');
    // const [masterError, setMasterError] = useState<string>('');
    //
    // const handleSearch = () => {
    //     const foundOrder = ordersData.find((o: Order) => o.id === orderId);
    //     if (foundOrder) {
    //         setOrder(foundOrder);
    //         setSearchError('');
    //     } else {
    //         setOrder(null);
    //         setSearchError('Заказ с таким ID не существует.');
    //     }
    // };
    //
    // const handleCloseOrder = () => {
    //     // Логика закрытия заказа, например, отправка данных на сервер
    //     console.log('Закрытие заказа', {
    //         orderId,
    //         photo,
    //         description,
    //         deductAmount,
    //         masterError,
    //     });
    //     // Здесь можно добавить уведомление об успешном закрытии и сброс формы
    // };

    return (
        <div className="container mx-auto p-6">
            {/*<h1 className="text-2xl font-bold mb-4">Гарантийный мастер - Перезавершить заказы</h1>*/}

            {/*/!* Поле поиска заказа по ID *!/*/}
            {/*<div className="flex items-center mb-4">*/}
            {/*    <Input*/}
            {/*        type="text"*/}
            {/*        placeholder="Введите ID заказа"*/}
            {/*        value={orderId}*/}
            {/*        onChange={(e) => setOrderId(e.target.value)}*/}
            {/*        className="w-64"*/}
            {/*    />*/}
            {/*    <Button onClick={handleSearch} className="ml-2">*/}
            {/*        Поиск*/}
            {/*    </Button>*/}
            {/*</div>*/}
            {/*{searchError && <p className="text-red-500 mb-4">{searchError}</p>}*/}

            {/*/!* Отображение данных заказа, если он найден *!/*/}
            {/*{order && (*/}
            {/*    <Card className="mb-6">*/}
            {/*        <CardHeader>*/}
            {/*            <CardTitle>Заказ: {order.orderNumber}</CardTitle>*/}
            {/*        </CardHeader>*/}
            {/*        <CardContent>*/}
            {/*            <p>*/}
            {/*                <strong>Дата:</strong> {order.date}*/}
            {/*            </p>*/}
            {/*            <p>*/}
            {/*                <strong>Клиент:</strong> {order.client}*/}
            {/*            </p>*/}
            {/*            <p>*/}
            {/*                <strong>Контакт:</strong> {order.contact}*/}
            {/*            </p>*/}
            {/*            <p>*/}
            {/*                <strong>Адрес:</strong> {order.address}*/}
            {/*            </p>*/}
            {/*            <p>*/}
            {/*                <strong>Проблема:</strong> {order.problem}*/}
            {/*            </p>*/}
            {/*            <p>*/}
            {/*                <strong>Стоимость:</strong> {order.cost}*/}
            {/*            </p>*/}
            {/*            <p>*/}
            {/*                <strong>Время исполнения:</strong> {order.executionTime}*/}
            {/*            </p>*/}
            {/*            <p>*/}
            {/*                <strong>Мастер:</strong> {order.master}*/}
            {/*            </p>*/}
            {/*            <p>*/}
            {/*                <strong>Статус:</strong> {order.status}*/}
            {/*            </p>*/}
            {/*        </CardContent>*/}
            {/*    </Card>*/}
            {/*)}*/}

            {/*/!* Диалог для закрытия заказа *!/*/}
            {/*{order && (*/}
            {/*    <Dialog>*/}
            {/*        <DialogTrigger asChild>*/}
            {/*            <Button>Перезавершить заказ</Button>*/}
            {/*        </DialogTrigger>*/}
            {/*        <DialogContent>*/}
            {/*            <DialogHeader>*/}
            {/*                <DialogTitle>Закрыть заказ</DialogTitle>*/}
            {/*                <DialogDescription>Заполните информацию для закрытия заказа</DialogDescription>*/}
            {/*            </DialogHeader>*/}
            {/*            <div className="space-y-4">*/}
            {/*                <div>*/}
            {/*                    <label className="block mb-1">Фото исправления</label>*/}
            {/*                    <Input*/}
            {/*                        type="file"*/}
            {/*                        onChange={(e) =>*/}
            {/*                            setPhoto(e.target.files?.[0] ?? null)*/}
            {/*                        }*/}
            {/*                    />*/}
            {/*                </div>*/}
            {/*                <div>*/}
            {/*                    <label className="block mb-1">Описание исправления</label>*/}
            {/*                    <Input*/}
            {/*                        type="text"*/}
            {/*                        placeholder="Опишите, что исправлено"*/}
            {/*                        value={description}*/}
            {/*                        onChange={(e) => setDescription(e.target.value)}*/}
            {/*                    />*/}
            {/*                </div>*/}
            {/*                <div>*/}
            {/*                    <label className="block mb-1">Сумма, вычтенная с мастера</label>*/}
            {/*                    <Input*/}
            {/*                        type="number"*/}
            {/*                        placeholder="Введите сумму"*/}
            {/*                        value={deductAmount}*/}
            {/*                        onChange={(e) => setDeductAmount(e.target.value)}*/}
            {/*                    />*/}
            {/*                </div>*/}
            {/*                <div>*/}
            {/*                    <label className="block mb-1">Ошибка мастера</label>*/}
            {/*                    <Input*/}
            {/*                        type="text"*/}
            {/*                        placeholder="В чем была ошибка мастера"*/}
            {/*                        value={masterError}*/}
            {/*                        onChange={(e) => setMasterError(e.target.value)}*/}
            {/*                    />*/}
            {/*                </div>*/}
            {/*                <Button onClick={handleCloseOrder}>Закрыть заказ</Button>*/}
            {/*            </div>*/}
            {/*        </DialogContent>*/}
            {/*    </Dialog>*/}
            {/*)}*/}
        </div>
    );
};

export default RedoneOrders;
