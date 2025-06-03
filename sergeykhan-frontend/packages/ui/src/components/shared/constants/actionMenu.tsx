"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@workspace/ui/components/dropdown-menu";
import { Button } from "@workspace/ui/components/button";
import type { Order } from "@shared/constants/orders";

export interface ActionsMenuProps {
  order: Order;
}

export const ActionsMenu: React.FC<ActionsMenuProps> = ({ order }) => {
  const handleTakeOrder = () => {
    // Здесь можно вызвать API для назначения заказа текущему пользователю
    // или обновить состояние, затем обновить список
    console.log(`Взять заказ ${order.id}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          Действия
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={handleTakeOrder}>
          Взять заказ
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
