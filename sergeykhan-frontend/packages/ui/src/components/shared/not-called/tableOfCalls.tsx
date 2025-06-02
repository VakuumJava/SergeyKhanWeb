"use client"

import * as React from "react"
import axios from "axios"
import { Button } from "@workspace/ui/components/button"
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Input } from "@workspace/ui/components/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@workspace/ui/components/accordion"
import { ArrowDown, ArrowUp } from "lucide-react"
import { Contact } from "@shared/constants/types"
import { API } from "@shared/constants/constants"
import {api} from "@shared/utils/api";

export function TableOfCalls() {
  // JWT токен из localStorage (или любого хранилища)
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  // Настройка axios-инстанса с базовым URL и заголовком авторизации
  // Состояния для непрозвоненных и прозвоненных контактов
  const [data, setData] = React.useState<Contact[]>([])
  const [calledContacts, setCalledContacts] = React.useState<Contact[]>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState({})

  // Функция загрузки списков с сервера
  const fetchContacts = React.useCallback(async () => {
    if (!token) {
      console.error('Token not found, please log in')
      return
    }

    try {
      const [uncalledRes, calledRes] = await Promise.all([
        api.get<Contact[]>('/contacts/uncalled/'),
        api.get<Contact[]>('/contacts/called/'),
      ])
      setData(uncalledRes.data)
      setCalledContacts(calledRes.data)
    } catch (err) {
      console.error('Ошибка загрузки контактов:', err)
    }
  }, [api, token])

  // При первом рендере — загрузить данные
  React.useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  // Отметить контакт прозвоненным на сервере и обновить списки
  const markAsCalled = async (id: string) => {
    if (!token) {
      console.error('Token not found, please log in')
      return
    }

    try {
      await api.post(`/contacts/${id}/mark_as_called/`)
      await fetchContacts()
    } catch (err) {
      console.error('Не удалось отметить как прозвоненного:', err)
    }
  }

  const columns: ColumnDef<Contact>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <div className="capitalize">{row.getValue('name')}</div>,
    },
    {
      accessorKey: 'number',
      header: 'Number',
      cell: ({ row }) => <div className="lowercase">{row.getValue('number')}</div>,
    },
    {
      accessorKey: 'date',
      header: ({ column }) => {
        const current = column.getIsSorted()
        return (
            <div
                className="flex items-center cursor-pointer select-none w-32"
                onClick={() => column.toggleSorting(current !== 'asc')}
            >
              <span className="flex-1">Date</span>
              <span className="ml-1 w-4 h-4 flex items-center justify-center">
              {current === 'asc' ? (
                  <ArrowUp className="h-4 w-4" />
              ) : current === 'desc' ? (
                  <ArrowDown className="h-4 w-4" />
              ) : (
                  <ArrowUp className="h-4 w-4 opacity-0" />
              )}
            </span>
            </div>
        )
      },
      sortingFn: (rowA, rowB, columnId) => {
        const a = new Date(rowA.getValue(columnId) as string).getTime()
        const b = new Date(rowB.getValue(columnId) as string).getTime()
        return a > b ? 1 : a < b ? -1 : 0
      },
      cell: ({ row }) => {
        const dateValue = row.getValue('date') as string
        return <div>{new Date(dateValue).toLocaleDateString()}</div>
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
          <Button
              variant="outline"
              size="sm"
              onClick={() => markAsCalled(row.original.id)}
          >
            Прозвонён
          </Button>
      ),
    },
  ]

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
      <div className="w-full">
        <div className="flex flex-col gap-5">
          {/* Фильтр имени */}
          <div className="flex items-center py-4">
            <Input
                placeholder="Filter names..."
                value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
                onChange={e => table.getColumn('name')?.setFilterValue(e.target.value)}
                className="max-w-sm"
            />
          </div>

          {/* Таблица непрозвоненных */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map(hg => (
                    <TableRow key={hg.id}>
                      {hg.headers.map(header => (
                          <TableHead key={header.id}>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                      ))}
                    </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map(row => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map(cell => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                      ))}
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Аккордеон прозвоненных */}
          <div className="rounded-md border px-4">
            <Accordion type="multiple">
              <AccordionItem value="called-contacts">
                <AccordionTrigger>Прозвоненные контакты</AccordionTrigger>
                <AccordionContent>
                  <div className="overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Number</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {calledContacts.map(contact => (
                            <TableRow key={contact.id}>
                              <TableCell>{contact.name}</TableCell>
                              <TableCell>{contact.number}</TableCell>
                              <TableCell>{new Date(contact.date).toLocaleDateString()}</TableCell>
                              <TableCell className="text-green-600">
                                Прозвонён
                              </TableCell>
                            </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
  )
}