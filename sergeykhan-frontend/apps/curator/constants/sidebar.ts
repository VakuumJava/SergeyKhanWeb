import {
    Home,
    ClipboardList,
    UserPlus,
    ChartColumn,
    Headset,
    BookPlus,
    Anvil,
    User  // added User icon for Абоненты tab
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
            },{
                title: "Управление мастерами",
                url: "/master-management",
                icon: Anvil,
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
                title: "Форма для заказа",
                url: "/form_for_order",
                icon: BookPlus,
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