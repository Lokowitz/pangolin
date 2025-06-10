import { useEffect, useState, FC, useCallback, useMemo } from "react";
import {
    ColumnDef,
    getCoreRowModel,
    useReactTable,
    flexRender,
    getFilteredRowModel,
    VisibilityState
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
    Credenza,
    CredenzaBody,
    CredenzaClose,
    CredenzaContent,
    CredenzaDescription,
    CredenzaFooter,
    CredenzaHeader,
    CredenzaTitle
} from "@/components/Credenza";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, RefreshCw, Filter, Columns } from "lucide-react";
import { GetSiteResponse, Container } from "@server/routers/site";
import { useDockerSocket } from "@app/hooks/useDockerSocket";
import { FaDocker } from "react-icons/fa";

// Type definitions based on the JSON structure

interface ContainerSelectorProps {
    site: GetSiteResponse;
    onContainerSelect?: (hostname: string, port?: number) => void;
}

export const ContainersSelector: FC<ContainerSelectorProps> = ({
    site,
    onContainerSelect
}) => {
    const [open, setOpen] = useState(false);

    const { isAvailable, containers, fetchContainers } = useDockerSocket(site);

    useEffect(() => {
        console.log("DockerSocket isAvailable:", isAvailable);
        if (isAvailable) {
            fetchContainers();
        }
    }, [isAvailable]);

    if (!site || !isAvailable) {
        return null;
    }

    const handleContainerSelect = (container: Container, port?: number) => {
        // Extract hostname - prefer IP address from networks, fallback to container name
        const hostname = getContainerHostname(container);
        onContainerSelect?.(hostname, port);
        setOpen(false);
    };

    return (
        <>
            <a
                type="button"
                className="text-sm text-primary hover:underline cursor-pointer"
                onClick={() => setOpen(true)}
            >
                View Docker Containers
            </a>
            <Credenza open={open} onOpenChange={setOpen}>
                <CredenzaContent className="max-w-[75vw] max-h-[75vh] flex flex-col">
                    <CredenzaHeader>
                        <CredenzaTitle>Containers in {site.name}</CredenzaTitle>
                        <CredenzaDescription>
                            Select any container to use as a hostname for this
                            target. Click a port to use a port.
                        </CredenzaDescription>
                    </CredenzaHeader>
                    <CredenzaBody>
                        <div className="flex-1 overflow-hidden min-h-0">
                            <DockerContainersTable
                                containers={containers}
                                onContainerSelect={handleContainerSelect}
                                onRefresh={() => fetchContainers()}
                            />
                        </div>
                    </CredenzaBody>
                    <CredenzaFooter>
                        <CredenzaClose asChild>
                            <Button variant="outline">Close</Button>
                        </CredenzaClose>
                    </CredenzaFooter>
                </CredenzaContent>
            </Credenza>
        </>
    );
};

