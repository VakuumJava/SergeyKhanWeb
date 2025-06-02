"use client";

import * as React from "react";
import { OrdersDataTable } from "./OrdersTable";
import { columns,  } from "@shared/constants/orders";

// // Функция фильтрации заказов за последние 7 дней
// const getRecentOrders = () => {
//     const sevenDaysAgo = new Date();
//     sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
//
//     return ordersData.filter(order => {
//         const orderDate = new Date(order.date); // Убедись, что `createdAt` есть в order
//         return orderDate >= sevenDaysAgo;
//     });
// };

export default function NewOrders() {
    // const recentOrders = getRecentOrders(); // Получаем заказы за последние 7 дней

    return (
        <div>
            {/* <ContentLayout title={'Новые заказы'} footer={`${recentOrders.length} штук`}> */}
            {/*<OrdersDataTable data={recentOrders} columns={columns} />*/}
            {/* </ContentLayout> */}
        </div>
    );
}
