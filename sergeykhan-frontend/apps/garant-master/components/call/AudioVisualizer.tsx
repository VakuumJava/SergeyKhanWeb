"use client"

import React, { useEffect, useRef, useState } from 'react'

interface AudioVisualizerProps {
  mediaStream: MediaStream | null
  isActive: boolean
  className?: string
}

export default function AudioVisualizer({ mediaStream, isActive, className = "" }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(20).fill(0))

  useEffect(() => {
    if (!mediaStream || !isActive) {
      // Остановить визуализацию
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      setAudioLevels(new Array(20).fill(0))
      return
    }

    // Настройка Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const source = audioContext.createMediaStreamSource(mediaStream)
    const analyser = audioContext.createAnalyser()
    
    analyser.fftSize = 64
    analyser.smoothingTimeConstant = 0.8
    source.connect(analyser)
    
    analyserRef.current = analyser

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const updateVisualizer = () => {
      if (!analyserRef.current) return

      analyserRef.current.getByteFrequencyData(dataArray)
      
      // Преобразуем данные в уровни для визуализации
      const levels = []
      const step = Math.floor(bufferLength / 20)
      
      for (let i = 0; i < 20; i++) {
        const start = i * step
        const end = start + step
        let sum = 0
        
        for (let j = start; j < end && j < bufferLength; j++) {
          sum += dataArray[j]
        }
        
        const average = sum / step
        levels.push(Math.min(100, (average / 255) * 100)))
      }
      
      setAudioLevels(levels)
      animationRef.current = requestAnimationFrame(updateVisualizer)
    }

    updateVisualizer()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (audioContext.state !== 'closed') {
        audioContext.close()
      }
    }
  }, [mediaStream, isActive])

  return (
    <div className={`flex items-center justify-center gap-1 h-12 ${className}`}>
      {audioLevels.map((level, index) => (
        <div
          key={index}
          className="bg-primary transition-all duration-75 ease-out rounded-full"
          style={{
            width: '3px',
            height: `${Math.max(4, (level / 100) * 48)}px`,
            opacity: isActive ? 0.6 + (level / 100) * 0.4 : 0.2
          }}
        />
      ))}
    </div>
  )
}
