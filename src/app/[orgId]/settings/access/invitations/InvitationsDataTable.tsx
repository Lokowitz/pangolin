"use client";

import {
    ColumnDef,
} from "@tanstack/react-table";
import { DataTable } from "@app/components/ui/data-table";
import { useTranslations } from 'next-intl';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
}

/**
 * Renders a data table for invitations with localized title and search placeholder.
 *
 * Displays the provided columns and data using the `DataTable` component, with internationalized strings for the table title and search input. The search functionality is configured to filter by the "email" column.
 *
 * @param columns - The column definitions for the table
 * @param data - The data to display in the table
 */
export function InvitationsDataTable<TData, TValue>({
    columns,
    data
}: DataTableProps<TData, TValue>) {

    const t = useTranslations();

    return (
        <DataTable
            columns={columns}
            data={data}
            title={t('invite')}
            searchPlaceholder={t('inviteSearch')}
            searchColumn="email"
        />
    );
}
