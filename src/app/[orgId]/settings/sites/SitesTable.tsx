"use client";

import { ColumnDef } from "@tanstack/react-table";
import { SitesDataTable } from "./SitesDataTable";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@app/components/ui/dropdown-menu";
import { Button } from "@app/components/ui/button";
import {
    ArrowRight,
    ArrowUpDown,
    Check,
    MoreHorizontal,
    X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AxiosResponse } from "axios";
import { useState } from "react";
import CreateSiteForm from "./CreateSiteForm";
import ConfirmDeleteDialog from "@app/components/ConfirmDeleteDialog";
import { toast } from "@app/hooks/useToast";
import { formatAxiosError } from "@app/lib/api";
import { createApiClient } from "@app/lib/api";
import { useEnvContext } from "@app/hooks/useEnvContext";
import CreateSiteFormModal from "./CreateSiteModal";
import { parseDataSize } from '@app/lib/dataSize';

export type SiteRow = {
    id: number;
    nice: string;
    name: string;
    mbIn: string;
    mbOut: string;
    orgId: string;
    type: "newt" | "wireguard";
    online: boolean;
};

type SitesTableProps = {
    sites: SiteRow[];
    orgId: string;
};

export default function SitesTable({ sites, orgId }: SitesTableProps) {
    const router = useRouter();

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedSite, setSelectedSite] = useState<SiteRow | null>(null);
    const [rows, setRows] = useState<SiteRow[]>(sites);

    const api = createApiClient(useEnvContext());

    const deleteSite = (siteId: number) => {
        api.delete(`/site/${siteId}`)
            .catch((e) => {
                console.error("Error deleting site", e);
                toast({
                    variant: "destructive",
                    title: "Error deleting site",
                    description: formatAxiosError(e, "Error deleting site")
                });
            })
            .then(() => {
                router.refresh();
                setIsDeleteModalOpen(false);

                const newRows = rows.filter((row) => row.id !== siteId);

                setRows(newRows);
            });
    };

    const columns: ColumnDef<SiteRow>[] = [
        {
            id: "dots",
            cell: ({ row }) => {
                const siteRow = row.original;
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
                            <Link
                                className="block w-full"
                                href={`/${siteRow.orgId}/settings/sites/${siteRow.nice}`}
                            >
                                <DropdownMenuItem>
                                    View settings
                                </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem
                                onClick={() => {
                                    setSelectedSite(siteRow);
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
            accessorKey: "online",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        Online
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }) => {
                const originalRow = row.original;
                if (
                    originalRow.type == "newt" ||
                    originalRow.type == "wireguard"
                ) {
                    if (originalRow.online) {
                        return (
                            <span className="text-green-500 flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>Online</span>
                            </span>
                        );
                    } else {
                        return (
                            <span className="text-neutral-500 flex items-center space-x-2">
                                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                <span>Offline</span>
                            </span>
                        );
                    }
                } else {
                    return <span>-</span>;
                }
            }
        },
        {
            accessorKey: "nice",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        Site
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            }
        },
        {
            accessorKey: "mbIn",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        Data In
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            sortingFn: (rowA, rowB) => 
                parseDataSize(rowA.original.mbIn) - parseDataSize(rowB.original.mbIn)
        },
        {
            accessorKey: "mbOut",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        Data Out
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            sortingFn: (rowA, rowB) =>
                parseDataSize(rowA.original.mbOut) - parseDataSize(rowB.original.mbOut),
        },
        {
            accessorKey: "type",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        Connection Type
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }) => {
                const originalRow = row.original;

                if (originalRow.type === "newt") {
                    return (
                        <div className="flex items-center space-x-2">
                            <span>Newt</span>
                        </div>
                    );
                }

                if (originalRow.type === "wireguard") {
                    return (
                        <div className="flex items-center space-x-2">
                            <span>WireGuard</span>
                        </div>
                    );
                }

                if (originalRow.type === "local") {
                    return (
                        <div className="flex items-center space-x-2">
                            <span>Local</span>
                        </div>
                    );
                }
            }
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const siteRow = row.original;
                return (
                    <div className="flex items-center justify-end">
                        <Link
                            href={`/${siteRow.orgId}/settings/sites/${siteRow.nice}`}
                        >
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
            {selectedSite && (
                <ConfirmDeleteDialog
                    open={isDeleteModalOpen}
                    setOpen={(val) => {
                        setIsDeleteModalOpen(val);
                        setSelectedSite(null);
                    }}
                    dialog={
                        <div className="space-y-4">
                            <p>
                                Are you sure you want to remove the site{" "}
                                <b>{selectedSite?.name || selectedSite?.id}</b>{" "}
                                from the organization?
                            </p>

                            <p>
                                Once removed, the site will no longer be
                                accessible.{" "}
                                <b>
                                    All resources and targets associated with
                                    the site will also be removed.
                                </b>
                            </p>

                            <p>
                                To confirm, please type the name of the site
                                below.
                            </p>
                        </div>
                    }
                    buttonText="Confirm Delete Site"
                    onConfirm={async () => deleteSite(selectedSite!.id)}
                    string={selectedSite.name}
                    title="Delete Site"
                />
            )}

            <SitesDataTable
                columns={columns}
                data={rows}
                createSite={() =>
                    router.push(`/${orgId}/settings/sites/create`)
                }
            />
        </>
    );
}
