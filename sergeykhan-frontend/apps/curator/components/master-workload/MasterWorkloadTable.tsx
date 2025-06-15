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
  MoreHorizontal,
  Activity
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

const MasterWorkloadTable: React.FC = () => {
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
            <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-gray-900 dark:text-gray-100">{info.getValue()}</span>
          </div>
        ),
      }),
      columnHelper.accessor('total_orders_today', {
        header: 'Заказы сегодня',
        cell: info => (
          <Badge variant="default" className="flex items-center gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
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
              <Badge variant="destructive" className="flex items-center gap-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                <AlertCircle className="h-3 w-3" />
                Нет слотов
              </Badge>
            );
          }
          
          return (
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{nextSlot.date}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {nextSlot.start_time} - {nextSlot.end_time}
              </div>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Действия',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="border-gray-300 dark:border-gray-600">
              <Edit className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="outline" className="border-gray-300 dark:border-gray-600">
              <Calendar className="h-3 w-3" />
            </Button>
          </div>
        ),
      }),
    ],
    []
  );

  // Загрузка данных
  const fetchMasterData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Токен авторизации не найден');
      }

      const response = await axios.get(`${API}/api/masters/workload/all/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      setMasterData(response.data);
      setError(null);
    } catch (err) {
      console.error('Ошибка загрузки данных мастеров:', err);
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  // Настройка таблицы
  const table = useReactTable({
    data: masterData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Activity className="h-5 w-5" />
              Нагрузка мастеров
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Activity className="h-5 w-5" />
              Нагрузка мастеров
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                Ошибка: {error}
              </AlertDescription>
            </Alert>
            <Button 
              onClick={fetchMasterData} 
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Попробовать снова
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Activity className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            Нагрузка мастеров
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Управление рабочей нагрузкой и расписанием мастеров
          </p>
        </div>
        <Button 
          onClick={fetchMasterData}
          variant="outline"
          className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Обновить
        </Button>
      </div>

      {/* Основная карточка */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-900 dark:text-gray-100">
              Список мастеров ({masterData.length})
            </CardTitle>
            <div className="flex items-center gap-4">
              {/* Поиск */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Поиск мастеров..."
                  value={globalFilter ?? ''}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-10 w-64 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                />
              </div>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Добавить слот
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Таблица */}
          <div className="rounded-md border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th 
                          key={header.id}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {table.getRowModel().rows.map((row) => (
                    <tr 
                      key={row.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td 
                          key={cell.id}
                          className="px-6 py-4 whitespace-nowrap text-sm"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Пагинация */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Показано {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} - {' '}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )} из {table.getFilteredRowModel().rows.length} записей
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="border-gray-300 dark:border-gray-600"
              >
                Назад
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="border-gray-300 dark:border-gray-600"
              >
                Вперед
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MasterWorkloadTable;