const DockerContainersTable: FC<{
    containers: Container[];
    onContainerSelect: (container: Container, port?: number) => void;
    onRefresh: () => void;
}> = ({ containers, onContainerSelect, onRefresh }) => {
    const [searchInput, setSearchInput] = useState("");
    const [globalFilter, setGlobalFilter] = useState("");
    const [hideContainersWithoutPorts, setHideContainersWithoutPorts] =
        useState(true);
    const [hideStoppedContainers, setHideStoppedContainers] = useState(false);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
        labels: false
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            setGlobalFilter(searchInput);
        }, 100);

        return () => clearTimeout(timer);
    }, [searchInput]);

    const getExposedPorts = useCallback((container: Container): number[] => {
        const ports: number[] = [];

        container.ports?.forEach((port) => {
            if (port.privatePort) {
                ports.push(port.privatePort);
            }
        });

        return [...new Set(ports)]; // Remove duplicates
    }, []);

    const globalFilterFunction = useCallback(
        (row: any, columnId: string, value: string) => {
            const container = row.original as Container;
            const searchValue = value.toLowerCase();

            // Search across all relevant fields
            const searchableFields = [
                container.name,
                container.image,
                container.state,
                container.status,
                getContainerHostname(container),
                ...Object.keys(container.networks),
                ...Object.values(container.networks)
                    .map((n) => n.ipAddress)
                    .filter(Boolean),
                ...getExposedPorts(container).map((p) => p.toString()),
                ...Object.entries(container.labels).flat()
            ];

            return searchableFields.some((field) =>
                field?.toString().toLowerCase().includes(searchValue)
            );
        },
        [getExposedPorts]
    );

    const columns: ColumnDef<Container>[] = [
        {
            accessorKey: "name",
            header: "Name",
            cell: ({ row }) => (
                <div className="font-medium">{row.original.name}</div>
            )
        },
        {
            accessorKey: "image",
            header: "Image",
            cell: ({ row }) => (
                <div className="text-sm text-muted-foreground">
                    {row.original.image}
                </div>
            )
        },
        {
            accessorKey: "state",
            header: "State",
            cell: ({ row }) => (
                <Badge
                    variant={
                        row.original.state === "running"
                            ? "default"
                            : "secondary"
                    }
                >
                    {row.original.state}
                </Badge>
            )
        },
        {
            accessorKey: "networks",
            header: "Networks",
            cell: ({ row }) => {
                const networks = Object.keys(row.original.networks);
                return (
                    <div className="text-sm text-muted-foreground">
                        {networks.length > 0
                            ? networks.map((n) => (
                                  <Badge key={n} variant="outlinePrimary">
                                      {n}
                                  </Badge>
                              ))
                            : "-"}
                    </div>
                );
            }
        },
        {
            accessorKey: "hostname",
            header: "Hostname/IP",
            enableHiding: false,
            cell: ({ row }) => (
                <div className="text-sm font-mono">
                    {getContainerHostname(row.original)}
                </div>
            )
        },
        {
            accessorKey: "labels",
            header: "Labels",
            cell: ({ row }) => {
                const labels = row.original.labels || {};
                const labelEntries = Object.entries(labels);

                if (labelEntries.length === 0) {
                    return <span className="text-muted-foreground">-</span>;
                }

                return (
                    <Popover modal>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs hover:bg-muted"
                            >
                                {labelEntries.length} label
                                {labelEntries.length !== 1 ? "s" : ""}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent side="top" align="start">
                            <ScrollArea className="w-64 h-64">
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm">
                                        Container Labels
                                    </h4>
                                    <div className="space-y-1">
                                        {labelEntries.map(([key, value]) => (
                                            <div key={key} className="text-xs">
                                                <div className="font-mono font-medium text-foreground">
                                                    {key}
                                                </div>
                                                <div className="font-mono text-muted-foreground pl-2 break-all">
                                                    {value || "<empty>"}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </ScrollArea>
                        </PopoverContent>
                    </Popover>
                );
            }
        },
        {
            accessorKey: "ports",
            header: "Ports",
            enableHiding: false,
            cell: ({ row }) => {
                const ports = getExposedPorts(row.original);
                return (
                    <div className="flex flex-wrap items-center gap-1">
                        {ports.slice(0, 2).map((port) => (
                            <Button
                                key={port}
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() =>
                                    onContainerSelect(row.original, port)
                                }
                            >
                                {port}
                            </Button>
                        ))}
                        {ports.length > 2 && (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="link" size="sm">
                                        +{ports.length - 2} more
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    side="top"
                                    className="w-auto"
                                    align="end"
                                >
                                    {ports.slice(2).map((port) => (
                                        <Button
                                            key={port}
                                            variant="outline"
                                            size="sm"
                                            className="h-6 px-2 text-xs"
                                            onClick={() =>
                                                onContainerSelect(
                                                    row.original,
                                                    port
                                                )
                                            }
                                        >
                                            {port}
                                        </Button>
                                    ))}
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>
                );
            }
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const ports = getExposedPorts(row.original);
                return (
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => onContainerSelect(row.original, ports[0])}
                        disabled={row.original.state !== "running"}
                    >
                        Select
                    </Button>
                );
            }
        }
    ];

    const initialFilters = useMemo(() => {
        let filtered = containers;

        // Filter by port visibility
        if (hideContainersWithoutPorts) {
            filtered = filtered.filter((container) => {
                const ports = getExposedPorts(container);
                return ports.length > 0; // Show only containers WITH ports
            });
        }

        // Filter by container state
        if (hideStoppedContainers) {
            filtered = filtered.filter((container) => {
                return container.state === "running";
            });
        }

        return filtered;
    }, [
        containers,
        hideContainersWithoutPorts,
        hideStoppedContainers,
        getExposedPorts
    ]);

    const table = useReactTable({
        data: initialFilters,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        globalFilterFn: globalFilterFunction,
        state: {
            globalFilter,
            columnVisibility
        },
        onGlobalFilterChange: setGlobalFilter,
        onColumnVisibilityChange: setColumnVisibility
    });

    if (initialFilters.length === 0) {
        return (
            <div className="rounded-md max-h-[500px] overflow-hidden flex flex-col">
                <div className="flex-1 flex items-center justify-center py-8">
                    <div className="text-center text-muted-foreground space-y-3">
                        {(hideContainersWithoutPorts ||
                            hideStoppedContainers) &&
                        containers.length > 0 ? (
                            <>
                                <p>
                                    No containers found matching the current
                                    filters.
                                </p>
                                <div className="space-x-2">
                                    {hideContainersWithoutPorts && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setHideContainersWithoutPorts(
                                                    false
                                                )
                                            }
                                        >
                                            Show containers without ports
                                        </Button>
                                    )}
                                    {hideStoppedContainers && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setHideStoppedContainers(false)
                                            }
                                        >
                                            Show stopped containers
                                        </Button>
                                    )}
                                </div>
                            </>
                        ) : (
                            <p>
                                No containers found. Make sure Docker containers
                                are running.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-md max-h-[500px] overflow-hidden flex flex-col">
            <div className="p-1 space-y-3">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder={`Search across ${initialFilters.length} containers...`}
                            value={searchInput}
                            onChange={(event) =>
                                setSearchInput(event.target.value)
                            }
                            className="pl-8"
                        />
                        {searchInput &&
                            table.getFilteredRowModel().rows.length > 0 && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                    {table.getFilteredRowModel().rows.length}{" "}
                                    result
                                    {table.getFilteredRowModel().rows.length !==
                                    1
                                        ? "s"
                                        : ""}
                                </div>
                            )}
                    </div>
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                >
                                    <Filter className="h-4 w-4" />
                                    Filters
                                    {(hideContainersWithoutPorts ||
                                        hideStoppedContainers) && (
                                        <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                                            {Number(
                                                hideContainersWithoutPorts
                                            ) + Number(hideStoppedContainers)}
                                        </span>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-64">
                                <DropdownMenuLabel>
                                    Filter Options
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuCheckboxItem
                                    checked={hideContainersWithoutPorts}
                                    onCheckedChange={
                                        setHideContainersWithoutPorts
                                    }
                                >
                                    Ports
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={hideStoppedContainers}
                                    onCheckedChange={setHideStoppedContainers}
                                >
                                    Stopped
                                </DropdownMenuCheckboxItem>
                                {(hideContainersWithoutPorts ||
                                    hideStoppedContainers) && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <div className="p-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setHideContainersWithoutPorts(
                                                        false
                                                    );
                                                    setHideStoppedContainers(
                                                        false
                                                    );
                                                }}
                                                className="w-full text-xs"
                                            >
                                                Clear all filters
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                >
                                    <Columns className="h-4 w-4" />
                                    Columns
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48">
                                <DropdownMenuLabel>
                                    Toggle Columns
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {table
                                    .getAllColumns()
                                    .filter((column) => column.getCanHide())
                                    .map((column) => {
                                        return (
                                            <DropdownMenuCheckboxItem
                                                key={column.id}
                                                className="capitalize"
                                                checked={column.getIsVisible()}
                                                onCheckedChange={(value) =>
                                                    column.toggleVisibility(
                                                        !!value
                                                    )
                                                }
                                            >
                                                {column.id === "hostname"
                                                    ? "Hostname/IP"
                                                    : column.id}
                                            </DropdownMenuCheckboxItem>
                                        );
                                    })}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={onRefresh}
                        title="Refresh containers list"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <div className="overflow-auto relative flex-1">
                <Table sticky>
                    <TableHeader sticky className="border-b">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef
                                                      .header,
                                                  header.getContext()
                                              )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className={
                                        row.original.state !== "running"
                                            ? "opacity-50"
                                            : ""
                                    }
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    {searchInput && !globalFilter ? (
                                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                            Searching...
                                        </div>
                                    ) : (
                                        `No containers found matching "${globalFilter}".`
                                    )}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

function getContainerHostname(container: Container): string {
    // First, try to get IP from networks
    const networks = Object.values(container.networks);
    for (const network of networks) {
        if (network.ipAddress) {
            return network.ipAddress;
        }
    }

    // Fallback to container name (works in Docker networks)
    return container.name;
}
