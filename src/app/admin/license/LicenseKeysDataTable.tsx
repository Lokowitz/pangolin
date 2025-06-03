"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@app/components/ui/data-table";
import { Button } from "@app/components/ui/button";
import { Badge } from "@app/components/ui/badge";
import { LicenseKeyCache } from "@server/license/license";
import { ArrowUpDown } from "lucide-react";
import moment from "moment";
import CopyToClipboard from "@app/components/CopyToClipboard";

type LicenseKeysDataTableProps = {
    licenseKeys: LicenseKeyCache[];
    onDelete: (key: LicenseKeyCache) => void;
    onCreate: () => void;
};

function obfuscateLicenseKey(key: string): string {
    if (key.length <= 8) return key;
    const firstPart = key.substring(0, 4);
    const lastPart = key.substring(key.length - 4);
    return `${firstPart}••••••••••••••••••••${lastPart}`;
}

export function LicenseKeysDataTable({
    licenseKeys,
    onDelete,
    onCreate
}: LicenseKeysDataTableProps) {
    const columns: ColumnDef<LicenseKeyCache>[] = [
        {
            accessorKey: "licenseKey",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        License Key
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }) => {
                const licenseKey = row.original.licenseKey;
                return (
                    <CopyToClipboard
                        text={licenseKey}
                        displayText={obfuscateLicenseKey(licenseKey)}
                    />
                );
            }
        },
        {
            accessorKey: "valid",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        Valid
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }) => {
                return row.original.valid ? "Yes" : "No";
            }
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
                        Type
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }) => {
                const type = row.original.type;
                const label =
                    type === "SITES" ? "Additional Sites" : "Host License";
                const variant = type === "SITES" ? "secondary" : "default";
                return row.original.valid ? (
                    <Badge variant={variant}>{label}</Badge>
                ) : null;
            }
        },
        {
            accessorKey: "numSites",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        Number of Sites
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            }
        },
        {
            id: "delete",
            cell: ({ row }) => (
                <div className="flex items-center justify-end space-x-2">
                    <Button
                        variant="outlinePrimary"
                        onClick={() => onDelete(row.original)}
                    >
                        Delete
                    </Button>
                </div>
            )
        }
    ];

    return (
        <DataTable
            columns={columns}
            data={licenseKeys}
            title="License Keys"
            searchPlaceholder="Search license keys..."
            searchColumn="licenseKey"
            onAdd={onCreate}
            addButtonText="Add License Key"
        />
    );
}
