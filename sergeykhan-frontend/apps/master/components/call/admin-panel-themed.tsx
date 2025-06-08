"use client"

import React, { useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import { Phone, Users, RefreshCw, CheckCircle, XCircle, Clock, PhoneCall, Moon, Sun } from "lucide-react"
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

// Hook для определения темы (по умолчанию светлая)
const useTheme = () => {
  const [isDark, setIsDark] = useState(false)
  
  useEffect(() => {
    // Проверяем ТОЛЬКО явно установленный класс dark на документе
    // Игнорируем системные настройки по умолчанию
    const checkTheme = () => {
      const hasClass = document.documentElement.classList.contains('dark')
      setIsDark(hasClass) // Только если явно установлен класс dark
    }
    
    checkTheme()
    
    // Следим только за изменениями класса на документе
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    
    return () => {
      observer.disconnect()
    }
  }, [])
  
  return isDark
}

export default function AdminCallPanel() {
  const isDark = useTheme()
  
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

  // Стили с поддержкой темной/светлой темы (по умолчанию светлая)
  const themeStyles = {
    container: {
      padding: '24px',
      maxWidth: '1200px',
      margin: '0 auto',
      background: isDark 
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
        : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
      minHeight: '100vh',
      transition: 'all 0.3s ease',
    },
    mainCard: {
      background: isDark 
        ? 'rgba(30, 41, 59, 0.95)'
        : 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(10px)',
      borderRadius: '16px',
      border: isDark 
        ? '1px solid rgba(71, 85, 105, 0.3)'
        : '1px solid rgba(226, 232, 240, 0.5)',
      boxShadow: isDark
        ? '0 8px 32px rgba(0, 0, 0, 0.4)'
        : '0 8px 32px rgba(0, 0, 0, 0.08)',
    },
    header: {
      background: isDark 
        ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
        : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      color: 'white',
      borderRadius: '16px 16px 0 0',
      padding: '24px',
    },
    tokenCard: {
      background: isDark 
        ? 'rgba(0, 0, 0, 0.3)'
        : 'rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(5px)',
      borderRadius: '12px',
      padding: '16px',
      marginTop: '16px',
      border: isDark 
        ? '1px solid rgba(255, 255, 255, 0.1)'
        : '1px solid rgba(255, 255, 255, 0.3)',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '16px',
      marginBottom: '24px',
    },
    statCard: {
      background: isDark 
        ? 'rgba(51, 65, 85, 0.6)'
        : 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(5px)',
      padding: '20px',
      borderRadius: '12px',
      border: isDark 
        ? '1px solid rgba(71, 85, 105, 0.3)'
        : '1px solid rgba(226, 232, 240, 0.4)',
      textAlign: 'center' as const,
      transition: 'all 0.2s ease',
      boxShadow: isDark
        ? '0 4px 16px rgba(0, 0, 0, 0.2)'
        : '0 4px 16px rgba(0, 0, 0, 0.04)',
    },
    tableCard: {
      background: isDark 
        ? 'rgba(51, 65, 85, 0.6)'
        : 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(5px)',
      borderRadius: '12px',
      border: isDark 
        ? '1px solid rgba(71, 85, 105, 0.3)'
        : '1px solid rgba(226, 232, 240, 0.4)',
      overflow: 'hidden',
    },
    input: {
      background: isDark 
        ? 'rgba(71, 85, 105, 0.5)'
        : 'rgba(255, 255, 255, 0.9)',
      border: isDark 
        ? '1px solid rgba(71, 85, 105, 0.5)'
        : '1px solid rgba(203, 213, 225, 0.4)',
      color: isDark ? '#e2e8f0' : '#1e293b',
      borderRadius: '8px',
    },
  }

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
    if (isDark) {
      switch (role) {
        case 'master': return 'bg-blue-900/50 text-blue-300 border-blue-700'
        case 'curator': return 'bg-green-900/50 text-green-300 border-green-700'
        case 'operator': return 'bg-purple-900/50 text-purple-300 border-purple-700'
        default: return 'bg-gray-800/50 text-gray-300 border-gray-600'
      }
    } else {
      switch (role) {
        case 'master': return 'bg-blue-100 text-blue-800 border-blue-200'
        case 'curator': return 'bg-green-100 text-green-800 border-green-200'
        case 'operator': return 'bg-purple-100 text-purple-800 border-purple-200'
        default: return 'bg-gray-100 text-gray-800 border-gray-200'
      }
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
    <div style={themeStyles.container}>
      <Card style={themeStyles.mainCard} className={isDark ? 'text-gray-100' : 'text-gray-900'}>
        <CardHeader style={themeStyles.header}>
          <CardTitle className="flex items-center justify-between text-2xl font-bold">
            <div className="flex items-center gap-3">
              <PhoneCall className="w-8 h-8" />
              Административная панель звонков
            </div>
            <div className="flex items-center gap-2 text-sm opacity-90">
              {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              {isDark ? 'Темная тема' : 'Светлая тема'}
            </div>
          </CardTitle>
          <p className="opacity-90 mt-2">
            Управление звонками через Beeline Cloud PBX
          </p>
          <div style={themeStyles.tokenCard}>
            <p className="text-sm font-medium mb-2">Токен интеграции UUID v4:</p>
            <code className="text-xs break-all font-mono bg-black/20 px-3 py-2 rounded block">
              {integrationToken}
            </code>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {error && (
            <Alert className={`mb-6 ${isDark ? 'border-red-800 bg-red-900/20' : 'border-red-200 bg-red-50'}`}>
              <XCircle className="w-4 h-4 text-red-500" />
              <AlertDescription className={isDark ? 'text-red-300' : 'text-red-700'}>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Статистика */}
          <div style={themeStyles.statsGrid}>
            <div style={themeStyles.statCard}>
              <Users className="w-8 h-8 mx-auto mb-3 text-blue-500" />
              <p className={`text-3xl font-bold mb-1 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {stats.totalEmployees}
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Всего сотрудников
              </p>
            </div>
            <div style={themeStyles.statCard}>
              <Clock className="w-8 h-8 mx-auto mb-3 text-yellow-500" />
              <p className={`text-3xl font-bold mb-1 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {stats.activeCalls}
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Активные звонки
              </p>
            </div>
            <div style={themeStyles.statCard}>
              <CheckCircle className="w-8 h-8 mx-auto mb-3 text-green-500" />
              <p className={`text-3xl font-bold mb-1 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {stats.successfulCalls}
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Успешных звонков
              </p>
            </div>
            <div style={themeStyles.statCard}>
              <XCircle className="w-8 h-8 mx-auto mb-3 text-red-500" />
              <p className={`text-3xl font-bold mb-1 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {stats.failedCalls}
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Неудачных звонков
              </p>
            </div>
          </div>

          {/* Кнопки управления */}
          <div className="flex gap-3 mb-6">
            <Button
              onClick={loadEmployees}
              disabled={loading}
              className={`${isDark 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Обновить список
            </Button>
            <Button
              onClick={authenticateVPBX}
              variant="outline"
              className={isDark 
                ? 'border-blue-700 text-blue-300 hover:bg-blue-900/20' 
                : 'border-blue-200 text-blue-700 hover:bg-blue-50'
              }
            >
              <Phone className="w-4 h-4 mr-2" />
              Переподключиться к VPBX
            </Button>
          </div>

          {/* Таблица сотрудников */}
          <Card style={themeStyles.tableCard}>
            <CardHeader className={isDark ? 'text-gray-100' : 'text-gray-900'}>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Список сотрудников и управление звонками
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className={isDark ? 'border-gray-700' : 'border-gray-200'}>
                    <TableHead className={isDark ? 'text-gray-300' : 'text-gray-700'}>Сотрудник</TableHead>
                    <TableHead className={isDark ? 'text-gray-300' : 'text-gray-700'}>Роль</TableHead>
                    <TableHead className={isDark ? 'text-gray-300' : 'text-gray-700'}>Внутренний номер</TableHead>
                    <TableHead className={isDark ? 'text-gray-300' : 'text-gray-700'}>Внешний номер</TableHead>
                    <TableHead className={isDark ? 'text-gray-300' : 'text-gray-700'}>Статус</TableHead>
                    <TableHead className={isDark ? 'text-gray-300' : 'text-gray-700'}>Действие</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => {
                    const callStatus = getCallStatus(employee.id)
                    return (
                      <TableRow 
                        key={employee.id} 
                        className={`transition-all duration-200 ${
                          isDark 
                            ? 'border-gray-700 hover:bg-gray-800/30' 
                            : 'border-gray-200 hover:bg-blue-50/30'
                        }`}
                      >
                        <TableCell>
                          <div>
                            <p className={`font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                              {employee.first_name} {employee.last_name}
                            </p>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {employee.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(employee.role)}>
                            {employee.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <code className={`px-2 py-1 rounded text-sm font-mono ${
                            isDark 
                              ? 'bg-gray-800 text-green-300 border border-gray-700' 
                              : 'bg-gray-100 text-gray-800 border border-gray-200'
                          }`}>
                            {employee.internal_number}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="+996555123456"
                            className="w-36"
                            id={`external-${employee.id}`}
                            style={themeStyles.input}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(callStatus.status)}
                            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
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
                            className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
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
                <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Сотрудники не найдены</p>
                  <p className="text-sm mt-2">Нажмите "Обновить список" для загрузки данных</p>
                </div>
              )}

              {loading && (
                <div className="text-center py-12">
                  <RefreshCw className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-500" />
                  <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Загрузка сотрудников...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
