
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

import { Button } from "@workspace/ui/components/ui";
import { Input } from "@workspace/ui/components/ui";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@workspace/ui/components/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/ui";

import { Order } from "@workspace/ui/components/shared/constants/orders";
import OrderCompletionForm from "@shared/orders/completion/OrderCompletionForm";
import { formatOrderForMaster } from "@shared/utils/masterDataUtils";

export function OrdersTakenDataTable({ data, columns }: { data: Order[]; columns: ColumnDef<Order>[] }) {
  const router = useRouter();

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState<string>("");
  
  // Форматируем данные для мастера, скрывая конфиденциальную информацию
  const [orders, setOrders] = React.useState<Order[]>(() => 
    data.map(order => formatOrderForMaster(order, 'master'))
  );
  
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
  const [showCompletionForm, setShowCompletionForm] = React.useState(false);

  // Обновляем данные при изменении входящих данных
  React.useEffect(() => {
    const formattedData = data.map(order => formatOrderForMaster(order, 'master'));
    setOrders(formattedData);
  }, [data]);

  const handleCompleteOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowCompletionForm(true);
  };

  const handleCompletionSuccess = () => {
    if (selectedOrder) {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === selectedOrder.id
            ? { ...order, status: "проверяется", completion: { id: 1 } }
            : order
        )
      );
    }
    setShowCompletionForm(false);
    setSelectedOrder(null);
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
                      ) : !row.original.completion ? (
                          <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCompleteOrder(row.original);
                              }}
                          >
                            Завершить
                          </Button>
                      ) : (
                          <span className="text-yellow-600 flex items-center">
                            <Clock className="w-4 h-4 mr-2" /> Ожидает проверки
                          </span>
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

        {/* Компонент завершения заказа */}
        {selectedOrder && (
            <OrderCompletionForm
                orderId={selectedOrder.id.toString()}
                isOpen={showCompletionForm}
                onClose={() => {
                  setShowCompletionForm(false);
                  setSelectedOrder(null);
                }}
                onSuccess={handleCompletionSuccess}
            />
        )}
      </div>
  );
}
