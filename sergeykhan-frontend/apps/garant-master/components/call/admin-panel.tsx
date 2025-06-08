"use client"

import React, { useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import { Phone, Users, RefreshCw, CheckCircle, XCircle, Clock, PhoneCall } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

// Типы для административной панели
interface Employee {
  id: number
  email: string
  first_name: string
  last_name: string
  role: string
  internal_number?: string
}

interface CallStatus {
  status: 'idle' | 'calling' | 'success' | 'error'
  message?: string
  timestamp?: Date
}

interface CallRecord {
  employeeId: number
  internalNumber: string
  externalNumber: string
  status: CallStatus
}

// Hook для определения темы
const useTheme = () => {
  const [isDark, setIsDark] = useState(false)
  
  useEffect(() => {
    // Проверяем системную тему и класс на документе
    const checkTheme = () => {
      const hasClass = document.documentElement.classList.contains('dark')
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDark(hasClass || prefersDark)
    }
    
    checkTheme()
    
    // Следим за изменениями
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', checkTheme)
    
    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', checkTheme)
    }
  }, [])
  
  return isDark
}

// Стили с поддержкой темной/светлой темы
const getStyles = (isDark: boolean) => ({
  container: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    background: isDark 
      ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
      : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
    minHeight: '100vh',
    color: isDark ? '#e2e8f0' : '#1e293b',
    transition: 'all 0.3s ease',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  header: {
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    color: 'white',
    borderRadius: '12px 12px 0 0',
    padding: '20px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    background: 'rgba(255, 255, 255, 0.9)',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    textAlign: 'center' as const,
  },
  employeeRow: {
    transition: 'all 0.2s ease',
    '&:hover': {
      background: 'rgba(79, 70, 229, 0.05)',
    },
  },
}

export default function AdminCallPanel() {
  // Состояние компонента
  const [integrationToken, setIntegrationToken] = useState<string>("")
  const [employees, setEmployees] = useState<Employee[]>([])
  const [callRecords, setCallRecords] = useState<CallRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [vpbxToken, setVpbxToken] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
  })

  // Генерация UUID токена при загрузке
  useEffect(() => {
    const token = uuidv4()
    setIntegrationToken(token)
    console.log("Generated integration token:", token)
  }, [])

  // Загрузка списка сотрудников
  useEffect(() => {
    loadEmployees()
    authenticateVPBX()
  }, [])

  // Обновление статистики
  useEffect(() => {
    updateStats()
  }, [employees, callRecords])

  const loadEmployees = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Загружаем всех сотрудников из разных ролей
      const [mastersRes, curatorsRes, operatorsRes] = await Promise.all([
        fetch('/api/users/masters/'),
        fetch('/api/users/curators/'),
        fetch('/api/users/operators/'),
      ])

      const [masters, curators, operators] = await Promise.all([
        mastersRes.json(),
        curatorsRes.json(),
        operatorsRes.json(),
      ])

      // Объединяем и присваиваем внутренние номера
      const allEmployees: Employee[] = [
        ...masters.map((emp: any, index: number) => ({
          ...emp,
          role: 'master',
          internal_number: `10${(index + 1).toString().padStart(2, '0')}`, // 1001, 1002, etc.
        })),
        ...curators.map((emp: any, index: number) => ({
          ...emp,
          role: 'curator',
          internal_number: `20${(index + 1).toString().padStart(2, '0')}`, // 2001, 2002, etc.
        })),
        ...operators.map((emp: any, index: number) => ({
          ...emp,
          role: 'operator',
          internal_number: `30${(index + 1).toString().padStart(2, '0')}`, // 3001, 3002, etc.
        })),
      ]

      setEmployees(allEmployees)
      console.log("Loaded employees:", allEmployees.length)
    } catch (err) {
      setError("Ошибка загрузки сотрудников: " + (err as Error).message)
      console.error("Error loading employees:", err)
    } finally {
      setLoading(false)
    }
  }

  const authenticateVPBX = async () => {
    try {
      const response = await fetch('/api/vpbx/get-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          login: 'slavakhan100',
          password: 'i4yc448p',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setVpbxToken(data.accessToken)
        console.log("VPBX authenticated successfully")
      } else {
        throw new Error("Ошибка аутентификации VPBX")
      }
    } catch (err) {
      setError("Ошибка аутентификации VPBX: " + (err as Error).message)
      console.error("VPBX auth error:", err)
    }
  }

  const updateStats = () => {
    const activeCalls = callRecords.filter(record => record.status.status === 'calling').length
    const successfulCalls = callRecords.filter(record => record.status.status === 'success').length
    const failedCalls = callRecords.filter(record => record.status.status === 'error').length

    setStats({
      totalEmployees: employees.length,
      activeCalls,
      successfulCalls,
      failedCalls,
    })
  }

  const makeCall = async (employee: Employee, externalNumber: string) => {
    if (!vpbxToken) {
      setError("Нет токена VPBX. Переаутентификация...")
      await authenticateVPBX()
      return
    }

    if (!employee.internal_number || !externalNumber) {
      setError("Не указан внутренний или внешний номер")
      return
    }

    // Обновляем статус звонка
    const callRecord: CallRecord = {
      employeeId: employee.id,
      internalNumber: employee.internal_number,
      externalNumber,
      status: { status: 'calling', timestamp: new Date() },
    }

    setCallRecords(prev => {
      const filtered = prev.filter(r => r.employeeId !== employee.id)
      return [...filtered, callRecord]
    })

    try {
      const response = await fetch('/api/vpbx/MakeCall2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${vpbxToken}`,
        },
        body: JSON.stringify({
          abonentNumber: employee.internal_number,
          number: externalNumber,
        }),
      })

      const result = await response.json()

      if (response.ok && !result.error) {
        // Успешный звонок
        setCallRecords(prev =>
          prev.map(record =>
            record.employeeId === employee.id
              ? {
                  ...record,
                  status: {
                    status: 'success',
                    message: 'Звонок инициирован',
                    timestamp: new Date(),
                  },
                }
              : record
          )
        )
      } else {
        // Ошибка звонка
        setCallRecords(prev =>
          prev.map(record =>
            record.employeeId === employee.id
              ? {
                  ...record,
                  status: {
                    status: 'error',
                    message: result.error || 'Неизвестная ошибка',
                    timestamp: new Date(),
                  },
                }
              : record
          )
        )
      }
    } catch (err) {
      setCallRecords(prev =>
        prev.map(record =>
          record.employeeId === employee.id
            ? {
                ...record,
                status: {
                  status: 'error',
                  message: (err as Error).message,
                  timestamp: new Date(),
                },
              }
            : record
        )
      )
    }
  }

  const getCallStatus = (employeeId: number): CallStatus => {
    const record = callRecords.find(r => r.employeeId === employeeId)
    return record?.status || { status: 'idle' }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'master': return 'bg-blue-100 text-blue-800'
      case 'curator': return 'bg-green-100 text-green-800'
      case 'operator': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: CallStatus['status']) => {
    switch (status) {
      case 'calling': return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />
      default: return <Phone className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div style={styles.container}>
      <Card style={styles.card}>
        <CardHeader style={styles.header}>
          <CardTitle className="flex items-center gap-3 text-2xl font-bold">
            <PhoneCall className="w-8 h-8" />
            Административная панель звонков
          </CardTitle>
          <p className="opacity-90 mt-2">
            Управление звонками через Beeline Cloud PBX
          </p>
          <div className="mt-4 p-3 bg-white/20 rounded-lg">
            <p className="text-sm font-medium">Токен интеграции:</p>
            <code className="text-xs break-all bg-black/20 px-2 py-1 rounded">
              {integrationToken}
            </code>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <XCircle className="w-4 h-4 text-red-500" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {/* Статистика */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <Users className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</p>
              <p className="text-sm text-gray-600">Всего сотрудников</p>
            </div>
            <div style={styles.statCard}>
              <Clock className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold text-gray-900">{stats.activeCalls}</p>
              <p className="text-sm text-gray-600">Активные звонки</p>
            </div>
            <div style={styles.statCard}>
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold text-gray-900">{stats.successfulCalls}</p>
              <p className="text-sm text-gray-600">Успешных звонков</p>
            </div>
            <div style={styles.statCard}>
              <XCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <p className="text-2xl font-bold text-gray-900">{stats.failedCalls}</p>
              <p className="text-sm text-gray-600">Неудачных звонков</p>
            </div>
          </div>

          {/* Кнопки управления */}
          <div className="flex gap-3 mb-6">
            <Button
              onClick={loadEmployees}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Обновить список
            </Button>
            <Button
              onClick={authenticateVPBX}
              variant="outline"
              className="border-blue-200"
            >
              <Phone className="w-4 h-4 mr-2" />
              Переподключиться к VPBX
            </Button>
          </div>

          {/* Таблица сотрудников */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Список сотрудников
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Сотрудник</TableHead>
                    <TableHead>Роль</TableHead>
                    <TableHead>Внутренний номер</TableHead>
                    <TableHead>Внешний номер</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Действие</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => {
                    const callStatus = getCallStatus(employee.id)
                    return (
                      <TableRow key={employee.id} style={styles.employeeRow}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {employee.first_name} {employee.last_name}
                            </p>
                            <p className="text-sm text-gray-500">{employee.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(employee.role)}>
                            {employee.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                            {employee.internal_number}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="+996555123456"
                            className="w-36"
                            id={`external-${employee.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(callStatus.status)}
                            <span className="text-sm">
                              {callStatus.message || callStatus.status}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => {
                              const input = document.getElementById(`external-${employee.id}`) as HTMLInputElement
                              const externalNumber = input?.value
                              if (externalNumber) {
                                makeCall(employee, externalNumber)
                              }
                            }}
                            disabled={callStatus.status === 'calling' || !vpbxToken}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Phone className="w-4 h-4 mr-1" />
                            Звонить
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {employees.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Сотрудники не найдены</p>
                </div>
              )}

              {loading && (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-500" />
                  <p className="text-gray-500">Загрузка сотрудников...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
