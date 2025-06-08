"use client"

import React, { useEffect, useState } from 'react'
import { Wifi, WifiOff, Signal, SignalHigh, SignalLow, SignalMedium } from 'lucide-react'
import { Badge } from "@workspace/ui/components/badge"

interface ConnectionStatusProps {
  isCallActive: boolean
  className?: string
}

export default function ConnectionStatus({ isCallActive, className = "" }: ConnectionStatusProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'unknown'>('unknown')
  const [latency, setLatency] = useState<number | null>(null)

  useEffect(() => {
    // Отслеживание состояния сети
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (!isCallActive || !isOnline) {
      setConnectionQuality('unknown')
      setLatency(null)
      return
    }

    // Простой тест пинга для определения качества соединения
    const testConnection = async () => {
      try {
        const start = Date.now()
        await fetch('/api/health', { 
          method: 'HEAD',
          cache: 'no-cache'
        }).catch(() => {
          // Fallback на внешний ресурс если локальный API недоступен
          return fetch('https://www.google.com/favicon.ico', { 
            method: 'HEAD',
            cache: 'no-cache',
            mode: 'no-cors'
          })
        })
        const ping = Date.now() - start

        setLatency(ping)

        if (ping < 100) {
          setConnectionQuality('excellent')
        } else if (ping < 250) {
          setConnectionQuality('good')
        } else {
          setConnectionQuality('poor')
        }
      } catch (error) {
        setConnectionQuality('poor')
        setLatency(null)
      }
    }

    // Тестируем соединение каждые 5 секунд во время звонка
    const interval = setInterval(testConnection, 5000)
    testConnection() // Первоначальный тест

    return () => clearInterval(interval)
  }, [isCallActive, isOnline])

  const getSignalIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4" />
    
    switch (connectionQuality) {
      case 'excellent':
        return <Signal className="h-4 w-4 text-green-500" />
      case 'good':
        return <SignalMedium className="h-4 w-4 text-yellow-500" />
      case 'poor':
        return <SignalLow className="h-4 w-4 text-red-500" />
      default:
        return <Wifi className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = () => {
    if (!isOnline) return 'Нет соединения'
    if (!isCallActive) return 'Готов'
    
    switch (connectionQuality) {
      case 'excellent':
        return 'Отличное качество'
      case 'good':
        return 'Хорошее качество'
      case 'poor':
        return 'Слабое соединение'
      default:
        return 'Проверка...'
    }
  }

  const getVariant = (): "default" | "secondary" | "destructive" | "outline" => {
    if (!isOnline) return 'destructive'
    if (!isCallActive) return 'secondary'
    
    switch (connectionQuality) {
      case 'excellent':
        return 'default'
      case 'good':
        return 'default'
      case 'poor':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant={getVariant()} className="flex items-center gap-2">
        {getSignalIcon()}
        <span className="text-xs">{getStatusText()}</span>
        {latency && isCallActive && (
          <span className="text-xs opacity-75">({latency}ms)</span>
        )}
      </Badge>
    </div>
  )
}

    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (!isCallActive || !isOnline) {
      setConnectionQuality('unknown')
      setLatency(null)
      return
    }

    // Простой тест пинга для определения качества соединения
    const testConnection = async () => {
      try {
        const start = Date.now()
        await fetch('/api/health', { 
          method: 'HEAD',
          cache: 'no-cache'
        }).catch(() => {
          // Fallback на внешний ресурс если локальный API недоступен
          return fetch('https://www.google.com/favicon.ico', { 
            method: 'HEAD',
            cache: 'no-cache',
            mode: 'no-cors'
          })
        })
        const ping = Date.now() - start

        setLatency(ping)

        if (ping < 100) {
          setConnectionQuality('excellent')
        } else if (ping < 250) {
          setConnectionQuality('good')
        } else {
          setConnectionQuality('poor')
        }
      } catch (error) {
        setConnectionQuality('poor')
        setLatency(null)
      }
    }

    // Тестируем соединение каждые 5 секунд во время звонка
    const interval = setInterval(testConnection, 5000)
    testConnection() // Первоначальный тест

    return () => clearInterval(interval)
  }, [isCallActive, isOnline])

  const getSignalIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4" />
    
    switch (connectionQuality) {
      case 'excellent':
        return <Signal className="h-4 w-4 text-green-500" />
      case 'good':
        return <SignalMedium className="h-4 w-4 text-yellow-500" />
      case 'poor':
        return <SignalLow className="h-4 w-4 text-red-500" />
      default:
        return <Wifi className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = () => {
    if (!isOnline) return 'Нет соединения'
    if (!isCallActive) return 'Готов'
    
    switch (connectionQuality) {
      case 'excellent':
        return 'Отличное качество'
      case 'good':
        return 'Хорошее качество'
      case 'poor':
        return 'Слабое соединение'
      default:
        return 'Проверка...'
    }
  }

  const getVariant = (): "default" | "secondary" | "destructive" | "outline" => {
    if (!isOnline) return 'destructive'
    if (!isCallActive) return 'secondary'
    
    switch (connectionQuality) {
      case 'excellent':
        return 'default'
      case 'good':
        return 'default'
      case 'poor':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant={getVariant()} className="flex items-center gap-2">
        {getSignalIcon()}
        <span className="text-xs">{getStatusText()}</span>
        {latency && isCallActive && (
          <span className="text-xs opacity-75">({latency}ms)</span>
        )}
      </Badge>
    </div>
  )
}
