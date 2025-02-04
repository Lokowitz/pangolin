"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@app/components/ui/dropdown-menu";
import { Button } from "@app/components/ui/button";
import { ArrowRight, ArrowUpDown, Crown, MoreHorizontal } from "lucide-react";
import { UsersDataTable } from "./UsersDataTable";
import { useState } from "react";
import InviteUserForm from "./InviteUserForm";
import ConfirmDeleteDialog from "@app/components/ConfirmDeleteDialog";
import { useOrgContext } from "@app/hooks/useOrgContext";
import { useToast } from "@app/hooks/useToast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatAxiosError } from "@app/lib/api";
import { createApiClient } from "@app/lib/api";
import { useEnvContext } from "@app/hooks/useEnvContext";
import { useUserContext } from "@app/hooks/useUserContext";

export type UserRow = {
    id: string;
    email: string;
    status: string;
    role: string;
    isOwner: boolean;
};

type UsersTableProps = {
    users: UserRow[];
};

export default function UsersTable({ users: u }: UsersTableProps) {
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

    const [users, setUsers] = useState<UserRow[]>(u);

    const router = useRouter();

    const api = createApiClient(useEnvContext());

    const { user, updateUser } = useUserContext();
    const { org } = useOrgContext();
    const { toast } = useToast();

    const columns: ColumnDef<UserRow>[] = [
        {
            id: "dots",
            cell: ({ row }) => {
                const userRow = row.original;
                return (
                    <>
                        <div>
                            {userRow.isOwner && (
                                <MoreHorizontal className="h-4 w-4 opacity-0" />
                            )}
                            {!userRow.isOwner && (
                                <>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                className="h-8 w-8 p-0"
                                            >
                                                <span className="sr-only">
                                                    Open menu
                                                </span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <Link
                                                href={`/${org?.org.orgId}/settings/access/users/${userRow.id}`}
                                                className="block w-full"
                                            >
                                                <DropdownMenuItem>
                                                    Manage User
                                                </DropdownMenuItem>
                                            </Link>
                                            {userRow.email !== user?.email && (
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setIsDeleteModalOpen(
                                                            true
                                                        );
                                                        setSelectedUser(
                                                            userRow
                                                        );
                                                    }}
                                                >
                                                    <span className="text-red-500">
                                                        Remove User
                                                    </span>
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </>
                            )}
                        </div>
                    </>
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
                        Email
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            }
        },
        {
            accessorKey: "status",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        Status
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            }
        },
        {
            accessorKey: "role",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        Role
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }) => {
                const userRow = row.original;

                return (
                    <div className="flex flex-row items-center gap-2">
                        {userRow.isOwner && (
                            <Crown className="w-4 h-4 text-yellow-600" />
                        )}
                        <span>{userRow.role}</span>
                    </div>
                );
            }
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const userRow = row.original;
                return (
                    <div className="flex items-center justify-end">
                        {userRow.isOwner && (
                            <Button
                                variant="ghost"
                                className="opacity-0 cursor-default"
                            >
                                Placeholder
                            </Button>
                        )}
                        {!userRow.isOwner && (
                            <Link
                                href={`/${org?.org.orgId}/settings/access/users/${userRow.id}`}
                            >
                                <Button variant={"outline"} className="ml-2">
                                    Manage
                                    <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            </Link>
                        )}
                    </div>
                );
            }
        }
    ];

    async function removeUser() {
        if (selectedUser) {
            const res = await api
                .delete(`/org/${org!.org.orgId}/user/${selectedUser.id}`)
                .catch((e) => {
                    toast({
                        variant: "destructive",
                        title: "Failed to remove user",
                        description: formatAxiosError(
                            e,
                            "An error occurred while removing the user."
                        )
                    });
                });

            if (res && res.status === 200) {
                toast({
                    variant: "default",
                    title: "User removed",
                    description: `The user ${selectedUser.email} has been removed from the organization.`
                });

                setUsers((prev) =>
                    prev.filter((u) => u.id !== selectedUser?.id)
                );
            }
        }
        setIsDeleteModalOpen(false);
    }

    return (
        <>
            <ConfirmDeleteDialog
                open={isDeleteModalOpen}
                setOpen={(val) => {
                    setIsDeleteModalOpen(val);
                    setSelectedUser(null);
                }}
                dialog={
                    <div className="space-y-4">
                        <p>
                            Are you sure you want to remove{" "}
                            <b>{selectedUser?.email}</b> from the organization?
                        </p>

                        <p>
                            Once removed, this user will no longer have access
                            to the organization. You can always re-invite them
                            later, but they will need to accept the invitation
                            again.
                        </p>

                        <p>
                            To confirm, please type the email address of the
                            user below.
                        </p>
                    </div>
                }
                buttonText="Confirm Remove User"
                onConfirm={removeUser}
                string={selectedUser?.email ?? ""}
                title="Remove User from Organization"
            />

            <InviteUserForm
                open={isInviteModalOpen}
                setOpen={setIsInviteModalOpen}
            />

            <UsersDataTable
                columns={columns}
                data={users}
                inviteUser={() => {
                    setIsInviteModalOpen(true);
                }}
            />
        </>
    );
}
