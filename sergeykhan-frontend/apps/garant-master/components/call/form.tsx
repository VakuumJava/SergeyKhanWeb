"use client"

import React, { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Phone, LogIn, Loader2, PhoneCall, PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import AudioVisualizer from "./AudioVisualizer2"
import ConnectionStatus from "./ConnectionStatus2"
import CallHistory from "./CallHistory2"
import CallHotkeys from "./CallHotkeys2"

// Схема валидации: внутренний номер VPBX и внешний номер
const formSchema = z.object({
  phoneNumber1: z
    .string()
    .min(1, "Внутренний номер обязателен")
    .regex(/^\d{2,4}$/, "Введите внутренний номер VPBX (2-4 цифры, например: 101)"),
  phoneNumber2: z
    .string()
    .min(1, "Номер телефона обязателен")
    .regex(/^\+\d{10,15}$/, "Введите номер в международном формате (например: +996555123456)"),
})

type FormData = z.infer<typeof formSchema>

// Типы для состояния звонка
type CallStatus = "idle" | "requesting_permission" | "connecting" | "ringing" | "connected" | "ended" | "failed"

interface CallState {
  status: CallStatus
  startTime?: Date
  endTime?: Date
  duration: number
  callingNumber?: string
  receivingNumber?: string
}

// Утилита для форматирования времени звонка
const formatCallDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export default function CallForm() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [isCalling, setIsCalling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Состояние голосового звонка
  const [callState, setCallState] = useState<CallState>({
    status: "idle",
    duration: 0
  })
  const [isMicEnabled, setIsMicEnabled] = useState(true)
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true)
  const [hasMediaPermission, setHasMediaPermission] = useState(false)
  
  // Рефы для WebRTC
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const callTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phoneNumber1: "",
      phoneNumber2: "",
    },
  })

  // Проверяем состояние аутентификации при загрузке
  useEffect(() => {
    const accessToken = localStorage.getItem("vpbx_access")
    const expiresRaw = localStorage.getItem("vpbx_expires")
    
    if (accessToken && expiresRaw) {
      const expiresAt = Number(expiresRaw)
      if (Date.now() < expiresAt - 30_000) {
        setIsAuthenticated(true)
      }
    }
    
    // Проверяем разрешения на микрофон
    checkMediaPermissions()
  }, [])

  // Таймер звонка
  useEffect(() => {
    if (callState.status === "connected" && !callTimerRef.current) {
      callTimerRef.current = setInterval(() => {
        setCallState(prev => ({
          ...prev,
          duration: prev.duration + 1
        }))
      }, 1000)
    } else if (callState.status !== "connected" && callTimerRef.current) {
      clearInterval(callTimerRef.current)
      callTimerRef.current = null
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current)
        callTimerRef.current = null
      }
    }
  }, [callState.status])

  // Проверка разрешений на микрофон
  const checkMediaPermissions = async () => {
    try {
      const permissions = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      setHasMediaPermission(permissions.state === 'granted')
      
      permissions.addEventListener('change', () => {
        setHasMediaPermission(permissions.state === 'granted')
      })
    } catch (err) {
      console.log("Permission API not supported")
    }
  }

  // Запрос доступа к микрофону
  const requestMediaAccess = async (): Promise<boolean> => {
    try {
      setCallState(prev => ({ ...prev, status: "requesting_permission" }))
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      })
      
      mediaStreamRef.current = stream
      setHasMediaPermission(true)
      return true
    } catch (err: any) {
      console.error("Media access denied:", err)
      setError("Не удалось получить доступ к микрофону. Разрешите доступ в настройках браузера.")
      setCallState(prev => ({ ...prev, status: "failed" }))
      return false
    }
  }

  // Управление микрофоном
  const toggleMicrophone = () => {
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks()
      audioTracks.forEach(track => {
        track.enabled = !isMicEnabled
      })
      setIsMicEnabled(!isMicEnabled)
    }
  }

  // Управление динамиком (заглушка для будущей реализации)
  const toggleSpeaker = () => {
    setIsSpeakerEnabled(!isSpeakerEnabled)
  }

  // Завершение звонка
  const endCall = () => {
    // Останавливаем медиапоток
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }

    // Останавливаем таймер
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current)
      callTimerRef.current = null
    }

    // Добавляем запись в историю звонков
    if (callState.callingNumber && callState.receivingNumber && callState.startTime) {
      const callRecord = {
        callingNumber: callState.callingNumber,
        receivingNumber: callState.receivingNumber,
        startTime: callState.startTime,
        endTime: new Date(),
        duration: callState.duration,
        status: (callState.duration > 0 ? 'completed' : 'failed') as 'completed' | 'failed'
      }
      
      // Используем глобальную функцию для добавления записи
      if ((window as any).addCallRecord) {
        (window as any).addCallRecord(callRecord)
      }
    }

    // Обновляем состояние
    setCallState(prev => ({
      ...prev,
      status: "ended",
      endTime: new Date()
    }))
    
    setIsCalling(false)
    setSuccess("Звонок завершен")
    
    // Сброс состояния через 3 секунды
    setTimeout(() => {
      setCallState({
        status: "idle",
        duration: 0
      })
      setSuccess(null)
    }, 3000)
  }

  // Функция повторного звонка из истории
  const handleRedial = (callingNumber: string, receivingNumber: string) => {
    form.setValue('phoneNumber1', callingNumber)
    form.setValue('phoneNumber2', receivingNumber)
    
    // Скроллим к форме
    const formElement = document.querySelector('#call-form')
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Авто-рефреш accessToken через ваш локальный /api/vpbx/refresh-token
  async function ensureFreshToken() {
    const expiresRaw = localStorage.getItem("vpbx_expires")
    const refresh = localStorage.getItem("vpbx_refresh")
    
    if (!expiresRaw || !refresh) {
      throw new Error("Нет сессии – пожалуйста, выполните вход заново")
    }

    const expiresAt = Number(expiresRaw)
    if (Date.now() > expiresAt - 30_000) {
      const r = await fetch("/api/vpbx/refresh-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refresh }),
      })
      
      if (!r.ok) {
        // не удалось обновить — сбрасываем всё
        localStorage.removeItem("vpbx_access")
        localStorage.removeItem("vpbx_refresh")
        localStorage.removeItem("vpbx_expires")
        setIsAuthenticated(false)
        throw new Error("Сессия истекла – требуется повторный вход")
      }
      
      const { accessToken, refreshToken, expiresIn } = await r.json()
      localStorage.setItem("vpbx_access", accessToken)
      localStorage.setItem("vpbx_refresh", refreshToken)
      localStorage.setItem("vpbx_expires", (Date.now() + expiresIn * 1000).toString())
    }
  }

  // Аутентификация в VPBX
  const authenticate = async () => {
    setIsAuthenticating(true)
    setError(null)
    
    try {
      const response = await fetch("/api/vpbx/get-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login: "slavakhan100",
          password: "i4yc448p"
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Ошибка аутентификации")
      }

      const { accessToken, refreshToken, expiresIn } = await response.json()
      
      localStorage.setItem("vpbx_access", accessToken)
      localStorage.setItem("vpbx_refresh", refreshToken)
      localStorage.setItem("vpbx_expires", (Date.now() + expiresIn * 1000).toString())
      
      setIsAuthenticated(true)
      setSuccess("Успешная аутентификация в системе VPBX")
    } catch (err: any) {
      setError(err.message || "Не удалось подключиться к системе VPBX")
    } finally {
      setIsAuthenticating(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    setIsCalling(true)
    setError(null)
    setSuccess(null)

    try {
      // 0) Проверяем аутентификацию в VPBX
      if (!isAuthenticated) {
        throw new Error("Необходимо войти в систему VPBX перед совершением звонка")
      }

      // 1) Запрашиваем доступ к микрофону
      if (!hasMediaPermission) {
        const mediaAccess = await requestMediaAccess()
        if (!mediaAccess) {
          return
        }
      }

      // 2) Устанавливаем начальное состояние звонка
      setCallState({
        status: "connecting",
        startTime: new Date(),
        duration: 0,
        callingNumber: data.phoneNumber1,
        receivingNumber: data.phoneNumber2
      })

      // 3) Удостовериться, что accessToken свежий
      await ensureFreshToken()

      // 4) Сделать проксированный вызов MakeCall2
      const accessToken = localStorage.getItem("vpbx_access")
      if (!accessToken) throw new Error("Отсутствует accessToken")

      setCallState(prev => ({ ...prev, status: "ringing" }))

      const res = await fetch(`/api/vpbx/MakeCall2`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          abonentNumber: data.phoneNumber1,
          number: data.phoneNumber2,
        }),
      })

      let payload: any
      try {
        const responseText = await res.text()
        if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
          payload = JSON.parse(responseText)
        } else {
          // Check if this is an HTML response from VPBX (authentication required)
          if (res.ok && responseText.includes('VPBX Вход в систему')) {
            throw new Error("Требуется аутентификация в системе VPBX. Нажмите 'Войти в VPBX' для авторизации.")
          }
          // For other HTML responses or non-OK status
          throw new Error(`Сервер вернул некорректный ответ: ${res.status} ${res.statusText}`)
        }
      } catch (parseError: any) {
        if (parseError.message.includes('Требуется аутентификация') || 
            parseError.message.includes('Сервер вернул некорректный ответ')) {
          throw parseError
        }
        throw new Error(`Ошибка разбора ответа сервера: ${parseError.message}`)
      }

      if (!res.ok) {
        throw new Error(payload?.error || `Ошибка API: ${res.status} ${res.statusText}`)
      }

      // 5) Симулируем установку соединения
      setTimeout(() => {
        setCallState(prev => ({ ...prev, status: "connected" }))
        setSuccess(`Звонок установлен! ${data.phoneNumber1} → ${data.phoneNumber2}`)
      }, 2000)

      form.reset()
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Не удалось выполнить звонок")
      
      // Если ошибка аутентификации, не устанавливаем состояние failed
      if (err.message?.includes("Необходимо войти в систему VPBX")) {
        setCallState({ status: "idle", duration: 0 })
        setIsCalling(false)
      } else {
        setCallState(prev => ({ ...prev, status: "failed" }))
        endCall()
      }
    } finally {
      // Для ошибок аутентификации сбрасываем состояние здесь
      if (error?.includes("Необходимо войти в систему VPBX")) {
        setIsCalling(false)
      }
      // Для других ошибок не сбрасываем isCalling здесь, это делается в endCall()
    }
  }

  return (
    <div className="container mx-auto max-w-2xl p-6 space-y-6">
      {/* Горячие клавиши */}
      <CallHotkeys 
        onToggleMic={toggleMicrophone}
        onToggleSpeaker={toggleSpeaker}
        onEndCall={endCall}
        isCallActive={callState.status === "connected"}
      />
      
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
          <Phone className="h-8 w-8" />
          Система звонков
        </h1>
        <p className="text-muted-foreground mt-2">
          Интеграция с Beeline Cloud PBX для совершения звонков
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Интерфейс активного звонка */}
      {(callState.status !== "idle" && callState.status !== "ended") && (
        <Card className="border-2 border-primary bg-muted/50 dark:bg-muted/20">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <PhoneCall className="h-6 w-6 text-primary animate-pulse" />
              Активный звонок
            </CardTitle>
            {/* Статус соединения */}
            <div className="flex justify-center">
              <ConnectionStatus isCallActive={callState.status === "connected"} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Статус звонка */}
            <div className="text-center space-y-2">
              <Badge 
                variant={callState.status === "connected" ? "default" : "secondary"}
                className="text-sm px-4 py-2"
              >
                {callState.status === "requesting_permission" && "🎤 Запрос доступа к микрофону..."}
                {callState.status === "connecting" && "📞 Подключение..."}
                {callState.status === "ringing" && "📳 Звонок..."}
                {callState.status === "connected" && "✅ Соединен"}
                {callState.status === "failed" && "❌ Ошибка"}
              </Badge>
              
              {callState.callingNumber && callState.receivingNumber && (
                <div className="text-lg font-semibold">
                  {callState.callingNumber} → {callState.receivingNumber}
                </div>
              )}
            </div>

            {/* Таймер звонка */}
            {callState.status === "connected" && (
              <div className="text-center space-y-4">
                <div className="text-3xl font-mono font-bold text-primary">
                  {formatCallDuration(callState.duration)}
                </div>
                <p className="text-sm text-muted-foreground">Продолжительность звонка</p>
                
                {/* Аудио визуализация */}
                <div className="py-2">
                  <AudioVisualizer 
                    mediaStream={mediaStreamRef.current}
                    isActive={callState.status === "connected" && isMicEnabled}
                  />
                </div>
              </div>
            )}

            {/* Статус микрофона */}
            {hasMediaPermission && (
              <div className="flex items-center justify-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isMicEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm">
                  Микрофон: {isMicEnabled ? 'Включен' : 'Выключен'}
                </span>
              </div>
            )}

            {/* Управление звонком */}
            <div className="flex justify-center gap-4">
              {/* Управление микрофоном */}
              {hasMediaPermission && (
                <Button
                  variant={isMicEnabled ? "default" : "destructive"}
                  size="lg"
                  onClick={toggleMicrophone}
                  disabled={callState.status !== "connected"}
                  className="w-14 h-14 rounded-full"
                  title="Микрофон (M или Пробел)"
                >
                  {isMicEnabled ? (
                    <Mic className="h-6 w-6" />
                  ) : (
                    <MicOff className="h-6 w-6" />
                  )}
                </Button>
              )}

              {/* Управление динамиком */}
              <Button
                variant={isSpeakerEnabled ? "default" : "secondary"}
                size="lg"
                onClick={toggleSpeaker}
                disabled={callState.status !== "connected"}
                className="w-14 h-14 rounded-full"
                title="Динамик (S)"
              >
                {isSpeakerEnabled ? (
                  <Volume2 className="h-6 w-6" />
                ) : (
                  <VolumeX className="h-6 w-6" />
                )}
              </Button>

              {/* Завершить звонок */}
              <Button
                variant="destructive"
                size="lg"
                onClick={endCall}
                className="w-14 h-14 rounded-full"
                title="Завершить звонок (Esc или E)"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            </div>

            {/* Подсказки по горячим клавишам */}
            {callState.status === "connected" && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Горячие клавиши: <kbd className="px-1 py-0.5 bg-muted text-muted-foreground rounded text-xs">M</kbd> микрофон, 
                  <kbd className="px-1 py-0.5 bg-muted text-muted-foreground rounded text-xs ml-1">S</kbd> динамик, 
                  <kbd className="px-1 py-0.5 bg-muted text-muted-foreground rounded text-xs ml-1">Esc</kbd> завершить
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!isAuthenticated ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Подключение к VPBX
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Для совершения звонков необходимо подключиться к системе Beeline Cloud PBX.
            </p>
            <Button 
              onClick={authenticate} 
              disabled={isAuthenticating}
              className="w-full"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Подключение...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Подключиться к VPBX
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Разрешения микрофона */}
          {!hasMediaPermission && (
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Mic className="h-5 w-5 text-orange-600" />
                  <div className="flex-1">
                    <p className="text-orange-800 dark:text-orange-300">
                      Для совершения звонков требуется доступ к микрофону
                    </p>
                    <p className="text-sm text-orange-600 dark:text-orange-400">
                      Разрешите доступ при появлении соответствующего запроса
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Информационная карточка */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-blue-800 dark:text-blue-300">
                📋 Инструкция по использованию
              </CardTitle>
            </CardHeader>
            <CardContent className="text-blue-700 dark:text-blue-300">
              <div className="space-y-2">
                <p><strong>Номер абонента:</strong> Внутренний номер из системы VPBX (например: 101, 102, 103)</p>
                <p><strong>Номер получателя:</strong> Полный международный номер (например: +996555123456)</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  💡 Система автоматически соединит внутренний номер с внешним номером
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Форма звонка */}
          {callState.status === "idle" && (
            <Card id="call-form">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Совершить звонок
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="phoneNumber1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Внутренний номер абонента VPBX</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="101" 
                              {...field} 
                              disabled={isCalling}
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground">
                            Введите внутренний номер из системы VPBX (обычно 3-4 цифры)
                          </p>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phoneNumber2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Номер получателя (внешний)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="+996777987654" 
                              {...field} 
                              disabled={isCalling}
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground">
                            Полный международный номер телефона
                          </p>
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-3">
                      <Button
                        type="submit"
                        disabled={isCalling}
                        className="flex-1"
                      >
                        {isCalling ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Звоним...
                          </>
                        ) : (
                          <>
                            <Phone className="mr-2 h-4 w-4" />
                            Совершить звонок
                          </>
                        )}
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          localStorage.removeItem("vpbx_access")
                          localStorage.removeItem("vpbx_refresh")
                          localStorage.removeItem("vpbx_expires")
                          setIsAuthenticated(false)
                          setSuccess(null)
                          setError(null)
                        }}
                        disabled={isCalling}
                      >
                        Отключиться
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* История последнего звонка */}
          {callState.status === "ended" && callState.duration > 0 && (
            <Card className="bg-muted/50 dark:bg-muted/20">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  Последний звонок
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Номера:</span>
                    <span>{callState.callingNumber} → {callState.receivingNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Продолжительность:</span>
                    <span>{formatCallDuration(callState.duration)}</span>
                  </div>
                  {callState.startTime && (
                    <div className="flex justify-between">
                      <span>Время:</span>
                      <span>{callState.startTime.toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* История звонков */}
          <CallHistory onRedial={handleRedial} />
        </div>
      )}
    </div>
  )
}
