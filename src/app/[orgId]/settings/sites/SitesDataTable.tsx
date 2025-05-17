"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@app/components/ui/data-table";
import { useTranslations } from 'next-intl';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    createSite?: () => void;
}

export function SitesDataTable<TData, TValue>({
    columns,
    data,
    createSite
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
            defaultSort={{
                id: "name",
                desc: false
            }}
        />
    );
}
