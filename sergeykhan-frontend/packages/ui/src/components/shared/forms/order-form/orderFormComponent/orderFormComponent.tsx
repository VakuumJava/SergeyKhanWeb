"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@workspace/ui/components/form"
import { Input } from "@workspace/ui/components/input"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { Calendar } from "@workspace/ui/components/calendar"
import { Textarea } from "@workspace/ui/components/textarea"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

// Предположим, здесь хранится URL вида "http://127.0.0.1:8000/api"
import { API } from "@shared/constants/constants"
import axios from "axios";
import React from "react";

// Схема валидации
const FormSchema = z.object({
    number: z.string().min(10, { message: "Введите корректный номер телефона." }),
    name: z.string().min(2, { message: "Имя должно содержать не менее 2 символов." }),
    description: z.string().min(1, { message: "Описание обязательно для заполнения." }), // Добавлено поле description
    address: z.string().min(5, { message: "Адрес должен содержать не менее 5 символов." }),
    equipmentType: z.string().min(1, { message: "Тип оборудования обязателен." }),
    price: z.coerce.number({ invalid_type_error: "Введите число" }).min(0, { message: "Цена должна быть положительной." }),
    promotions: z.string().min(1, { message: "Поле «Акции» обязательно для заполнения." }),
    // Можно пока оставить (хотя отправляем в запросе статус "новый")
    status: z.enum(["мастер", "оператор"], { required_error: "Выберите статус" }),
    deadline: z.date(),
})

export function OrderFormComponent() {
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            number: "",
            name: "",
            description: "",
            address: "",
            age: 0,
            equipmentType: "",
            price: 0,
            promotions: "",
            status: "мастер",
            deadline: new Date(),
        },
    })

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        // Подготовим данные, которые ждёт бэкенд
        const payload = {
            client_name: data.name,
            client_phone: data.number,
            address: data.address,
            equipment_type: data.equipmentType,
            price: Number(data.price).toFixed(2),
            promotion: data.promotions,
            due_date: format(data.deadline, "yyyy-MM-dd"),
            description: data.description, // или заведите отдельное поле, если нужно
            status: "новый", // в примере у вас "новый"
            operator: null,
            curator: null,
            assigned_master: null,
            estimated_cost: (data.price * 0.9).toFixed(2), // пример вычисления
            final_cost: Number(data.price).toFixed(2),
            expenses: (data.price - data.price * 0.9).toFixed(2),
        }

        // На всякий случай выведем payload в консоль
        console.log("Отправляем payload:", payload)

        try {
            // Получаем токен, например, из localStorage или другого источника
            const token = localStorage.getItem("token");
            
            console.log('Токен:', token);
            console.log('API URL:', `${API}/orders/create/`);

            // Отправляем запрос с axios:
            const response = await axios.post(`${API}/orders/create/`, payload, {
                headers: {
                    "Content-Type": "application/json",
                    // Передаём токен в заголовке Authorization
                    Authorization: `Token ${token}`,
                },
            })

            console.log("Успешный ответ сервера:", response.data)
            toast.success("Форма успешно отправлена!", {
                description: (
                    <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
            <code className="text-white">{JSON.stringify(payload, null, 2)}</code>
          </pre>
                ),
            })
        } catch (error: any) {
            console.error("Ошибка при отправке формы:", error)
            
            if (error.response) {
                console.error('Данные ошибки:', error.response.data);
                console.error('Статус ошибки:', error.response.status);
                console.error('Заголовки ответа:', error.response.headers);
                
                const errorMessage = error.response.data?.error || 
                                    error.response.data?.detail || 
                                    JSON.stringify(error.response.data) || 
                                    `Ошибка ${error.response.status}`;
                
                toast.error(`Ошибка при отправке формы: ${errorMessage}`);
            } else if (error.request) {
                console.error('Нет ответа от сервера:', error.request);
                toast.error('Ошибка: сервер не отвечает');
            } else {
                console.error('Неизвестная ошибка:', error.message);
                toast.error(`Неизвестная ошибка: ${error.message}`);
            }
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6">
                <FormField
                    control={form.control}
                    name="number"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Номер телефона</FormLabel>
                            <FormControl>
                                <Input placeholder="+7 XXX-XX-XX-XX" {...field} />
                            </FormControl>
                            <FormDescription>Введите ваш контактный номер телефона.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Полное имя</FormLabel>
                            <FormControl>
                                <Input placeholder="Введите ваше имя" {...field} />
                            </FormControl>
                            <FormDescription>Введите ваше полное имя.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Тарифный план</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Опишите..." {...field} />
                            </FormControl>
                            <FormDescription>Укажите детали вашего тарифного плана.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Адрес</FormLabel>
                            <FormControl>
                                <Input placeholder="Введите адрес" {...field} />
                            </FormControl>
                            <FormDescription>Введите адрес доставки или объект.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="equipmentType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Тип оборудования</FormLabel>
                            <FormControl>
                                <Input placeholder="Введите тип оборудования" {...field} />
                            </FormControl>
                            <FormDescription>Укажите тип оборудования для заказа.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Цена</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="Введите цену" {...field} />
                            </FormControl>
                            <FormDescription>Укажите стоимость заказа.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="promotions"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Акции</FormLabel>
                            <FormControl>
                                <Input placeholder="Введите акции" {...field} />
                            </FormControl>
                            <FormDescription>Укажите действующие акции или скидки.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="deadline"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Срок исполнения</FormLabel>
                            <br/>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {field.value ? format(field.value, "PPP") : "Выберите дату"}
                                    </Button>
                                </PopoverTrigger>

                                <PopoverContent align="start">

                                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                </PopoverContent>
                            </Popover>
                            <FormDescription>Выберите дату выполнения заказа.</FormDescription>

                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit">Отправить</Button>
            </form>
        </Form>
    )
}
