import { Home, ClipboardList, CalendarDays, ChartColumn, UserRound, CalendarCheck, Settings, ChartNoAxesCombined, Clock } from 'lucide-react';

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
            },
          {
                title: "Взятые заказы",
                url: "/orders-taken",
                icon: ClipboardList,
            },
            {
                title: "Календарь загруженности",
                url: "/calendar",
                icon: CalendarDays,
            },
            {
                title: "Финансы",
                url: "/finance",
                icon: ChartColumn,
            },
            {
                title: "Позвонить",
                url: "/call",
                icon: ChartColumn,
            }
        ]
    },
]