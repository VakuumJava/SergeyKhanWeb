"use client"

import { useEffect } from 'react'

interface CallHotkeysProps {
  onToggleMic?: () => void
  onToggleSpeaker?: () => void
  onEndCall?: () => void
  isCallActive: boolean
  isEnabled?: boolean
}

function CallHotkeys({ 
  onToggleMic, 
  onToggleSpeaker, 
  onEndCall, 
  isCallActive,
  isEnabled = true 
}: CallHotkeysProps) {
  useEffect(() => {
    if (!isEnabled || !isCallActive) return

    const handleKeydown = (event: KeyboardEvent) => {
      // Проверяем, что пользователь не находится в поле ввода
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return
      }

      // Предотвращаем выполнение, если нажаты модификаторы (кроме комбинаций которые мы хотим)
      const hasModifier = event.ctrlKey || event.altKey || event.metaKey

      switch (event.code) {
        case 'KeyM':
          if (!hasModifier) {
            event.preventDefault()
            onToggleMic?.()
          }
          break
        case 'KeyS':
          if (!hasModifier) {
            event.preventDefault()
            onToggleSpeaker?.()
          }
          break
        case 'Escape':
        case 'KeyE':
          if (!hasModifier) {
            event.preventDefault()
            onEndCall?.()
          }
          break
        case 'Space':
          // Space для быстрого отключения/включения микрофона
          if (!hasModifier) {
            event.preventDefault()
            onToggleMic?.()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeydown)

    return () => {
      document.removeEventListener('keydown', handleKeydown)
    }
  }, [onToggleMic, onToggleSpeaker, onEndCall, isCallActive, isEnabled])

  // Компонент не рендерит ничего, только обрабатывает события клавиатуры
  return null
}

export default CallHotkeys
