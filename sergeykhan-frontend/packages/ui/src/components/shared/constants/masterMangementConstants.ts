// "use client";
import {ActionsMenu} from "@workspace/ui/components/shared/constants/actionMenu";
import * as React from "react";
import {Curator, Master, Operator} from "@shared/constants/types";
import {ColumnDef, Row} from "@tanstack/react-table";

export const mastersData: Master[] = [
    {
        id: "1",
        name: "John Doe",
        balance: 1000,
        // orders: [
        //     {
        //         id: "1",
        //         contact: "+996 557 819 199",
        //         orderNumber: "3XP/3999",
        //         date: "2025-03-07 14:30",
        //         client: "Иванов И.И.",
        //         address: "ул. Абая, 10",
        //         problem: "Протечка крана",
        //         cost: "5000 ₸",
        //         executionTime: "2025-03-08 09:00",
        //         master: "John Doe",
        //         status: "Открытый",
        //         actions: ActionsMenu,
        //     },
        //     {
        //         id: "2",
        //         contact: "+996 555 123 456",
        //         orderNumber: "4XT/4000",
        //         date: "2025-03-08 10:15",
        //         client: "Петров П.П.",
        //         address: "ул. Назарбаева, 25",
        //         problem: "Не работает розетка",
        //         cost: "3500 ₸",
        //         executionTime: "2025-03-08 16:00",
        //         master: "John Doe",
        //         status: "В работе",
        //         actions: ActionsMenu,
        //     },
        // ],
    },
    {
        id: "2",
        name: "Jane Smith",
        balance: 1500,
    //     orders: [
    //         {
    //             id: "3",
    //             contact: "+996 700 987 654",
    //             orderNumber: "5YT/4001",
    //             date: "2025-03-09 12:45",
    //             client: "Семенова А.А.",
    //             address: "ул. Манаса, 5",
    //             problem: "Засор в канализации",
    //             cost: "7500 ₸",
    //             executionTime: "2025-03-09 18:30",
    //             master: "Jane Smith",
    //             status: "Ожидание",
    //             actions: ActionsMenu,
    //         },
    //         {
    //             id: "4",
    //             contact: "+996 777 654 321",
    //             orderNumber: "6ZR/4002",
    //             date: "2025-03-10 09:20",
    //             client: "Ковалёв В.В.",
    //             address: "пр. Тыныстанова, 15",
    //             problem: "Замена проводки",
    //             cost: "12000 ₸",
    //             executionTime: "2025-03-11 14:00",
    //             master: "Jane Smith",
    //             status: "Завершено",
    //             actions: ActionsMenu,
    //         },
    //     ],
    // },
    // {
    //     id: "3",
    //     name: "Mike Johnson",
    //     balance: 750,
    //     orders: [
    //         {
    //             id: "5",
    //             contact: "+996 559 789 012",
    //             orderNumber: "7XP/4003",
    //             date: "2025-03-11 16:40",
    //             client: "Миронова Л.А.",
    //             address: "ул. Байтик Баатыра, 50",
    //             problem: "Неисправность стиральной машины",
    //             cost: "9500 ₸",
    //             executionTime: "2025-03-12 11:30",
    //             master: "Mike Johnson",
    //             status: "Открытый",
    //             actions: ActionsMenu,
    //         },
    //     ],
    // },
    // {
    //     id: "4",
    //     name: "Alice Brown",
    //     balance: 2000,
    //     orders: [
    //         {
    //             id: "6",
    //             contact: "+996 501 222 333",
    //             orderNumber: "8XT/4004",
    //             date: "2025-03-12 08:10",
    //             client: "Алиев К.К.",
    //             address: "ул. Ахунбаева, 77",
    //             problem: "Не работает кондиционер",
    //             cost: "8000 ₸",
    //             executionTime: "2025-03-12 17:00",
    //             master: "Alice Brown",
    //             status: "В работе",
    //             actions: ActionsMenu,
    //         },
    //     ],
    },
    {
        id: "5",
        name: "Bob Martin",
        balance: 500,
        // orders: [
        //     {
        //         id: "7",
        //         contact: "+996 703 444 555",
        //         orderNumber: "9YT/4005",
        //         date: "2025-03-13 13:00",
        //         client: "Бекова Ж.М.",
        //         address: "ул. Чокморова, 20",
        //         problem: "Проблемы с отоплением",
        //         cost: "11000 ₸",
        //         executionTime: "2025-03-14 09:00",
        //         master: "Bob Martin",
        //         status: "Ожидание",
        //         actions: ActionsMenu,
        //     },
        // ],
    },
    {
        id: "6",
        name: "Charlie Brown",
        balance: 1800,
        // orders: [
        //     {
        //         id: "8",
        //         contact: "+996 707 666 777",
        //         orderNumber: "10ZR/4006",
        //         date: "2025-03-14 11:30",
        //         client: "Токтосунов Д.А.",
        //         address: "ул. Абдымомунова, 33",
        //         problem: "Замена замка в двери",
        //         cost: "6000 ₸",
        //         executionTime: "2025-03-14 16:00",
        //         master: "Charlie Brown",
        //         status: "Завершено",
        //         actions: ActionsMenu,
        //     },
        // ],
    },
    {
        id: "7",
        name: "Diana Prince",
        balance: 2200,
        // orders: [
        //     {
        //         id: "9",
        //         contact: "+996 501 333 444",
        //         orderNumber: "11XP/4007",
        //         date: "2025-03-15 10:00",
        //         client: "Сидоров А.А.",
        //         address: "ул. Ленина, 7",
        //         problem: "Проблема с отоплением",
        //         cost: "9000 ₸",
        //         executionTime: "2025-03-15 15:00",
        //         master: "Diana Prince",
        //         status: "Открытый",
        //         actions: ActionsMenu,
        //     },
        //     {
        //         id: "10",
        //         contact: "+996 501 333 555",
        //         orderNumber: "12XP/4008",
        //         date: "2025-03-16 11:00",
        //         client: "Смирнов С.С.",
        //         address: "ул. Фрунзе, 12",
        //         problem: "Замена ламп",
        //         cost: "4000 ₸",
        //         executionTime: "2025-03-16 16:00",
        //         master: "Diana Prince",
        //         status: "В работе",
        //         actions: ActionsMenu,
        //     },
        // ],
    },
];


