"use client"

import { Button } from "@workspace/ui/components/button"
import { useState } from "react"

export default function TokenSetter() {
    const [message, setMessage] = useState<string>("")

    const setTestToken = () => {
        localStorage.setItem('token', 'c2c76df372e9e0a34b889e14abb3e383509dc542')
        setMessage('Токен curator установлен!')
        setTimeout(() => setMessage(''), 3000)
    }

    const checkCurrentToken = () => {
        const token = localStorage.getItem('token')
        setMessage(`Текущий токен: ${token || 'отсутствует'}`)
        setTimeout(() => setMessage(''), 5000)
    }

    return (
        <div className="p-4 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Настройка токена для тестирования</h3>
            <div className="flex gap-2 mb-4">
                <Button onClick={setTestToken} variant="outline">
                    Установить токен curator
                </Button>
                <Button onClick={checkCurrentToken} variant="outline">
                    Проверить токен
                </Button>
            </div>
            {message && (
                <div className="p-2 bg-blue-100 text-blue-800 rounded">
                    {message}
                </div>
            )}
        </div>
    )
}
