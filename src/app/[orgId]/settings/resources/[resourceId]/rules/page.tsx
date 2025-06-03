"use client";

import { useEffect, useState, use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { AxiosResponse } from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@app/components/ui/form";
import {
    ColumnDef,
    getFilteredRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    getCoreRowModel,
    useReactTable,
    flexRender
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableContainer,
    TableHead,
    TableHeader,
    TableRow
} from "@app/components/ui/table";
import { toast } from "@app/hooks/useToast";
import { useResourceContext } from "@app/hooks/useResourceContext";
import { ArrayElement } from "@server/types/ArrayElement";
import { formatAxiosError } from "@app/lib/api/formatAxiosError";
import { useEnvContext } from "@app/hooks/useEnvContext";
import { createApiClient } from "@app/lib/api";
import {
    SettingsContainer,
    SettingsSection,
    SettingsSectionHeader,
    SettingsSectionTitle,
    SettingsSectionDescription,
    SettingsSectionBody,
    SettingsSectionFooter
} from "@app/components/Settings";
import { ListResourceRulesResponse } from "@server/routers/resource/listResourceRules";
import { SwitchInput } from "@app/components/SwitchInput";
import { Alert, AlertDescription, AlertTitle } from "@app/components/ui/alert";
import { ArrowUpDown, Check, InfoIcon, X } from "lucide-react";
import {
    InfoSection,
    InfoSections,
    InfoSectionTitle
} from "@app/components/InfoSection";
import { InfoPopup } from "@app/components/ui/info-popup";
import {
    isValidCIDR,
    isValidIP,
    isValidUrlGlobPattern
} from "@server/lib/validators";
import { Switch } from "@app/components/ui/switch";
import { useRouter } from "next/navigation";

// Schema for rule validation
const addRuleSchema = z.object({
    action: z.string(),
    match: z.string(),
    value: z.string(),
    priority: z.coerce.number().int().optional()
});

type LocalRule = ArrayElement<ListResourceRulesResponse["rules"]> & {
    new?: boolean;
    updated?: boolean;
};

enum RuleAction {
    ACCEPT = "Always Allow",
    DROP = "Always Deny"
}

enum RuleMatch {
    PATH = "Path",
    IP = "IP",
    CIDR = "IP Range"
}

export default function ResourceRules(props: {
    params: Promise<{ resourceId: number }>;
}) {
    const params = use(props.params);
    const { resource, updateResource } = useResourceContext();
    const api = createApiClient(useEnvContext());
    const [rules, setRules] = useState<LocalRule[]>([]);
    const [rulesToRemove, setRulesToRemove] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [rulesEnabled, setRulesEnabled] = useState(resource.applyRules);
    const router = useRouter();

    const addRuleForm = useForm({
        resolver: zodResolver(addRuleSchema),
        defaultValues: {
            action: "ACCEPT",
            match: "IP",
            value: ""
        }
    });

    useEffect(() => {
        const fetchRules = async () => {
            try {
                const res = await api.get<
                    AxiosResponse<ListResourceRulesResponse>
                >(`/resource/${params.resourceId}/rules`);
                if (res.status === 200) {
                    setRules(res.data.data.rules);
                }
            } catch (err) {
                console.error(err);
                toast({
                    variant: "destructive",
                    title: "Failed to fetch rules",
                    description: formatAxiosError(
                        err,
                        "An error occurred while fetching rules"
                    )
                });
            } finally {
                setPageLoading(false);
            }
        };
        fetchRules();
    }, []);

    async function addRule(data: z.infer<typeof addRuleSchema>) {
        const isDuplicate = rules.some(
            (rule) =>
                rule.action === data.action &&
                rule.match === data.match &&
                rule.value === data.value
        );

        if (isDuplicate) {
            toast({
                variant: "destructive",
                title: "Duplicate rule",
                description: "A rule with these settings already exists"
            });
            return;
        }

        if (data.match === "CIDR" && !isValidCIDR(data.value)) {
            toast({
                variant: "destructive",
                title: "Invalid CIDR",
                description: "Please enter a valid CIDR value"
            });
            setLoading(false);
            return;
        }
        if (data.match === "PATH" && !isValidUrlGlobPattern(data.value)) {
            toast({
                variant: "destructive",
                title: "Invalid URL path",
                description: "Please enter a valid URL path value"
            });
            setLoading(false);
            return;
        }
        if (data.match === "IP" && !isValidIP(data.value)) {
            toast({
                variant: "destructive",
                title: "Invalid IP",
                description: "Please enter a valid IP address"
            });
            setLoading(false);
            return;
        }

        // find the highest priority and add one
        let priority = data.priority;
        if (priority === undefined) {
            priority = rules.reduce(
                (acc, rule) => (rule.priority > acc ? rule.priority : acc),
                0
            );
            priority++;
        }

        const newRule: LocalRule = {
            ...data,
            ruleId: new Date().getTime(),
            new: true,
            resourceId: resource.resourceId,
            priority,
            enabled: true
        };

        setRules([...rules, newRule]);
        addRuleForm.reset();
    }

    const removeRule = (ruleId: number) => {
        setRules([...rules.filter((rule) => rule.ruleId !== ruleId)]);
        if (!rules.find((rule) => rule.ruleId === ruleId)?.new) {
            setRulesToRemove([...rulesToRemove, ruleId]);
        }
    };

    async function updateRule(ruleId: number, data: Partial<LocalRule>) {
        setRules(
            rules.map((rule) =>
                rule.ruleId === ruleId
                    ? { ...rule, ...data, updated: true }
                    : rule
            )
        );
    }

    async function saveApplyRules(val: boolean) {
        const res = await api
            .post(`/resource/${params.resourceId}`, {
                applyRules: val
            })
            .catch((err) => {
                console.error(err);
                toast({
                    variant: "destructive",
                    title: "Failed to update rules",
                    description: formatAxiosError(
                        err,
                        "An error occurred while updating rules"
                    )
                });
            });

        if (res && res.status === 200) {
            setRulesEnabled(val);
            updateResource({ applyRules: val });

            toast({
                title: "Enable Rules",
                description: "Rule evaluation has been updated"
            });
            router.refresh();
        }
    }

    function getValueHelpText(type: string) {
        switch (type) {
            case "CIDR":
                return "Enter an address in CIDR format (e.g., 103.21.244.0/22)";
            case "IP":
                return "Enter an IP address (e.g., 103.21.244.12)";
            case "PATH":
                return "Enter a URL path or pattern (e.g., /api/v1/todos or /api/v1/*)";
        }
    }

    async function saveRules() {
        try {
            setLoading(true);
            for (let rule of rules) {
                const data = {
                    action: rule.action,
                    match: rule.match,
                    value: rule.value,
                    priority: rule.priority,
                    enabled: rule.enabled
                };

                if (rule.match === "CIDR" && !isValidCIDR(rule.value)) {
                    toast({
                        variant: "destructive",
                        title: "Invalid CIDR",
                        description: "Please enter a valid CIDR value"
                    });
                    setLoading(false);
                    return;
                }
                if (
                    rule.match === "PATH" &&
                    !isValidUrlGlobPattern(rule.value)
                ) {
                    toast({
                        variant: "destructive",
                        title: "Invalid URL path",
                        description: "Please enter a valid URL path value"
                    });
                    setLoading(false);
                    return;
                }
                if (rule.match === "IP" && !isValidIP(rule.value)) {
                    toast({
                        variant: "destructive",
                        title: "Invalid IP",
                        description: "Please enter a valid IP address"
                    });
                    setLoading(false);
                    return;
                }

                if (rule.priority === undefined) {
                    toast({
                        variant: "destructive",
                        title: "Invalid Priority",
                        description: "Please enter a valid priority"
                    });
                    setLoading(false);
                    return;
                }

                // make sure no duplicate priorities
                const priorities = rules.map((r) => r.priority);
                if (priorities.length !== new Set(priorities).size) {
                    toast({
                        variant: "destructive",
                        title: "Duplicate Priorities",
                        description: "Please enter unique priorities"
                    });
                    setLoading(false);
                    return;
                }

                if (rule.new) {
                    const res = await api.put(
                        `/resource/${params.resourceId}/rule`,
                        data
                    );
                    rule.ruleId = res.data.data.ruleId;
                } else if (rule.updated) {
                    await api.post(
                        `/resource/${params.resourceId}/rule/${rule.ruleId}`,
                        data
                    );
                }

                setRules([
                    ...rules.map((r) => {
                        let res = {
                            ...r,
                            new: false,
                            updated: false
                        };
                        return res;
                    })
                ]);
            }

            for (const ruleId of rulesToRemove) {
                await api.delete(
                    `/resource/${params.resourceId}/rule/${ruleId}`
                );
                setRules(rules.filter((r) => r.ruleId !== ruleId));
            }

            toast({
                title: "Rules updated",
                description: "Rules updated successfully"
            });

            setRulesToRemove([]);
            router.refresh();
        } catch (err) {
            console.error(err);
            toast({
                variant: "destructive",
                title: "Operation failed",
                description: formatAxiosError(
                    err,
                    "An error occurred during the save operation"
                )
            });
        }
        setLoading(false);
    }

    const columns: ColumnDef<LocalRule>[] = [
        {
            accessorKey: "priority",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                    >
                        Priority
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }) => (
                <Input
                    defaultValue={row.original.priority}
                    className="w-[75px]"
                    type="number"
                    onBlur={(e) => {
                        const parsed = z.coerce
                            .number()
                            .int()
                            .optional()
                            .safeParse(e.target.value);

                        if (!parsed.data) {
                            toast({
                                variant: "destructive",
                                title: "Invalid IP",
                                description: "Please enter a valid priority"
                            });
                            setLoading(false);
                            return;
                        }

                        updateRule(row.original.ruleId, {
                            priority: parsed.data
                        });
                    }}
                />
            )
        },
        {
            accessorKey: "action",
            header: "Action",
            cell: ({ row }) => (
                <Select
                    defaultValue={row.original.action}
                    onValueChange={(value: "ACCEPT" | "DROP") =>
                        updateRule(row.original.ruleId, { action: value })
                    }
                >
                    <SelectTrigger className="min-w-[150px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ACCEPT">
                            {RuleAction.ACCEPT}
                        </SelectItem>
                        <SelectItem value="DROP">{RuleAction.DROP}</SelectItem>
                    </SelectContent>
                </Select>
            )
        },
        {
            accessorKey: "match",
            header: "Match Type",
            cell: ({ row }) => (
                <Select
                    defaultValue={row.original.match}
                    onValueChange={(value: "CIDR" | "IP" | "PATH") =>
                        updateRule(row.original.ruleId, { match: value })
                    }
                >
                    <SelectTrigger className="min-w-[125px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="PATH">{RuleMatch.PATH}</SelectItem>
                        <SelectItem value="IP">{RuleMatch.IP}</SelectItem>
                        <SelectItem value="CIDR">{RuleMatch.CIDR}</SelectItem>
                    </SelectContent>
                </Select>
            )
        },
        {
            accessorKey: "value",
            header: "Value",
            cell: ({ row }) => (
                <Input
                    defaultValue={row.original.value}
                    className="min-w-[200px]"
                    onBlur={(e) =>
                        updateRule(row.original.ruleId, {
                            value: e.target.value
                        })
                    }
                />
            )
        },
        {
            accessorKey: "enabled",
            header: "Enabled",
            cell: ({ row }) => (
                <Switch
                    defaultChecked={row.original.enabled}
                    onCheckedChange={(val) =>
                        updateRule(row.original.ruleId, { enabled: val })
                    }
                />
            )
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <div className="flex items-center justify-end space-x-2">
                    <Button
                        variant="outline"
                        onClick={() => removeRule(row.original.ruleId)}
                    >
                        Delete
                    </Button>
                </div>
            )
        }
    ];

    const table = useReactTable({
        data: rules,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            pagination: {
                pageIndex: 0,
                pageSize: 1000
            }
        }
    });

    if (pageLoading) {
        return <></>;
    }

    return (
        <SettingsContainer>
            <Alert className="hidden md:block">
                <InfoIcon className="h-4 w-4" />
                <AlertTitle className="font-semibold">About Rules</AlertTitle>
                <AlertDescription className="mt-4">
                    <div className="space-y-1 mb-4">
                        <p>
                            Rules allow you to control access to your resource
                            based on a set of criteria. You can create rules to
                            allow or deny access based on IP address or URL
                            path.
                        </p>
                    </div>
                    <InfoSections cols={2}>
                        <InfoSection>
                            <InfoSectionTitle>Actions</InfoSectionTitle>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li className="flex items-center gap-2">
                                    <Check className="text-green-500 w-4 h-4" />
                                    Always Allow: Bypass all authentication
                                    methods
                                </li>
                                <li className="flex items-center gap-2">
                                    <X className="text-red-500 w-4 h-4" />
                                    Always Deny: Block all requests; no
                                    authentication can be attempted
                                </li>
                            </ul>
                        </InfoSection>
                        <InfoSection>
                            <InfoSectionTitle>
                                Matching Criteria
                            </InfoSectionTitle>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li className="flex items-center gap-2">
                                    Match a specific IP address
                                </li>
                                <li className="flex items-center gap-2">
                                    Match a range of IP addresses in CIDR
                                    notation
                                </li>
                                <li className="flex items-center gap-2">
                                    Match a URL path or pattern
                                </li>
                            </ul>
                        </InfoSection>
                    </InfoSections>
                </AlertDescription>
            </Alert>

            <SettingsSection>
                <SettingsSectionHeader>
                    <SettingsSectionTitle>Enable Rules</SettingsSectionTitle>
                    <SettingsSectionDescription>
                        Enable or disable rule evaluation for this resource
                    </SettingsSectionDescription>
                </SettingsSectionHeader>
                <SettingsSectionBody>
                    <SwitchInput
                        id="rules-toggle"
                        label="Enable Rules"
                        defaultChecked={rulesEnabled}
                        onCheckedChange={async (val) => {
                            await saveApplyRules(val);
                        }}
                    />
                </SettingsSectionBody>
            </SettingsSection>

            <SettingsSection>
                <SettingsSectionHeader>
                    <SettingsSectionTitle>
                        Resource Rules Configuration
                    </SettingsSectionTitle>
                    <SettingsSectionDescription>
                        Configure rules to control access to your resource
                    </SettingsSectionDescription>
                </SettingsSectionHeader>
                <SettingsSectionBody>
                    <Form {...addRuleForm}>
                        <form
                            onSubmit={addRuleForm.handleSubmit(addRule)}
                            className="space-y-4"
                        >
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                                <FormField
                                    control={addRuleForm.control}
                                    name="action"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Action</FormLabel>
                                            <FormControl>
                                                <Select
                                                    value={field.value}
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="ACCEPT">
                                                            {RuleAction.ACCEPT}
                                                        </SelectItem>
                                                        <SelectItem value="DROP">
                                                            {RuleAction.DROP}
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={addRuleForm.control}
                                    name="match"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Match Type</FormLabel>
                                            <FormControl>
                                                <Select
                                                    value={field.value}
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {resource.http && (
                                                            <SelectItem value="PATH">
                                                                {RuleMatch.PATH}
                                                            </SelectItem>
                                                        )}
                                                        <SelectItem value="IP">
                                                            {RuleMatch.IP}
                                                        </SelectItem>
                                                        <SelectItem value="CIDR">
                                                            {RuleMatch.CIDR}
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={addRuleForm.control}
                                    name="value"
                                    render={({ field }) => (
                                        <FormItem className="space-y-0 mb-2">
                                            <InfoPopup
                                                text="Value"
                                                info={
                                                    getValueHelpText(
                                                        addRuleForm.watch(
                                                            "match"
                                                        )
                                                    ) || ""
                                                }
                                            />
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    type="submit"
                                    variant="outlinePrimary"
                                    className="mb-2"
                                    disabled={!rulesEnabled}
                                >
                                    Add Rule
                                </Button>
                            </div>
                        </form>
                    </Form>
                    <Table>
                        <TableHeader>
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
                                    <TableRow key={row.id}>
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
                                        No rules. Add a rule using the form.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                        <TableCaption>
                            Rules are evaluated by priority in ascending order.
                        </TableCaption>
                    </Table>
                </SettingsSectionBody>
                <SettingsSectionFooter>
                    <Button
                        onClick={saveRules}
                        loading={loading}
                        disabled={loading}
                    >
                        Save Rules
                    </Button>
                </SettingsSectionFooter>
            </SettingsSection>
        </SettingsContainer>
    );
}
