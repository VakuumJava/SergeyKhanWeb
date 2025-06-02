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

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuItem,
} from "@workspace/ui/components/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@workspace/ui/components/table";
import {Master} from "@shared/constants/types";



interface MastersTableProps {
    mastersData?: Master[];
}

const MastersTable: React.FC<MastersTableProps> = ({ mastersData }) => {
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
          // { accessorKey: "role", header: "Role" },
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
        // { id: "role", label: "Role" },
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
                              Search by:{" "}
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
                    placeholder={`Enter query for ${
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
                              Columns <ChevronDown />
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
                          <DropdownMenuItem onClick={() => handleSortChange("id", false, "ID A-Z")}>
                              ID A-Z
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSortChange("id", true, "ID Z-A")}>
                              ID Z-A
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSortChange("email", false, "Email A-Z")}>
                              Email A-Z
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSortChange("email", true, "Email Z-A")}>
                              Email Z-A
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSortChange("role", false, "Role A-Z")}>
                              Role A-Z
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSortChange("role", true, "Role Z-A")}>
                              Role Z-A
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                                setSorting([]);
                                setSelectedSortLabel("Sort");
                            }}
                          >
                              Reset Sort
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
                                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                                onClick={() => router.push(`/master-management/${row.original.id}`)}
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
                                    No masters.
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
                  Previous
              </Button>
              <span className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                  Next
              </Button>
          </div>
      </div>
    );
};

export default MastersTable;