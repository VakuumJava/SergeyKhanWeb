"use client"

import React, { useEffect, useState } from 'react'
import { Clock, Phone, PhoneCall, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

interface CallRecord {
  id: string
  callingNumber: string
  receivingNumber: string
  startTime: Date
  endTime?: Date
  duration: number
  status: 'completed' | 'failed' | 'missed'
}

interface CallHistoryProps {
  onRedial?: (callingNumber: string, receivingNumber: string) => void
  className?: string
}

const formatCallDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDate = (date: Date): string => {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  if (date.toDateString() === today.toDateString()) {
    return 'Сегодня'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Вчера'
  } else {
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit'
    })
  }
}

export default function CallHistory({ onRedial, className = "" }: CallHistoryProps) {
  const [callHistory, setCallHistory] = useState<CallRecord[]>([])

  useEffect(() => {
    // Загружаем историю звонков из localStorage
    const savedHistory = localStorage.getItem('vpbx_call_history')
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory).map((record: any) => ({
          ...record,
          startTime: new Date(record.startTime),
          endTime: record.endTime ? new Date(record.endTime) : undefined
        }))
        setCallHistory(history)
      } catch (error) {
        console.error('Failed to load call history:', error)
      }
    }
  }, [])

  const addCallRecord = (record: Omit<CallRecord, 'id'>) => {
    const newRecord: CallRecord = {
      ...record,
      id: Date.now().toString()
    }
    
    const updatedHistory = [newRecord, ...callHistory].slice(0, 50) // Храним только последние 50 звонков
    setCallHistory(updatedHistory)
    
    // Сохраняем в localStorage
    localStorage.setItem('vpbx_call_history', JSON.stringify(updatedHistory))
  }

  const getStatusIcon = (status: CallRecord['status']) => {
    switch (status) {
      case 'completed':
        return <PhoneCall className="h-4 w-4 text-green-500" />
      case 'failed':
        return <Phone className="h-4 w-4 text-red-500" />
      case 'missed':
        return <Phone className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusText = (status: CallRecord['status']) => {
    switch (status) {
      case 'completed':
        return 'Завершен'
      case 'failed':
        return 'Неудачный'
      case 'missed':
        return 'Пропущенный'
    }
  }

  const getStatusVariant = (status: CallRecord['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'failed':
        return 'destructive'
      case 'missed':
        return 'secondary'
    }
  }

  const groupedHistory = callHistory.reduce((acc, record) => {
    const dateKey = formatDate(record.startTime)
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(record)
    return acc
  }, {} as Record<string, CallRecord[]>)

  // Экспортируем функцию для добавления записей из родительского компонента
  React.useEffect(() => {
    (window as any).addCallRecord = addCallRecord
    return () => {
      delete (window as any).addCallRecord
    }
  }, [callHistory])

  if (callHistory.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            История звонков
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Phone className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>История звонков пуста</p>
            <p className="text-sm">Ваши звонки будут отображаться здесь</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          История звонков
          <Badge variant="secondary" className="ml-auto">
            {callHistory.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-h-96 overflow-y-auto">
        {Object.entries(groupedHistory).map(([date, records]) => (
          <div key={date} className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground border-b pb-1">
              {date}
            </h4>
            {records.map((record) => (
              <div key={record.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50 dark:bg-muted/20">
                <div className="flex-shrink-0">
                  {getStatusIcon(record.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {record.callingNumber} → {record.receivingNumber}
                    </span>
                    <Badge variant={getStatusVariant(record.status)} className="text-xs">
                      {getStatusText(record.status)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{formatTime(record.startTime)}</span>
                    {record.status === 'completed' && (
                      <span>{formatCallDuration(record.duration)}</span>
                    )}
                  </div>
                </div>
                
                {onRedial && record.status === 'completed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRedial(record.callingNumber, record.receivingNumber)}
                    className="flex-shrink-0"
                  >
                    <Phone className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
