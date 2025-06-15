import { Home, ClipboardList, CalendarDays, ChartColumn, UserRound, CalendarCheck, Settings, ChartNoAxesCombined, Clock, Phone } from 'lucide-react';

export const sidebar_items = [
    {
      name: "Основные",
      list: [
        {
          title: "Главная",
          url: "/",
          icon: Home,
        }
      ]
    },
    {
        name: "Инструменты",
        list: [
          {
                title: "Доступные заказы",
                url: "/orders",
                icon: ClipboardList,
            },            {
                title: "Взятые заказы",
                url: "/orders-taken",
                icon: ClipboardList,
            },
            {
                title: "Мое расписание",
                url: "/schedule",
                icon: Clock,
            },
            {
                title: "Финансы",
                url: "/finance",
                icon: ChartColumn,
            }
        ]
    },
]