import { Home, Headset, ChartColumn, UserRound, CalendarCheck, Settings, ChartNoAxesCombined, User, CalendarPlus } from 'lucide-react';

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
                title: "Не обзвоненные",
                url: "/not_called",
                icon: Headset,
            },
            {
                title: "Создать заказ",
                url: "/orders/create",
                icon: CalendarPlus,
            },
            {
                title: "Финансы",
                url: "/finance",
                icon: ChartColumn,
            },
        ]
    },
]