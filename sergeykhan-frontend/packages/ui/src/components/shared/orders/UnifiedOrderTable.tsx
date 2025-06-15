"use client"

import React, { useState, useEffect, useMemo } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/ui'
import { Clock, User, AlertTriangle, CheckCircle, Settings, UserCheck, UserX } from "lucide-react"
import { api } from '../utils/api'
import OrderAssignmentPanel from './order-assignment/OrderAssignmentPanel'
import { 
  checkMasterAvailability, 
  assignOrderToMaster, 
  getAllMastersWorkload,
  formatWorkloadPercentage,
  getWorkloadColorClass
} from '../utils/masterScheduleUtils'

// Types
type UserRole = 'super-admin' | 'curator' | 'master' | 'garant-master'
type OrderStatus = 'новый' | 'в обработке' | 'назначен' | 'выполняется' | 'завершен' | 'проверен' | 'одобрен'

interface Order {
  id: number
  client_name: string
  client_phone: string
  address: string
  status: OrderStatus
  assigned_master?: string
  assigned_master_id?: number
  created_at: string
  description: string
  urgent: boolean
  final_cost?: number
  payment_amount?: number
}

interface Master {
  id: number
  email: string
  full_name: string
}

interface MasterWorkload {
  master_id: number
  master_name: string
  total_slots: number
  occupied_slots: number
  free_slots: number
  workload_percentage: number
}

interface UnifiedOrderTableProps {
  userRole: UserRole
  currentUserId?: number
  title?: string
  hideRoleActions?: boolean
}

