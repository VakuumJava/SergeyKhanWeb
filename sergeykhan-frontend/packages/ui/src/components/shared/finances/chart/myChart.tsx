"use client"

import * as React from "react"
import { BarChart, Bar, CartesianGrid, XAxis } from "recharts"
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent
} from "@workspace/ui/components/card"
import {
  ChartContainer, ChartTooltip, ChartTooltipContent
} from "@workspace/ui/components/chart"
import { API } from "@shared/constants/constants"

type Log = { id: number; action: string; amount: number; created_at: string }
type Point = { date: string; count: number }

export function LogsChart({ visible }: { visible: boolean }) {
  const [logs, setLogs] = React.useState<Log[]>([])
  const [period, setPeriod] = React.useState<"week" | "month">("week")

  React.useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token")
      const userId = localStorage.getItem("user_id")
      if (!token || !userId) return
      const res = await fetch(`${API}/balance/${userId}/logs/`, {
        headers: { Authorization: `Token ${token}` }
      })
      if (res.ok) setLogs(await res.json())
    })()
  }, [])

  const startDate = React.useMemo(() => {
    const now = new Date()
    period === "week"
      ? now.setDate(now.getDate() - 6)
      : now.setMonth(now.getMonth() - 1)
    return now
  }, [period])

  const data: Point[] = React.useMemo(() => {
    const map = new Map<string, number>()
    logs.forEach(log => {
      const d = new Date(log.created_at)
      if (d < startDate) return
      const key = d.toLocaleDateString("ru-RU", { month: "2-digit", day: "2-digit" })
      map.set(key, (map.get(key) || 0) + 1)
    })

    const points: Point[] = []
    const cur = new Date(startDate)
    const end = new Date()
    while (cur <= end) {
      const key = cur.toLocaleDateString("ru-RU", { month: "2-digit", day: "2-digit" })
      points.push({ date: key, count: map.get(key) || 0 })
      cur.setDate(cur.getDate() + 1)
    }
    return points
  }, [logs, startDate])

  if (!visible) return null

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row border-b p-0">
        <div className="flex-1 px-6 py-5">
          <CardTitle>История логов</CardTitle>
          <CardDescription>
            Операций за последнюю {period === "week" ? "неделю" : "месяц"}
          </CardDescription>
        </div>
        <div className="flex divide-x">
          {(["week","month"] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-6 py-4 flex-1 text-center ${period===p ? "bg-muted/50" : ""}`}
            >
              {p === "week" ? "Неделя" : "Месяц"}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {data.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-gray-500">
            Логи отсутствуют
          </div>
        ) : (
          <ChartContainer className="h-[250px]" config={{ count: { label: "Операций" } }}>
            <BarChart data={data} margin={{ left:12, right:12 }}>
              <CartesianGrid vertical={false}/>
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize:12 }}/>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    nameKey="Операций"
                    labelFormatter={val => `Дата: ${val}`}
                  />
                }
              />
              <Bar dataKey="count" fill="var(--color-desktop)" />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}