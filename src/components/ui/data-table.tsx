"use client";

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    SortingState,
    getSortedRowModel,
    ColumnFiltersState,
    getFilteredRowModel
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@app/components/ui/button";
import { useState } from "react";
import { Input } from "@app/components/ui/input";
import { DataTablePagination } from "@app/components/DataTablePagination";
import { Plus, Search } from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@app/components/ui/card";

type DataTableProps<TData, TValue> = {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    title?: string;
    addButtonText?: string;
    onAdd?: () => void;
    searchPlaceholder?: string;
    searchColumn?: string;
    defaultSort?: {
        id: string;
        desc: boolean;
    };
};

export function DataTable<TData, TValue>({
    columns,
    data,
    title,
    addButtonText,
    onAdd,
    searchPlaceholder = "Search...",
    searchColumn = "name",
    defaultSort
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>(
        defaultSort ? [defaultSort] : []
    );
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState<any>([]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onGlobalFilterChange: setGlobalFilter,
        initialState: {
            pagination: {
                pageSize: 20,
                pageIndex: 0
            }
        },
        state: {
            sorting,
            columnFilters,
            globalFilter
        }
    });

    return (
        <div className="container mx-auto max-w-12xl">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="flex items-center max-w-sm w-full relative mr-2">
                        <Input
                            placeholder={searchPlaceholder}
                            value={globalFilter ?? ""}
                            onChange={(e) =>
                                table.setGlobalFilter(String(e.target.value))
                            }
                            className="w-full pl-8"
                        />
                        <Search className="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    </div>
                    {onAdd && addButtonText && (
                        <Button onClick={onAdd}>
                            <Plus className="mr-2 h-4 w-4" />
                            {addButtonText}
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef
                                                          .header,
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
                                        data-state={
                                            row.getIsSelected() && "selected"
                                        }
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
                                        No results found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <div className="mt-4">
                        <DataTablePagination table={table} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
