import {Order} from "@shared/constants/orders";

export type Master = {
    id: string;
    name: string;
    balance: number;
    // orders: Order[];
};

export type Curator = {
    id: string;
    name: string;
    balance: number;
    masters: Master[];
}

export type Contact = {
    id: string
    name: string
    number: string
    date: string
    status?: string
}

export type Operator = {
    id: string
    name: string
    called: Contact[]
    balance: number
}

