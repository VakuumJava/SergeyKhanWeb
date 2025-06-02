"use client"

import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Phone } from "lucide-react"
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

// Схема валидации: оба номера в международном формате
const formSchema = z.object({
  phoneNumber1: z
    .string()
    .min(1, "Номер телефона обязателен"),
  phoneNumber2: z
    .string()
    .min(1, "Номер телефона обязателен"),
})

type FormData = z.infer<typeof formSchema>

export default function CallForm() {
  const router = useRouter()
  const form   = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phoneNumber1: "",
      phoneNumber2: "",
    },
  })

  // Авто-рефреш accessToken через ваш локальный /api/vpbx/refresh-token
  async function ensureFreshToken() {
    const expiresRaw = localStorage.getItem("vpbx_expires")
    const refresh    = localStorage.getItem("vpbx_refresh")
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
        // не удалось обновить — сбрасываем всё и кидаем на логин
        localStorage.clear()
        router.push("/login")
        throw new Error("Сессия истекла – требуется повторный вход")
      }
      const { accessToken, refreshToken, expiresIn } = await r.json()
      localStorage.setItem("vpbx_access",  accessToken)
      localStorage.setItem("vpbx_refresh", refreshToken)
      localStorage.setItem(
        "vpbx_expires",
        (Date.now() + expiresIn * 1000).toString()
      )
    }
  }

  const onSubmit = async (data: FormData) => {
      console.log("bgdjhfksadaf jasvsgbdhknjalmbfhjsdknc")

    try {
      // 1) Удостовериться, что accessToken свежий
      await ensureFreshToken()

      // 2) Сделать проксированный вызов MakeCall2 не напрямую, а на /api/vpbx/MakeCall2
      const accessToken = localStorage.getItem("vpbx_access")
      if (!accessToken) throw new Error("Отсутствует accessToken")

      const query = new URLSearchParams({
        abonentNumber: data.phoneNumber1,
        number:        data.phoneNumber2,
      })
      console.log("bgdjhfksadaf jas")

      const res = await fetch(`/api/vpbx/MakeCall2?${query}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload.error || "Ошибка при совершении звонка")
      }

      alert("Звонок успешно запущен")
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Не удалось выполнить звонок")
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Форма для звонка
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
                  <FormLabel>Номер телефона 1 (международный формат)</FormLabel>
                  <FormControl>
                    <Input placeholder="+996508030409" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Номер телефона 2 (международный формат)</FormLabel>
                  <FormControl>
                    <Input placeholder="+996557819199" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full flex justify-center items-center"
              disabled={form.formState.isSubmitting}
            >
              <Phone className="mr-2 h-4 w-4" />
              {form.formState.isSubmitting ? "Звонок…" : "Позвонить"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
