"use client"

import React, { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge
} from '@workspace/ui/components/ui'
import Last4hours from "@shared/orders/last4hours"
import NonActiveOrders from "@shared/orders/NonActiveOrders"
import ActiveOrders from "@shared/orders/ActiveOrders"
import AllOrders from "@shared/orders/AllOrders"
import Last24hours from "@shared/orders/last24hours"
import NewOrders from "./NewOrders"
import { Clock } from "lucide-react"

type OrdersTypeT = 'all' | '4hours' | '24hours' | 'non-active' | 'active' | 'new'
type UserStatusT = 'curator' | 'master' | 'operator'
type AccessStatusT = 'pro' | 'max' | 'none'

interface OrdersTabProps {
    status: UserStatusT
    accessStatus?: AccessStatusT
}

const capitalize = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1)

const OrdersTab: React.FC<OrdersTabProps> = ({ status, accessStatus = 'none' }) => {
    if (!accessStatus || accessStatus === 'none') {
        return <div className="container mx-auto p-6">
            <Card className="border-destructive">
                <CardContent className="pt-6">
                    <div className="text-center">
                        <h1 className="text-xl font-medium">
                            У вас нет доступа к этой странице
                        </h1>
                    </div>
                </CardContent>
            </Card>
        </div>
    }

    const getAccessTab = (): OrdersTypeT =>
        accessStatus === 'pro' ? '4hours' : '24hours'

    const defaultTab = getAccessTab()

    const availableTabs: OrdersTypeT[] =
        status === 'curator'
            ? ['new', 'all', defaultTab, 'non-active', 'active']
            : [defaultTab]

    const [ordersType, setOrdersType] = useState<OrdersTypeT>(defaultTab)

    const handleClick = (type: OrdersTypeT) => setOrdersType(type)

    const renderContent = () => {
        switch (ordersType) {
            case 'new':
                return <NewOrders />
            case 'all':
                return <AllOrders isActiveEdit={false} onSelectedChange={() => {}} />
            case '4hours':
                return <Last4hours />
            case '24hours':
                return <Last24hours />
            case 'non-active':
                return <NonActiveOrders />
            case 'active':
                return <ActiveOrders isActiveEdit={false} onSelectedChange={() => {}} />
            default:
                return null
        }
    }

    const getTabTitle = () => {
        switch (ordersType) {
            case 'new': return "Новые заказы";
            case 'all': return "Все заказы";
            case '4hours': return "Заказы за 4 часа";
            case '24hours': return "Заказы за 24 часа";
            case 'non-active': return "Неактивные заказы";
            case 'active': return "Активные заказы";
            default: return "Заказы";
        }
    }

    const getTabDescription = () => {
        switch (ordersType) {
            case 'new': return "Новые заказы, ожидающие обработки";
            case 'all': return "Управление всеми заказами в системе";
            case '4hours': return "Заказы, созданные за последние 4 часа";
            case '24hours': return "Заказы, созданные за последние 24 часа";
            case 'non-active': return "Неактивные и архивированные заказы";
            case 'active': return "Активные заказы в обработке";
            default: return "";
        }
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {getTabTitle()}
                    </h1>
                    <p className="text-muted-foreground">
                        {getTabDescription()}
                    </p>
                </div>
                <Badge variant="secondary" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {status === 'curator' ? 'Куратор' : status === 'master' ? 'Мастер' : 'Оператор'}
                </Badge>
            </div>

            {/* Tabs */}
            <div className="flex flex-row gap-3">
                {availableTabs.map((tab) => (
                    <Button
                        key={tab}
                        variant={ordersType === tab ? "default" : "outline"}
                        onClick={() => handleClick(tab)}
                    >
                        {tab === '4hours'
                            ? "4 часа"
                            : tab === '24hours'
                                ? "24 часа"
                                : capitalize(tab)}
                    </Button>
                ))}
            </div>

            {/* Content */}
            <Card>
                <CardHeader>
                    <CardTitle>{getTabTitle()}</CardTitle>
                </CardHeader>
                <CardContent>
                    {renderContent()}
                </CardContent>
            </Card>
        </div>
    )
}

export default OrdersTab
