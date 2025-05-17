"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@app/components/ui/data-table";
import { useTranslations } from 'next-intl';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    createResource?: () => void;
}

export function ResourcesDataTable<TData, TValue>({
    columns,
    data,
    createResource
}: DataTableProps<TData, TValue>) {

    const t = useTranslations();

    return (
        <DataTable
            columns={columns}
            data={data}
            title={t('resources')}
            searchPlaceholder={t('resourcesSearch')}
            searchColumn="name"
            onAdd={createResource}
            addButtonText={t('resourceAdd')}
            defaultSort={{
                id: "name",
                desc: false
            }}
        />
    );
}
