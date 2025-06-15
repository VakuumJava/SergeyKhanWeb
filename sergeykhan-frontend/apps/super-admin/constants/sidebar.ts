import {
    Home,
    ClipboardList,
    UserPlus,
    ChartColumn,
    Headset, Anvil,
    UserSearch, Podcast, FileClock, Wallet, User, CalendarPlus, CheckCircle, Settings, Activity
} from 'lucide-react';

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
                title: "Распределение заказов",
                url: "/orders",
                icon: ClipboardList,
            }, {
                title: "Не обзвоненные",
                url: "/not_called",
                icon: Headset,
            },{
                title: "Управление всеми",
                url: "/users",
                icon: Anvil,
            }, {
                title: "Управление дистанционкой",
                url: "/distance-management",
                icon: Podcast,
            },{
                title: "Нагрузка мастеров",
                url: "/workload-distribution",
                icon: Activity,
            },{
                title: "Завершения заказов",
                url: "/completions",
                icon: CheckCircle,
            },{
                title: "Логи",
                url: "/logs",
                icon: FileClock,
            },
            {
                title: "Финансы",
                url: "/finance",
                icon: ChartColumn,
            },
        ]
    },
    {
        name: "Формы",
        list: [
            {
                title: "Создать заказ",
                url: "/orders/create",
                icon: CalendarPlus,
            },
            {
                title: "Форма для аккаунта",
                url: "/form",
                icon: UserPlus,
            }
        ]
    },
    {
      name: "Абоненты",
      list: [
        {
          title: "Абоненты",
          url: "/abonents",
          icon: User,
        },
      ],
    },
    {
      name: "Настройки",
      list: [
        {
          title: "Управление настройками",
          url: "/settings",
          icon: Settings,
        },
      ],
    }
]