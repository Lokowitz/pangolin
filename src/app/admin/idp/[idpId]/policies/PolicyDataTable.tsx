"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@app/components/ui/data-table";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    onAdd: () => void;
}

export function PolicyDataTable<TData, TValue>({
    columns,
    data,
    onAdd
}: DataTableProps<TData, TValue>) {
    return (
        <DataTable
            columns={columns}
            data={data}
            title="Organization Policies"
            searchPlaceholder="Search organization policies..."
            searchColumn="orgId"
            addButtonText="Add Organization Policy"
            onAdd={onAdd}
        />
    );
}
