"use client";

import {
    ColumnDef
} from "@tanstack/react-table";
import { DataTable } from "@app/components/ui/data-table";
import { useTranslations } from "next-intl";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    addApiKey?: () => void;
    onRefresh?: () => void;
    isRefreshing?: boolean;
}

export function ApiKeysDataTable<TData, TValue>({
    addApiKey,
    columns,
    data,
    onRefresh,
    isRefreshing
}: DataTableProps<TData, TValue>) {
    const t = useTranslations();

    return (
        <DataTable
            columns={columns}
            data={data}
            persistPageSize="apiKeys-table"
            title={t("apiKeys")}
            searchPlaceholder={t("searchApiKeys")}
            searchColumn="name"
            onAdd={addApiKey}
            addButtonText={t("apiKeysAdd")}
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
            enableColumnVisibility={true}
            stickyLeftColumn="name"
            stickyRightColumn="actions"
        />
    );
}
