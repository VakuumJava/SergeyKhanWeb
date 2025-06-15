// ------------------------------------------
// OrdersDataTable.tsx (с отображением ID заказа слева)
// ------------------------------------------
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { API } from "@shared/constants/constants";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getGroupedRowModel,
  SortingState,
  VisibilityState,
  flexRender,
} from "@tanstack/react-table";
import { Checkbox } from "@workspace/ui/components/ui";
import { Button } from "@workspace/ui/components/ui";
import { Input } from "@workspace/ui/components/ui";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@workspace/ui/components/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/ui";
import { Minus, Plus, ChevronDown, X } from "lucide-react";
import { OrdersDataTableProps } from "@shared/constants/orders";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@workspace/ui/components/ui";
import ActiveOrders from "@shared/orders/ActiveOrders";
import AllOrders from "@shared/orders/AllOrders";

export function OrdersDataTable({
                                  data,
                                  columns,
                                  status,
                                  isEdit = false,
                                  onSelectedChange = () => {},
                                  masterId,
                                  isModel = true,
                                }: OrdersDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    orderNumber: false,
    date: true,
    client: true,
    contact: false,
    address: false,
    problem: false,
    cost: true,
    executionTime: false,
    master: false,
    status: true,
    actions: false,
  });

  const [localData, setLocalData] = useState<any[]>(() =>
      isModel ? [] : data
  );
  const [selectedOrders, setSelectedOrders] = useState<any[]>([]);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [toAssign, setToAssign] = useState<any[]>([]);

  const router = useRouter();
  const token = localStorage.getItem("token") || "";

  const fetchAssignedOrders = async () => {
    if (!masterId) return;
    try {
      const res = await axios.get<any[]>(`${API}/orders/master/${masterId}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setLocalData(res.data);
    } catch (err) {
      console.error("Ошибка загрузки назначенных заказов:", err);
    }
  };

  useEffect(() => {
    if (isModel) {
      fetchAssignedOrders();
    }
  }, [masterId, isAssignOpen]);

  const table = useReactTable({
    data: localData,
    columns,
    state: { sorting, globalFilter, columnVisibility },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
  });

  const handleRemoveOrder = async (orderId: string) => {
    try {
      await axios.patch(
          `${API}/assign/${orderId}/remove/`,
          {},
          { headers: { Authorization: `Token ${token}` } }
      );
      if (isModel) fetchAssignedOrders();
      else setLocalData(prev => prev.filter(o => o.id !== orderId));
    } catch (err) {
      console.error("Ошибка отмены назначения заказа:", err);
    }
  };

  const handleAssign = async () => {
    try {
      await Promise.all(
          toAssign.map(order =>
              axios.patch(
                  `${API}/assign/${order.id}/`,
                  { assigned_master: masterId },
                  { headers: { Authorization: `Token ${token}` } }
              )
          )
      );
      setToAssign([]);
      setIsAssignOpen(false);
    } catch (err) {
      console.error("Ошибка назначения заказов:", err);
    }
  };

  const handleCheckboxChange = (order: any, checked: boolean) => {
    const updated = checked
        ? [...selectedOrders, order]
        : selectedOrders.filter(o => o.id !== order.id);
    setSelectedOrders(updated);
    onSelectedChange(updated);
  };

  return (
      <div className="w-full">
        {/* Filters & actions */}
        <div className="flex items-center py-4">
          <Input
              placeholder="Найти заказы..."
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              className="max-w-sm"
          />
          {status === "curator" && isModel && (
              <div className="flex gap-2 ml-4">
                <Button
                    variant={isDeleteMode ? "destructive" : "outline"}
                    size="icon"
                    onClick={() => setIsDeleteMode(p => !p)}
                >
                  <Minus />
                </Button>
                <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon"><Plus/></Button>
                  </DialogTrigger>
                  <DialogContent className="w-full md:max-w-7xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Добавить заказ мастеру</DialogTitle></DialogHeader>
                    <div className="mt-4">
                      <AllOrders isActiveEdit onSelectedChange={setToAssign} masterId={masterId}/>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild><Button variant="outline">Отмена</Button></DialogClose>
                      <Button onClick={handleAssign} disabled={!toAssign.length}>Добавить</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
          )}
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Столбцы <ChevronDown/></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table.getAllColumns().map(col => (
                    <DropdownMenuCheckboxItem
                        key={col.id}
                        checked={col.getIsVisible()}
                        onCheckedChange={v => col.toggleVisibility(!!v)}
                    >{col.id}</DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Main table */}
        <div className="overflow-x-auto">
          <div className="min-w-[600px] rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map(hg => (
                    <TableRow key={hg.id}>
                      {/* ID column */}
                      <TableHead className="w-12 text-center">ID</TableHead>
                      {isEdit && <TableHead className="w-10 text-center">#</TableHead>}
                      {hg.headers.map(header => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                      ))}
                      {isDeleteMode && <TableHead className="w-10 text-center">Удалить</TableHead>}
                    </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map(row => {
                  const order = row.original;
                  return (
                      <TableRow
                          key={row.id}
                          className={`${isEdit||isDeleteMode?"cursor-default":"cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                          onClick={() => !isEdit&&!isDeleteMode&&router.push(`/orders/${order.id}`)}
                      >
                        {/* ID cell */}
                        <TableCell className="text-center font-mono">{order.id}</TableCell>
                        {isEdit && (
                            <TableCell className="text-center">
                              <Checkbox
                                  checked={selectedOrders.some(o => o.id === order.id)}
                                  onCheckedChange={c => handleCheckboxChange(order, !!c)}
                              />
                            </TableCell>
                        )}
                        {row.getVisibleCells().map(cell => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                        ))}
                        {isDeleteMode && (
                            <TableCell className="text-center">
                              <Button variant="destructive" size="icon" onClick={() => handleRemoveOrder(order.id)}><X/></Button>
                            </TableCell>
                        )}
                      </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Предыдущий</Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Следующий</Button>
        </div>
      </div>
  );
}
