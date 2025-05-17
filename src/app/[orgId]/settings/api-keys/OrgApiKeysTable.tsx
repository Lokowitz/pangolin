"use client";

import { ColumnDef } from "@tanstack/react-table";
import { OrgApiKeysDataTable } from "./OrgApiKeysDataTable";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@app/components/ui/dropdown-menu";
import { Button } from "@app/components/ui/button";
import { ArrowRight, ArrowUpDown, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ConfirmDeleteDialog from "@app/components/ConfirmDeleteDialog";
import { toast } from "@app/hooks/useToast";
import { formatAxiosError } from "@app/lib/api";
import { createApiClient } from "@app/lib/api";
import { useEnvContext } from "@app/hooks/useEnvContext";
import moment from "moment";
import { useTranslations } from "next-intl";

export type OrgApiKeyRow = {
    id: string;
    key: string;
    name: string;
    createdAt: string;
};

type OrgApiKeyTableProps = {
    apiKeys: OrgApiKeyRow[];
    orgId: string;
};

export default function OrgApiKeysTable({
    apiKeys,
    orgId
}: OrgApiKeyTableProps) {
    const router = useRouter();

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selected, setSelected] = useState<OrgApiKeyRow | null>(null);
    const [rows, setRows] = useState<OrgApiKeyRow[]>(apiKeys);

    const api = createApiClient(useEnvContext());

    const t = useTranslations();

    const deleteSite = (apiKeyId: string) => {
        api.delete(`/org/${orgId}/api-key/${apiKeyId}`)
            .catch((e) => {
                console.error(t('apiKeysErrorDelete'), e);
                toast({
                    variant: "destructive",
                    title: t('apiKeysErrorDelete'),
                    description: formatAxiosError(e, t('apiKeysErrorDeleteMessage'))
                });
            })
            .then(() => {
                router.refresh();
                setIsDeleteModalOpen(false);

                const newRows = rows.filter((row) => row.id !== apiKeyId);

                setRows(newRows);
            });
    };

    const columns: ColumnDef<OrgApiKeyRow>[] = [
        {
            id: "dots",
            cell: ({ row }) => {
                const apiKeyROw = row.original;
                const router = useRouter();

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => {
                                    setSelected(apiKeyROw);
                                }}
                            >
                                <span>{t('viewSettings')}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    setSelected(apiKeyROw);
                                    setIsDeleteModalOpen(true);
                                }}
                            >
                                <span className="text-red-500">{t('delete')}</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            }
        },
        {
            accessorKey: "name",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        {t('name')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            }
        },
        {
            accessorKey: "key",
            header: t('key'),
            cell: ({ row }) => {
                const r = row.original;
                return <span className="font-mono">{r.key}</span>;
            }
        },
        {
            accessorKey: "createdAt",
            header: t('createdAt'),
            cell: ({ row }) => {
                const r = row.original;
                return <span>{moment(r.createdAt).format("lll")} </span>;
            }
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const r = row.original;
                return (
                    <div className="flex items-center justify-end">
                        <Link href={`/${orgId}/settings/api-keys/${r.id}`}>
                            <Button variant={"outlinePrimary"} className="ml-2">
                                {t('edit')}
                                <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </Link>
                    </div>
                );
            }
        }
    ];

    return (
        <>
            {selected && (
                <ConfirmDeleteDialog
                    open={isDeleteModalOpen}
                    setOpen={(val) => {
                        setIsDeleteModalOpen(val);
                        setSelected(null);
                    }}
                    dialog={
                        <div className="space-y-4">
                            <p>
                                {t('apiKeysQuestionRemove', {selectedApiKey: selected?.name || selected?.id})}
                            </p>

                            <p>
                                <b>
                                    {t('apiKeysMessageRemove')}
                                </b>
                            </p>

                            <p>
                                {t('apiKeysMessageConfirm')}
                            </p>
                        </div>
                    }
                    buttonText={t('apiKeysDeleteConfirm')}
                    onConfirm={async () => deleteSite(selected!.id)}
                    string={selected.name}
                    title={t('apiKeysDelete')}
                />
            )}

            <OrgApiKeysDataTable
                columns={columns}
                data={rows}
                addApiKey={() => {
                    router.push(`/${orgId}/settings/api-keys/create`);
                }}
            />
        </>
    );
}
