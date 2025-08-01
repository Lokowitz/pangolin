"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@app/components/ui/data-table";
import { useTranslations } from "next-intl";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    createSite?: () => void;
    onRefresh?: () => void;
    isRefreshing?: boolean;
}

export function SitesDataTable<TData, TValue>({
    columns,
    data,
    createSite,
    onRefresh,
    isRefreshing
}: DataTableProps<TData, TValue>) {

    const t = useTranslations();

    return (
        <DataTable
            columns={columns}
            data={data}
            title={t('sites')}
            searchPlaceholder={t('searchSitesProgress')}
            searchColumn="name"
            onAdd={createSite}
            addButtonText={t('siteAdd')}
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
            defaultSort={{
                id: "name",
                desc: false
            }}
        />
    );
}
