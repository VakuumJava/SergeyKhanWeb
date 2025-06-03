import React, { useState, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
} from '@tanstack/react-table';
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Badge } from "@workspace/ui/components/badge";
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  Clock, 
  User, 
  AlertCircle, 
  CheckCircle,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import axios from 'axios';
import { API } from '@shared/constants/constants';

interface MasterData {
  master_id: number;
  master_email: string;
  next_available_slot: {
    date: string;
    start_time: string;
    end_time: string;
  } | null;
  total_orders_today: number;
}

interface AvailabilitySlot {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  master: number;
  master_email: string;
}

const columnHelper = createColumnHelper<MasterData>();

const MasterWorkloadTableRussian: React.FC = () => {
  const [masterData, setMasterData] = useState<MasterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');

  // Определение колонок таблицы
  const columns = React.useMemo<ColumnDef<MasterData, any>[]>(
    () => [
      columnHelper.accessor('master_email', {
        header: 'Мастер',
        cell: info => (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" />
            <span className="font-medium">{info.getValue()}</span>
          </div>
        ),
      }),
      columnHelper.accessor('total_orders_today', {
        header: 'Заказы сегодня',
        cell: info => (
          <Badge variant="default" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.display({
        id: 'next_slot',
        header: 'Следующий слот',
        cell: ({ row }) => {
          const nextSlot = row.original.next_available_slot;
          if (!nextSlot) {
            return (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Нет слотов
              </Badge>
            );
          }
          
          return (
            <div className="space-y-1">
              <div className="text-sm font-medium">{nextSlot.date}</div>
              <div className="text-xs text-muted-foreground">
                {nextSlot.start_time} - {nextSlot.end_time}
              </div>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'workload_status',
        header: 'Статус загрузки',
        cell: ({ row }) => {
          const data = row.original;
          const hasSlots = data.next_available_slot !== null;
          const ordersCount = data.total_orders_today;
          
          let variant: "default" | "secondary" | "destructive" = "default";
          let text = "Доступен";
          
          if (!hasSlots) {
            variant = "destructive";
            text = "Недоступен";
          } else if (ordersCount > 5) {
            variant = "destructive";
            text = "Высокая";
          } else if (ordersCount > 2) {
            variant = "default";
            text = "Средняя";
          } else {
            variant = "secondary";
            text = "Низкая";
          }
          
          return (
            <Badge variant={variant}>
              {text} ({ordersCount} заказов)
            </Badge>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Действия',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => editAvailability(row.original.master_id)}
              className="flex items-center gap-1"
            >
              <Edit className="h-3 w-3" />
              Просмотр
            </Button>
          </div>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: masterData,
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
    state: {
      globalFilter: globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  useEffect(() => {
    fetchWorkloadData();
  }, []);

  const fetchWorkloadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/masters/workload/all/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setMasterData(response.data);
    } catch (error) {
      console.error('Ошибка получения данных рабочей нагрузки:', error);
      setError('Не удалось загрузить данные рабочей нагрузки мастеров');
    } finally {
      setLoading(false);
    }
  };

  const editAvailability = (masterId: number) => {
    // Перенаправляем на страницу профиля мастера
    window.location.href = `/master-workload/${masterId}`;
  };

  const refreshData = () => {
    fetchWorkloadData();
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Рабочая нагрузка мастеров</h1>
          <p className="text-lg text-muted-foreground">
            Управление расписанием и мониторинг загрузки мастеров
          </p>
        </div>

        {/* Статистические карточки */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>
                Всего мастеров
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{masterData.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>
                Доступные мастера
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {masterData.filter(master => master.next_available_slot !== null).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>
                Общие заказы сегодня
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {masterData.reduce((sum, master) => sum + master.total_orders_today, 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>
                Средняя загрузка
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {masterData.length > 0 
                  ? Math.round(
                      masterData.reduce((sum, master) => sum + master.total_orders_today, 0) / masterData.length
                    )
                  : 0
                } заказов/день
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Основная таблица */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Детальная информация по мастерам</CardTitle>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Поиск мастеров..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={refreshData} disabled={loading}>
                  {loading ? 'Обновление...' : 'Обновить'}
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4">Загрузка данных рабочей нагрузки...</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map(header => (
                            <th 
                              key={header.id}
                              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {header.isPlaceholder
                                ? null
                                : flexRender(header.column.columnDef.header, header.getContext())
                              }
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody className="bg-background divide-y divide-border">
                      {table.getRowModel().rows.map(row => (
                        <tr 
                          key={row.id}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          {row.getVisibleCells().map(cell => (
                            <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Пагинация */}
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Показано {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} до{' '}
                    {Math.min(
                      (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                      table.getFilteredRowModel().rows.length
                    )}{' '}
                    из {table.getFilteredRowModel().rows.length} записей
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    >
                      Предыдущая
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                    >
                      Следующая
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MasterWorkloadTableRussian;
