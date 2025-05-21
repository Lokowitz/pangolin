"use client";

import { ColumnDef } from "@tanstack/react-table";
import { UsersDataTable } from "./AdminUsersDataTable";
import { Button } from "@app/components/ui/button";
import { ArrowRight, ArrowUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ConfirmDeleteDialog from "@app/components/ConfirmDeleteDialog";
import { toast } from "@app/hooks/useToast";
import { formatAxiosError } from "@app/lib/api";
import { createApiClient } from "@app/lib/api";
import { useEnvContext } from "@app/hooks/useEnvContext";
import { useTranslations } from 'next-intl';

export type GlobalUserRow = {
    id: string;
    name: string | null;
    username: string;
    email: string | null;
    type: string;
    idpId: number | null;
    idpName: string;
    dateCreated: string;
};

type Props = {
    users: GlobalUserRow[];
};

export default function UsersTable({ users }: Props) {
    const router = useRouter();
    const t = useTranslations();

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selected, setSelected] = useState<GlobalUserRow | null>(null);
    const [rows, setRows] = useState<GlobalUserRow[]>(users);

    const api = createApiClient(useEnvContext());

    const deleteUser = (id: string) => {
        api.delete(`/user/${id}`)
            .catch((e) => {
                console.error(t('userErrorDelete'), e);
                toast({
                    variant: "destructive",
                    title: t('userErrorDelete'),
                    description: formatAxiosError(e, t('userErrorDelete'))
                });
            })
            .then(() => {
                router.refresh();
                setIsDeleteModalOpen(false);

                const newRows = rows.filter((row) => row.id !== id);

                setRows(newRows);
            });
    };

    const columns: ColumnDef<GlobalUserRow>[] = [
        {
            accessorKey: "id",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        ID
                    </Button>
                );
            }
        },
        {
            accessorKey: "username",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        {t('username')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            }
        },
        {
            accessorKey: "email",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        {t('email')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
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
            accessorKey: "idpName",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        {t('identityProvider')}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            }
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const r = row.original;
                return (
                    <>
                        <div className="flex items-center justify-end">
                            <Button
                                variant={"outlinePrimary"}
                                className="ml-2"
                                onClick={() => {
                                    setSelected(r);
                                    setIsDeleteModalOpen(true);
                                }}
                            >
                                {t('delete')}
                            </Button>
                        </div>
                    </>
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
                                {t('userQuestionRemove', {selectedUser: selected?.email || selected?.name || selected?.username})}
                            </p>

                            <p>
                                <b>
                                    {t('userMessageRemove')}
                                </b>
                            </p>

                            <p>
                                {t('userMessageConfirm')}
                            </p>
                        </div>
                    }
                    buttonText={t('userDeleteConfirm')}
                    onConfirm={async () => deleteUser(selected!.id)}
                    string={
                        selected.email || selected.name || selected.username
                    }
                    title={t('userDeleteServer')}
                />
            )}

            <UsersDataTable columns={columns} data={rows} />
        </>
    );
}
