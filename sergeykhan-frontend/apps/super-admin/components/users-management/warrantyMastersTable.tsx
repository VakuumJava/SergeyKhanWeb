"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
    SortingState,
    ColumnFiltersState,
    flexRender,
    ColumnDef,
} from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";

import { Button } from "@workspace/ui/components/ui";
import { Input } from "@workspace/ui/components/ui";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuItem,
} from "@workspace/ui/components/ui";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@workspace/ui/components/ui";
import {Master} from "@shared/constants/types";

interface WarrantyMastersTableProps {
    mastersData?: Master[];
}

const WarrantyMastersTable: React.FC<WarrantyMastersTableProps> = ({ mastersData }) => {
    const router = useRouter();
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [searchInput, setSearchInput] = React.useState<string>("");
    const [selectedSearchColumn, setSelectedSearchColumn] = React.useState<string>("email");
    const [selectedSortLabel, setSelectedSortLabel] = React.useState<string>("Sort");

    const columns = React.useMemo<ColumnDef<Master>[]>(
      () => [
          { accessorKey: "id", header: "ID" },
          { accessorKey: "email", header: "Email" },
          { 
              accessorKey: "specialty", 
              header: "Специализация",
              cell: ({ row }) => row.original.specialty || "Не указана"
          },
      ],
      []
    );

    const table = useReactTable({
        data: mastersData ?? [],
        columns,
        state: { sorting, columnFilters },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: { pageSize: 5 },
        },
    });

    const handleSortChange = (columnId: string, desc: boolean, label: string) => {
        setSorting([{ id: columnId, desc }]);
        setSelectedSortLabel(label);
    };

    const searchOptions = [
        { id: "id", label: "ID" },
        { id: "email", label: "Email" },
        { id: "specialty", label: "Специализация" },
    ];

    const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchInput(value);
        setColumnFilters([{ id: selectedSearchColumn, value }]);
    };

    const handleSearchColumnChange = (columnId: string) => {
        setSelectedSearchColumn(columnId);
        setSearchInput("");
        setColumnFilters([]);
    };

    return (
      <div className="w-full">
          {/* Верхняя панель: поиск и управление столбцами/сортировкой */}
          <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-2">
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="outline">
                              Поиск по:{" "}
                              {searchOptions.find((opt) => opt.id === selectedSearchColumn)?.label}{" "}
                              <ChevronDown />
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                          {searchOptions.map((option) => (
                            <DropdownMenuItem
                              key={option.id}
                              onClick={() => handleSearchColumnChange(option.id)}
                            >
                                {option.label}
                            </DropdownMenuItem>
                          ))}
                      </DropdownMenuContent>
                  </DropdownMenu>
                  <Input
                    placeholder={`Введите текст для поиска по ${
                      searchOptions.find((opt) => opt.id === selectedSearchColumn)?.label
                    }`}
                    value={searchInput}
                    onChange={handleSearchInputChange}
                    className="max-w-sm"
                  />
              </div>
              <div className="flex space-x-2">
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="outline">
                              Столбцы <ChevronDown />
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                          {table.getAllColumns().map((column) => (
                            <DropdownMenuCheckboxItem
                              key={column.id}
                              className="capitalize"
                              checked={column.getIsVisible()}
                              onCheckedChange={(value) => column.toggleVisibility(!!value)}
                            >
                                {column.id}
                            </DropdownMenuCheckboxItem>
                          ))}
                      </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="outline">
                              {selectedSortLabel} <ChevronDown />
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleSortChange("id", false, "ID А-Я")}>
                              ID А-Я
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSortChange("id", true, "ID Я-А")}>
                              ID Я-А
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSortChange("email", false, "Email А-Я")}>
                              Email А-Я
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSortChange("email", true, "Email Я-А")}>
                              Email Я-А
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSortChange("specialty", false, "Специализация А-Я")}>
                              Специализация А-Я
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSortChange("specialty", true, "Специализация Я-А")}>
                              Специализация Я-А
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                                setSorting([]);
                                setSelectedSortLabel("Сортировка");
                            }}
                          >
                              Сбросить сортировку
                          </DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>
              </div>
          </div>

          {/* Таблица */}
          <div className="overflow-x-auto">
              <div className="min-w-[600px] rounded-md border">
                  <Table>
                      <TableHeader>
                          {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                  <TableHead key={header.id}>
                                      {header.isPlaceholder
                                        ? null
                                        : flexRender(header.column.columnDef.header, header.getContext())}
                                  </TableHead>
                                ))}
                            </TableRow>
                          ))}
                      </TableHeader>
                      <TableBody>
                          {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                              <TableRow
                                key={row.id}
                                className="cursor-pointer hover:bg-muted"
                                onClick={() => router.push(`/users/master/${row.original.id}`)}
                              >
                                  {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                  ))}
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    Гарантийные мастера не найдены.
                                </TableCell>
                            </TableRow>
                          )}
                      </TableBody>
                  </Table>
              </div>
          </div>

          {/* Пагинация */}
          <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                  Предыдущая
              </Button>
              <span className="text-sm text-muted-foreground">
                Страница {table.getState().pagination.pageIndex + 1} из {table.getPageCount()}
              </span>
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
    );
};

export default WarrantyMastersTable;
