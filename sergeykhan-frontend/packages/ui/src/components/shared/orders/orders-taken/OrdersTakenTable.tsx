
"use client";

import * as React from "react";
import {
  ColumnDef,
  SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, CheckCircle, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@workspace/ui/components/dialog";
import { Textarea } from "@workspace/ui/components/textarea";
import { Separator } from "@workspace/ui/components/separator";

import { Order } from "@workspace/ui/components/shared/constants/orders";
import { TimePickerComponent } from "@shared/orders/orders-taken/TimePicker";
import { DatePicker } from "@shared/orders/orders-taken/DatePicker";
import { api } from "@shared/utils/api";

export function OrdersTakenDataTable({ data, columns }: { data: Order[]; columns: ColumnDef<Order>[] }) {
  const router = useRouter();

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState<string>("");
  const [orders, setOrders] = React.useState<Order[]>(data);
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
  const [expenses, setExpenses] = React.useState("");
  const [totalReceived, setTotalReceived] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [image, setImage] = React.useState<File | null>(null);
  const [arrivalDate, setArrivalDate] = React.useState<Date | undefined>(undefined);
  const [arrivalTime, setArrivalTime] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const revenue: number = 100000;
  const expenses_order: number = 100;
  const clearRevenue: number = revenue - expenses_order;

  // Функция завершения заказа с отправкой на бэкенд
  const handleSubmit = async () => {
    if (!selectedOrder) return;
    // Валидация всех полей
    if (!image || !description || !expenses || !totalReceived || !arrivalDate || !arrivalTime) {
      setError("Заполните все поля");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("report_file", image);
      formData.append("work_description", description);
      formData.append("expenses", expenses);
      formData.append("final_cost", totalReceived);

      // формат даты и времени: гарантируем string
      const dateString: string | undefined = arrivalDate
          ? arrivalDate.toISOString().split("T")[0]
          : "";
      formData.append("date", dateString ? dateString : "");
      formData.append("time", arrivalTime);

      // POST запрос
      await api.post(
          `/orders/${selectedOrder.id}/complete/`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
      );

      // Обновляем статус локально
      setOrders((prev) =>
          prev.map((order) =>
              order.id === selectedOrder.id
                  ? { ...order, status: "Ожидание" }
                  : order
          )
      );
      setSelectedOrder(null);
      setError(null);
    } catch (e: any) {
      console.error("Ошибка при завершении заказа:", e);
      setError(e.response?.data?.error || "Сетевая ошибка");
    } finally {
      setSubmitting(false);
    }
  };

  const table = useReactTable({
    data: orders,
    columns,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { sorting, globalFilter },
  });

  return (
      <div>
        <div className="flex items-center py-4">
          <Input
              placeholder="Найти заказ..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Столбцы <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table.getAllColumns().map((column) => (
                  <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="rounded-md p-4 border overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) =>
                        header.column.id !== "actions" ? (
                            <TableHead key={header.id}>
                              {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                              )}
                            </TableHead>
                        ) : null
                    )}
                    <TableHead>Действие</TableHead>
                  </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                  <TableRow
                      key={row.id}
                      onClick={() => router.push(`/orders-taken/${row.original.id}`)}
                      className="cursor-pointer hover:bg-muted"
                  >
                    {row.getVisibleCells().map((cell) =>
                        cell.column.id !== "actions" ? (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                        ) : null
                    )}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {row.original.status === "завершен" ? (
                          <span className="text-green-600 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" /> Завершен
                    </span>
                      ) : row.original.status === "проверяется" ? (
                          <span className="text-yellow-600 flex items-center">
                      <Clock className="w-4 h-4 mr-2" /> Проверяется
                    </span>
                      ) : (
                          <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOrder(row.original);
                              }}
                              disabled={submitting}
                          >
                            Завершить
                          </Button>
                      )}
                    </TableCell>
                  </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
          >
            Предыдущий
          </Button>
          <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
          >
            Следующий
          </Button>
        </div>

        {selectedOrder && (
            <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Заполните форму завершения заказа</DialogTitle>
                </DialogHeader>
                <h2>Шаг 1</h2>
                <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files?.[0] || null)}
                />
                <Textarea
                    placeholder="Описание проделанной работы"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <Input
                    placeholder="Расходы (детали, транспорт)"
                    value={expenses}
                    onChange={(e) => setExpenses(e.target.value)}
                />
                <Input
                    placeholder="Сумма полученная за заказ"
                    value={totalReceived}
                    onChange={(e) => setTotalReceived(e.target.value)}
                />
                {error && <p className="text-red-500">{error}</p>}
                <Separator />
                <h2>Шаг 2</h2>
                <div className="flex justify-between flex-row-reverse">
                  <TimePickerComponent value={arrivalTime} onChangeAction={setArrivalTime} />
                  <DatePicker
                      selectedDate={arrivalDate}
                      onDateChangeAction={setArrivalDate}
                  />
                </div>
                <h3>Итого</h3>
                <p className="ml-5">
                  • Выручка составляет — <b>{clearRevenue} тенге</b>
                </p>
                <DialogFooter>
                  <Button onClick={handleSubmit} disabled={submitting}>
                    {submitting ? "Отправка..." : "Отправить"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        )}
      </div>
  );
}
