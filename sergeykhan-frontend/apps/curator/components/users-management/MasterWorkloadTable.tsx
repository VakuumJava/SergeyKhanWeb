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
import { ChevronDown, Calendar, Clock, User } from "lucide-react";
import axios from "axios";

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
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Master } from "@shared/constants/types";

interface MasterAvailability {
    id: number;
    master: number;
    date: string;
    start_time: string;
    end_time: string;
    created_at: string;
    updated_at: string;
}

interface MasterWorkload {
    master: Master;
    availability_slots: MasterAvailability[];
    orders_count: number;
    next_available_slot: string | null;
    workload_percentage: number;
}

interface MasterWorkloadTableProps {
    refreshTrigger?: number;
}

const MasterWorkloadTable: React.FC<MasterWorkloadTableProps> = ({ refreshTrigger = 0 }) => {
    const router = useRouter();
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [searchInput, setSearchInput] = React.useState<string>("");
    const [selectedSearchColumn, setSelectedSearchColumn] = React.useState<string>("email");
    const [workloadData, setWorkloadData] = React.useState<MasterWorkload[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    // Fetch master workload data
    const fetchWorkloadData = React.useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            const token = localStorage.getItem("authToken");
            if (!token) {
                throw new Error("No authentication token found");
            }

            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/api/masters/workload/all/`,
                {
                    headers: {
                        Authorization: `Token ${token}`,
                    },
                }
            );

            setWorkloadData(response.data);
        } catch (err) {
            console.error("Error fetching workload data:", err);
            setError(err instanceof Error ? err.message : "Failed to load workload data");
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchWorkloadData();
    }, [fetchWorkloadData, refreshTrigger]);

    const columns = React.useMemo<ColumnDef<MasterWorkload>[]>(
        () => [
            {
                accessorKey: "master.email",
                header: "Master Email",
                cell: ({ row }) => (
                    <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{row.original.master.email}</span>
                    </div>
                ),
            },
            {
                accessorKey: "master.name",
                header: "Name",
                cell: ({ row }) => (
                    <span>{row.original.master.first_name} {row.original.master.last_name}</span>
                ),
            },
            {
                accessorKey: "orders_count",
                header: "Active Orders",
                cell: ({ row }) => (
                    <Badge variant={row.original.orders_count > 5 ? "destructive" : "default"}>
                        {row.original.orders_count}
                    </Badge>
                ),
            },
            {
                accessorKey: "availability_slots",
                header: "Available Slots",
                cell: ({ row }) => (
                    <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>{row.original.availability_slots.length}</span>
                    </div>
                ),
            },
            {
                accessorKey: "next_available_slot",
                header: "Next Available",
                cell: ({ row }) => (
                    <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">
                            {row.original.next_available_slot 
                                ? new Date(row.original.next_available_slot).toLocaleDateString()
                                : "No slots"
                            }
                        </span>
                    </div>
                ),
            },
            {
                accessorKey: "workload_percentage",
                header: "Workload",
                cell: ({ row }) => {
                    const percentage = row.original.workload_percentage;
                    const getWorkloadColor = (p: number) => {
                        if (p >= 80) return "destructive";
                        if (p >= 60) return "secondary";
                        return "outline";
                    };
                    
                    return (
                        <Badge variant={getWorkloadColor(percentage)}>
                            {percentage.toFixed(1)}%
                        </Badge>
                    );
                },
            },
            {
                id: "actions",
                header: "Actions",
                cell: ({ row }) => (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => router.push(`/workload/${row.original.master.id}`)}
                            >
                                View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => router.push(`/masters/${row.original.master.id}/availability`)}
                            >
                                Manage Availability
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ),
            },
        ],
        [router]
    );

    const table = useReactTable({
        data: workloadData,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnFilters,
        },
    });

    React.useEffect(() => {
        if (searchInput) {
            table.getColumn(selectedSearchColumn)?.setFilterValue(searchInput);
        } else {
            table.getColumn(selectedSearchColumn)?.setFilterValue("");
        }
    }, [searchInput, selectedSearchColumn, table]);

    const handleRefresh = () => {
        fetchWorkloadData();
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Master Workload Overview</CardTitle>
                    <CardDescription>Loading workload data...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Master Workload Overview</CardTitle>
                    <CardDescription>Error loading data</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-red-500 text-center py-8">
                        <p>{error}</p>
                        <Button onClick={handleRefresh} className="mt-4">
                            Try Again
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Master Workload Overview</CardTitle>
                        <CardDescription>
                            Manage master schedules and monitor workload distribution
                        </CardDescription>
                    </div>
                    <Button onClick={handleRefresh} variant="outline">
                        Refresh
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="w-full">
                    <div className="flex items-center py-4 space-x-4">
                        <Input
                            placeholder={`Search by ${selectedSearchColumn}...`}
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            className="max-w-sm"
                        />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    Search by: {selectedSearchColumn}
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuCheckboxItem
                                    checked={selectedSearchColumn === "master.email"}
                                    onCheckedChange={() => setSelectedSearchColumn("master.email")}
                                >
                                    Email
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={selectedSearchColumn === "master.name"}
                                    onCheckedChange={() => setSelectedSearchColumn("master.name")}
                                >
                                    Name
                                </DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableHead key={header.id}>
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          header.column.columnDef.header,
                                                          header.getContext()
                                                      )}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && "selected"}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id}>
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-24 text-center"
                                        >
                                            No masters found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <div className="space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                Previous
                            </Button>
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
                </div>
            </CardContent>
        </Card>
    );
};

export default MasterWorkloadTable;