const UnifiedOrderTable: React.FC<UnifiedOrderTableProps> = ({ 
  userRole, 
  currentUserId, 
  title = "Заказы",
  hideRoleActions = false 
}) => {
  // State
  const [orders, setOrders] = useState<Order[]>([])
  const [masters, setMasters] = useState<Master[]>([])
  const [mastersWorkload, setMastersWorkload] = useState<MasterWorkload[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'new' | 'assigned' | 'completed'>('all')
  
  // Dialog states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedMasterId, setSelectedMasterId] = useState<string>('')
  const [assignLoading, setAssignLoading] = useState(false)

  // Fetch orders based on user role
  const fetchOrders = async () => {
    setLoading(true)
    setError(null)
    
    try {
      let endpoint = ''
      
      switch (userRole) {
        case 'super-admin':
        case 'curator':
          endpoint = '/api/orders/all/'
          break
        case 'master':
          // For master - get available orders based on distance rules
          endpoint = '/api/orders/master-available/'
          break
        case 'garant-master':
          // For warranty master - get transferred orders
          endpoint = '/api/orders/transferred/'
          break
        default:
          endpoint = '/api/orders/all/'
      }
      
      const response = await api.get<Order[]>(endpoint)
      setOrders(response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Ошибка загрузки заказов')
    } finally {
      setLoading(false)
    }
  }

  // Fetch masters (only for admin/curator roles)
  const fetchMasters = async () => {
    if (userRole !== 'super-admin' && userRole !== 'curator') return
    
    try {
      console.log('🔍 UnifiedOrderTable: Загрузка мастеров для роли', userRole);
      
      const [mastersResponse, workloadResponse] = await Promise.all([
        api.get<Master[]>('/users/masters/'), // Исправлен endpoint
        getAllMastersWorkload()
      ])
      
      console.log('✅ UnifiedOrderTable: Мастера загружены:', mastersResponse.data.length);
      setMasters(mastersResponse.data)
      setMastersWorkload(workloadResponse)
    } catch (err) {
      console.error('❌ UnifiedOrderTable: Ошибка загрузки мастеров:', err)
    }
  }

  useEffect(() => {
    fetchOrders()
    fetchMasters()
  }, [userRole])

  // Filter orders based on selected filter and user role
  const filteredOrders = useMemo(() => {
    let filtered = orders

    // Apply filter
    switch (filter) {
      case 'new':
        filtered = filtered.filter(order => order.status === 'новый')
        break
      case 'assigned':
        filtered = filtered.filter(order => order.assigned_master && ['назначен', 'выполняется'].includes(order.status))
        break
      case 'completed':
        filtered = filtered.filter(order => ['завершен', 'проверен', 'одобрен'].includes(order.status))
        break
      case 'all':
      default:
        // No additional filtering
        break
    }

    // Role-specific filtering
    if (userRole === 'master') {
      // Master only sees unassigned orders or orders assigned to them
      filtered = filtered.filter(order => 
        !order.assigned_master || order.assigned_master_id === currentUserId
      )
    }

    return filtered
  }, [orders, filter, userRole, currentUserId])

  // Handle order assignment
  const handleAssignOrder = async () => {
    if (!selectedOrder || !selectedMasterId) return
    
    setAssignLoading(true)
    try {
      // Use the utility function that checks availability
      await assignOrderToMaster(selectedOrder.id, parseInt(selectedMasterId))
      
      // Refresh orders and masters workload
      await Promise.all([fetchOrders(), fetchMasters()])
      setIsAssignDialogOpen(false)
      setSelectedOrder(null)
      setSelectedMasterId('')
    } catch (err: any) {
      console.error('Error assigning master:', err)
      alert(err.message || 'Ошибка при назначении мастера')
    } finally {
      setAssignLoading(false)
    }
  }

  // New function for improved assignment panel
  const handleAssignMasterImproved = async (masterId: number, slotData?: { scheduled_date: string; scheduled_time: string }) => {
    if (!selectedOrder) return
    
    try {
      console.log('🔧 UnifiedOrderTable: Назначаю мастера', masterId, 'на заказ', selectedOrder.id, 'с данными слота:', slotData);
      
      // Use the utility function that checks availability
      await assignOrderToMaster(selectedOrder.id, masterId, slotData)
      
      // Refresh orders and masters workload
      await Promise.all([fetchOrders(), fetchMasters()])
      setIsAssignDialogOpen(false)
      setSelectedOrder(null)
      
      console.log('✅ UnifiedOrderTable: Мастер успешно назначен');
    } catch (err: any) {
      console.error('❌ UnifiedOrderTable: Ошибка при назначении мастера:', err)
      alert(err.message || 'Ошибка при назначении мастера')
    }
  }

  // Handle take order (for masters)
  const handleTakeOrder = async (order: Order) => {
    if (userRole !== 'master' || !currentUserId) return
    
    try {
      // Use the utility function that checks availability
      await assignOrderToMaster(order.id, currentUserId)
      await fetchOrders()
    } catch (err: any) {
      console.error('Error taking order:', err)
      alert(err.message || 'Ошибка при взятии заказа')
    }
  }

  // Handle remove master
  const handleRemoveMaster = async (order: Order) => {
    if (userRole !== 'super-admin' && userRole !== 'curator') return
    
    try {
      await api.patch(`/assign/${order.id}/remove/`)
      await fetchOrders()
    } catch (err: any) {
      console.error('Error removing master:', err)
      alert(err.response?.data?.detail || 'Ошибка при снятии мастера')
    }
  }

  // Get action buttons based on user role and order state
  const getOrderActions = (order: Order) => {
    const actions: React.ReactElement[] = []

    if (hideRoleActions) return actions

    // Admin/Curator actions
    if (userRole === 'super-admin' || userRole === 'curator') {
      if (order.assigned_master) {
        actions.push(
          <Button
            key="remove-master"
            variant="outline"
            size="sm"
            onClick={() => handleRemoveMaster(order)}
            className="flex items-center gap-1"
          >
            <UserX className="w-3 h-3" />
            Снять
          </Button>
        )
      } else {
        actions.push(
          <Button
            key="assign-master"
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedOrder(order)
              setIsAssignDialogOpen(true)
            }}
            className="flex items-center gap-1"
          >
            <UserCheck className="w-3 h-3" />
            Назначить
          </Button>
        )
      }
    }

    // Master actions
    if (userRole === 'master') {
      if (!order.assigned_master && ['новый', 'в обработке'].includes(order.status)) {
        actions.push(
          <Button
            key="take-order"
            variant="default"
            size="sm"
            onClick={() => handleTakeOrder(order)}
            className="flex items-center gap-1"
          >
            <User className="w-3 h-3" />
            Взять
          </Button>
        )
      }
      
      if (order.assigned_master_id === currentUserId && ['назначен', 'выполняется'].includes(order.status)) {
        actions.push(
          <Button
            key="complete-order"
            variant="default"
            size="sm"
            className="flex items-center gap-1"
          >
            <CheckCircle className="w-3 h-3" />
            Завершить
          </Button>
        )
      }
    }

    return actions
  }

  // Status badge component
  const getStatusBadge = (status: OrderStatus) => {
    const statusColors = {
      'новый': 'bg-blue-100 text-blue-800',
      'в обработке': 'bg-yellow-100 text-yellow-800',
      'назначен': 'bg-purple-100 text-purple-800',
      'выполняется': 'bg-orange-100 text-orange-800',
      'завершен': 'bg-green-100 text-green-800',
      'проверен': 'bg-green-100 text-green-800',
      'одобрен': 'bg-green-100 text-green-800',
    }
    
    return (
      <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    )
  }

  // Format address based on user role
  const formatAddress = (order: Order) => {
    if (userRole === 'master' && order.assigned_master_id !== currentUserId) {
      // Hide full address for masters not assigned to order
      const parts = order.address.split(',')
      return parts.length > 1 ? `${parts[0]}, ...` : order.address.substring(0, 20) + '...'
    }
    return order.address
  }

  // Format phone based on user role
  const formatPhone = (order: Order) => {
    if (userRole === 'master' && order.assigned_master_id !== currentUserId) {
      // Mask phone for masters not assigned to order
      return order.client_phone.replace(/(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/, '+$1***$3***$5')
    }
    return order.client_phone
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Загрузка заказов...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <span>Ошибка: {error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">
            {userRole === 'curator' || userRole === 'super-admin' 
              ? 'Управление распределением заказов и назначением мастеров'
              : userRole === 'master'
              ? 'Доступные заказы для выполнения'
              : 'Заказы для перезавершения'
            }
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {userRole === 'super-admin' ? 'Супер-админ' : 
           userRole === 'curator' ? 'Куратор' : 
           userRole === 'master' ? 'Мастер' : 'Гарантийный мастер'}
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все заказы</SelectItem>
            <SelectItem value="new">Новые</SelectItem>
            <SelectItem value="assigned">Назначенные</SelectItem>
            <SelectItem value="completed">Завершенные</SelectItem>
          </SelectContent>
        </Select>
        
        <Badge variant="outline">
          Всего: {filteredOrders.length}
        </Badge>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Список заказов</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Заказы не найдены</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>Адрес</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Мастер</TableHead>
                  <TableHead>Создан</TableHead>
                  {!hideRoleActions && <TableHead>Действия</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell>{order.client_name}</TableCell>
                    <TableCell>{formatPhone(order)}</TableCell>
                    <TableCell className="max-w-xs truncate">{formatAddress(order)}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      {order.assigned_master || (
                        <span className="text-muted-foreground">Не назначен</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(order.created_at).toLocaleDateString('ru-RU')}
                    </TableCell>
                    {!hideRoleActions && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getOrderActions(order)}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Improved Order Assignment Panel */}
      <OrderAssignmentPanel
        isOpen={isAssignDialogOpen}
        onClose={() => {
          setIsAssignDialogOpen(false)
          setSelectedOrder(null)
        }}
        onAssign={(masterId: number, slotData?: { scheduled_date: string; scheduled_time: string }) => {
          console.log('🔧 UnifiedOrderTable: Получен выбор мастера', masterId, 'для заказа', selectedOrder?.id, 'с данными слота:', slotData);
          handleAssignMasterImproved(masterId, slotData);
        }}
        orderId={selectedOrder?.id}
        orderDate={selectedOrder?.created_at?.split('T')[0] || undefined}
        orderTime={selectedOrder?.created_at?.split('T')[1]?.split('.')[0] || undefined}
        loading={assignLoading}
      />
    </div>
  )
}

export default UnifiedOrderTable
