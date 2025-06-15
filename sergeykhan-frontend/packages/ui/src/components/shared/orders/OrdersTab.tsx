"use client"

import React, { useState, useEffect } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge
} from '@workspace/ui/components/ui'
import UnifiedOrderTable from "./UnifiedOrderTable"
import { Clock } from "lucide-react"

type UserStatusT = 'curator' | 'master' | 'operator'
type AccessStatusT = 'pro' | 'max' | 'none'
type UserRoleT = 'super-admin' | 'curator' | 'master' | 'garant-master'

interface OrdersTabProps {
    status: UserStatusT
    accessStatus?: AccessStatusT
    userRole?: UserRoleT // New prop for better role handling
}

const capitalize = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1)

const OrdersTab: React.FC<OrdersTabProps> = ({ status, accessStatus = 'none', userRole }) => {
    const [currentUserId, setCurrentUserId] = useState<number | undefined>()

    // Get current user ID from localStorage or context
    useEffect(() => {
        const userId = localStorage.getItem('userId')
        if (userId) {
            setCurrentUserId(parseInt(userId))
        }
    }, [])

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

    // Determine user role based on status if not provided
    const resolvedUserRole: UserRoleT = userRole || (
        status === 'curator' ? 'curator' : 
        status === 'master' ? 'master' : 
        'master' // fallback
    )

    // Get title based on role
    const getTitle = () => {
        switch (resolvedUserRole) {
            case 'super-admin':
            case 'curator':
                return 'Распределение заказов'
            case 'master':
                return 'Доступные заказы'
            case 'garant-master':
                return 'Перезавершить заказы'
            default:
                return 'Заказы'
        }
    }

    return (
        <UnifiedOrderTable 
            userRole={resolvedUserRole}
            currentUserId={currentUserId}
            title={getTitle()}
        />
    )
}

export default OrdersTab
