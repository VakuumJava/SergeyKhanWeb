"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API } from "@shared/constants/constants";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@workspace/ui/components/ui";
import { Button } from "@workspace/ui/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/ui";
import { Badge } from "@workspace/ui/components/ui";
import { Eye, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface OrderCompletion {
  id: number;
  order: number;
  order_id: number;
  order_description: string;
  master: number;
  master_email: string;
  work_description: string;
  parts_expenses: string;
  transport_costs: string;
  total_received: string;
  total_expenses: string;
  net_profit: string;
  completion_date: string;
  status: string;
  completion_photos: string[];
  created_at: string;
  updated_at: string;
}

export default function PendingCompletionsPage() {
  const router = useRouter();
  const [completions, setCompletions] = useState<OrderCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingCompletions();
  }, []);

  const fetchPendingCompletions = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Неавторизованный");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API}/api/completions/pending/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Не удалось загрузить завершения заказов");
      }

      const data = await response.json();
      setCompletions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toLocaleString('ru-RU') + '₸';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateNetProfit = (completion: OrderCompletion) => {
    const received = parseFloat(completion.total_received) || 0;
    const expenses = parseFloat(completion.total_expenses) || 0;
    return received - expenses;
  };

  const handleViewCompletion = (completionId: number) => {
    router.push(`/completions/${completionId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Загрузка завершений заказов...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <span>Ошибка: {error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Завершения заказов
          </h1>
          <p className="text-muted-foreground">
            Заказы, ожидающие подтверждения завершения
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {completions.length} ожидает
        </Badge>
      </div>

      {/* Completions Table */}
      {completions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <div>
                <h3 className="text-lg font-medium">Нет ожидающих завершений</h3>
                <p className="text-muted-foreground">
                  Все завершения заказов обработаны
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Ожидающие подтверждения</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Заказ</TableHead>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Мастер</TableHead>
                  <TableHead>Получено</TableHead>
                  <TableHead>Прибыль</TableHead>
                  <TableHead>Дата подачи</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completions.map((completion) => {
                  const netProfit = calculateNetProfit(completion);
                  return (
                    <TableRow key={completion.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">#{completion.order_id}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {completion.order_description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">Клиент #{completion.order_id}</div>
                        <div className="text-sm text-muted-foreground">
                          Заказ: {formatCurrency(completion.total_received)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">Мастер #{completion.master}</div>
                          <div className="text-sm text-muted-foreground">
                            {completion.master_email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(completion.total_received)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Расходы: {formatCurrency(completion.total_expenses)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`font-medium ${
                          netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(netProfit)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(completion.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleViewCompletion(completion.id)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Проверить
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
