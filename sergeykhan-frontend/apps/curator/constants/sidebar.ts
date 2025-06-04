import {
    Home,
    ClipboardList,
    UserPlus,
    ChartColumn,
    Headset,
    BookPlus,
    Anvil,
    User,  // added User icon for Абоненты tab
    BarChart3,
    Calendar,
    CalendarPlus,
    CheckCircle  // added CheckCircle icon for Завершения заказов
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
                title: "Доступные заказы",
                url: "/orders",
                icon: ClipboardList,
            },
            {
                title: "Не обзвоненные",
                url: "/not_called",
                icon: Headset,
            },            {
                title: "Управление мастерами",
                url: "/master-management",
                icon: Anvil,
            },
            {
                title: "Рабочая нагрузка мастеров",
                url: "/master-workload",
                icon: BarChart3,
            },
            {
                title: "Завершения заказов",
                url: "/completions",
                icon: CheckCircle,
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
    }
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