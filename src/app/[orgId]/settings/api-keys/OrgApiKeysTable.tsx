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

    const deleteSite = (apiKeyId: string) => {
        api.delete(`/org/${orgId}/api-key/${apiKeyId}`)
            .catch((e) => {
                console.error("Error deleting API key", e);
                toast({
                    variant: "destructive",
                    title: "Error deleting API key",
                    description: formatAxiosError(e, "Error deleting API key")
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
                                <span>View settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    setSelected(apiKeyROw);
                                    setIsDeleteModalOpen(true);
                                }}
                            >
                                <span className="text-red-500">Delete</span>
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
                        Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            }
        },
        {
            accessorKey: "key",
            header: "Key",
            cell: ({ row }) => {
                const r = row.original;
                return <span className="font-mono">{r.key}</span>;
            }
        },
        {
            accessorKey: "createdAt",
            header: "Created At",
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
                                Edit
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
                                Are you sure you want to remove the API key{" "}
                                <b>{selected?.name || selected?.id}</b> from the
                                organization?
                            </p>

                            <p>
                                <b>
                                    Once removed, the API key will no longer be
                                    able to be used.
                                </b>
                            </p>

                            <p>
                                To confirm, please type the name of the API key
                                below.
                            </p>
                        </div>
                    }
                    buttonText="Confirm Delete API Key"
                    onConfirm={async () => deleteSite(selected!.id)}
                    string={selected.name}
                    title="Delete API Key"
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
