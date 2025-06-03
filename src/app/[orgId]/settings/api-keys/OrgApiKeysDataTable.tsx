"use client";

import { DataTable } from "@app/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    addApiKey?: () => void;
}

export function OrgApiKeysDataTable<TData, TValue>({
    addApiKey,
    columns,
    data
}: DataTableProps<TData, TValue>) {
    return (
        <DataTable
            columns={columns}
            data={data}
            title="API Keys"
            searchPlaceholder="Search API keys..."
            searchColumn="name"
            onAdd={addApiKey}
            addButtonText="Generate API Key"
        />
    );
}
