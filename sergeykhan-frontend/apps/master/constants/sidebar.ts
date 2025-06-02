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
    {
      name: "Абоненты",
      list: [
        {
          title: "Абоненты",
          url: "/abonents",
          icon: UserRound,
        },
      ],
    },
    // {
    //     name: "Информация",
    //     list: [
    //         {
    //             title: "График работы",
    //             url: "/schedule",
    //             icon: CalendarCheck
    //         }, {
    //             title: "Профиль",
    //             url: "/profile",
    //             icon: UserRound
    //         }, {
    //             title: "Рейтинг",
    //             url: "/leaderboard",
    //             icon: ChartNoAxesCombined
    //         }, {
    //             title: "Настройки",
    //             url: "/settings",
    //             icon: Settings
    //         }
    //     ]
    // }
]