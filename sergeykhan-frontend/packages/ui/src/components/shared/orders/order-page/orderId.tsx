"use client";

import { notFound } from "next/navigation";
import * as React from "react";
import type { Order } from "@shared/constants/orders";
import { ActionsMenu } from "@workspace/ui/components/shared/constants/actionMenu";

const maskPhoneNumber = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 5) return phone;
  const start = digits.slice(0, 3);
  const end = digits.slice(-2);
  const masked = '*'.repeat(digits.length - 5);
  return `${start}${masked}${end}`;
};

export default function OrderDetails({ order }: { order: Order }) {
  if (!order) return notFound();

  const info: { label: string; value: React.ReactNode }[] = [
    { label: 'Номер заказа', value: order.id },
    { label: 'Дата создания', value: new Date(order.created_at).toLocaleString() },
    { label: 'Клиент', value: order.client_name },
    { label: 'Контакт', value: maskPhoneNumber(order.client_phone) },
    { label: 'Адрес', value: order.address },
    { label: 'Описание', value: order.description },
    { label: 'Итоговая стоимость', value: `${order.final_cost} ₸` },
    { label: 'Мастер', value: order.assigned_master ?? 'Не назначен' },
    { label: 'Статус', value: order.status },
  ];

  return (
    <div>
      <h1>Детали заказа #{order.id}</h1>
      <dl>
        {info.map(({ label, value }) => (
          <React.Fragment key={label}>
            <dt><strong>{label}:</strong></dt>
            <dd>{value}</dd>
          </React.Fragment>
        ))}
      </dl>
      <ActionsMenu order={order} />
    </div>
  );
}