export const curatorsData: Curator[] = [
    {
        id: "1",
        name: "Иванов Иван",
        balance: 1000,
        masters: [
            {
                id: "1",
                name: "John Doe",
                balance: 1000,
                // orders: [
                //     {
                //         id: "1",
                //         contact: "+996 557 819 199",
                //         orderNumber: "3XP/3999",
                //         date: "2025-03-07 14:30",
                //         client: "Иванов И.И.",
                //         address: "ул. Абая, 10",
                //         problem: "Протечка крана",
                //         cost: "5000 ₸",
                //         executionTime: "2025-03-08 09:00",
                //         master: "John Doe",
                //         status: "Открытый",
                //         actions: ActionsMenu,
                //     },
                //     {
                //         id: "2",
                //         contact: "+996 555 123 456",
                //         orderNumber: "4XT/4000",
                //         date: "2025-03-08 10:15",
                //         client: "Петров П.П.",
                //         address: "ул. Назарбаева, 25",
                //         problem: "Не работает розетка",
                //         cost: "3500 ₸",
                //         executionTime: "2025-03-08 16:00",
                //         master: "John Doe",
                //         status: "В работе",
                //         actions: ActionsMenu,
                //     },
                // ],
            },
            {
                id: "2",
                name: "Jane Smith",
                balance: 1500,
                // orders: [
                //     {
                //         id: "3",
                //         contact: "+996 700 987 654",
                //         orderNumber: "5YT/4001",
                //         date: "2025-03-09 12:45",
                //         client: "Семенова А.А.",
                //         address: "ул. Манаса, 5",
                //         problem: "Засор в канализации",
                //         cost: "7500 ₸",
                //         executionTime: "2025-03-09 18:30",
                //         master: "Jane Smith",
                //         status: "Ожидание",
                //         actions: ActionsMenu,
                //     }
                // ]
            }]
    }
]


export const operatorsData: Operator[] = [
    {
        id: "1",
        name: "Иван Авен",
        balance: 1000,
        called: [
            {
                id: "213",
                name: "Popkin Leha",
                number: "+99999999",
                date: "2025-03-07 14:30",
                status: "called"
            },
            {
                id: "213",
                name: "Popkin Leha",
                number: "+99999999",
                date: "2025-03-07 14:30",
                status: "called"
            },
            {
                id: "213",
                name: "Popkin Leha",
                number: "+99999999",
                date: "2025-03-07 14:30",
                status: "called"
            },
        ]
    },
    {
        id: "2",
        name: "Иван Авен",
        balance: 1000,
        called: [
            {
                id: "213",
                name: "Popkin Leha",
                number: "+99999999",
                date: "2025-03-07 14:30",
                status: "called"
            },
            {
                id: "213",
                name: "Popkin Leha",
                number: "+99999999",
                date: "2025-03-07 14:30",
                status: "called"
            },
            {
                id: "213",
                name: "Popkin Leha",
                number: "+99999999",
                date: "2025-03-07 14:30",
                status: "called"
            },
        ]
    },
    {
        id: "3",
        name: "Иван Авен",
        balance: 1000,
        called: [
            {
                id: "213",
                name: "Popkin Leha",
                number: "+99999999",
                date: "2025-03-07 14:30",
                status: "called"
            },
            {
                id: "213",
                name: "Popkin Leha",
                number: "+99999999",
                date: "2025-03-07 14:30",
                status: "called"
            },
            {
                id: "213",
                name: "Popkin Leha",
                number: "+99999999",
                date: "2025-03-07 14:30",
                status: "called"
            },
        ]
    },
]



export const useColumns = () =>
    React.useMemo<ColumnDef<Master>[]>(
        () => [
            {
                accessorKey: "id",
                header: "ID",
            },
            {
                accessorKey: "name",
                header: "Name",
                enableSorting: true,
            },
            {
                accessorKey: "balance",
                header: "Balance",
                enableSorting: true,
            },
            {
                accessorKey: "orders",
                header: "Qnt of Orders",
                // Используем типизацию параметра row для корректного доступа к данным
                // cell: ({ row }: { row: Row<Master> }) => row.original.orders?.length ?? 0,
                enableSorting: true,
            },
        ],
        []
    );