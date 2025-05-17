"use client";

import {
    SettingsContainer,
    SettingsSection,
    SettingsSectionBody,
    SettingsSectionDescription,
    SettingsSectionForm,
    SettingsSectionHeader,
    SettingsSectionTitle
} from "@app/components/Settings";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@app/components/ui/form";
import HeaderTitle from "@app/components/SettingsSectionTitle";
import { z } from "zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@app/components/ui/input";
import { Button } from "@app/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import { ListSitesResponse } from "@server/routers/site";
import { formatAxiosError } from "@app/lib/api";
import { createApiClient } from "@app/lib/api";
import { useEnvContext } from "@app/hooks/useEnvContext";
import { toast } from "@app/hooks/useToast";
import { AxiosResponse } from "axios";
import { Resource } from "@server/db/schemas";
import { StrategySelect } from "@app/components/StrategySelect";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@app/components/ui/select";
import { subdomainSchema } from "@server/lib/schemas";
import { ListDomainsResponse } from "@server/routers/domain";
import LoaderPlaceholder from "@app/components/PlaceHolderLoader";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@app/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@app/components/ui/popover";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { cn } from "@app/lib/cn";
import { SquareArrowOutUpRight } from "lucide-react";
import CopyTextBox from "@app/components/CopyTextBox";
import Link from "next/link";
import { useTranslations } from 'next-intl';

const baseResourceFormSchema = z.object({
    name: z.string().min(1).max(255),
    siteId: z.number(),
    http: z.boolean()
});

const httpResourceFormSchema = z.discriminatedUnion("isBaseDomain", [
    z.object({
        isBaseDomain: z.literal(true),
        domainId: z.string().min(1)
    }),
    z.object({
        isBaseDomain: z.literal(false),
        domainId: z.string().min(1),
        subdomain: z.string().pipe(subdomainSchema)
    })
]);

const tcpUdpResourceFormSchema = z.object({
    protocol: z.string(),
    proxyPort: z.number().int().min(1).max(65535)
});

type BaseResourceFormValues = z.infer<typeof baseResourceFormSchema>;
type HttpResourceFormValues = z.infer<typeof httpResourceFormSchema>;
type TcpUdpResourceFormValues = z.infer<typeof tcpUdpResourceFormSchema>;

type ResourceType = "http" | "raw";

interface ResourceTypeOption {
    id: ResourceType;
    title: string;
    description: string;
    disabled?: boolean;
}

export default function Page() {
    const { env } = useEnvContext();
    const api = createApiClient({ env });
    const { orgId } = useParams();
    const router = useRouter();
    const t = useTranslations();

    const [loadingPage, setLoadingPage] = useState(true);
    const [sites, setSites] = useState<ListSitesResponse["sites"]>([]);
    const [baseDomains, setBaseDomains] = useState<
        { domainId: string; baseDomain: string }[]
    >([]);
    const [createLoading, setCreateLoading] = useState(false);
    const [showSnippets, setShowSnippets] = useState(false);
    const [resourceId, setResourceId] = useState<number | null>(null);

    const resourceTypes: ReadonlyArray<ResourceTypeOption> = [
        {
            id: "http",
            title: t('resourceHTTP'),
            description: t('resourceHTTPDescription')
        },
        {
            id: "raw",
            title: t('resourceRaw'),
            description: t('resourceRawDescription'),
            disabled: !env.flags.allowRawResources
        }
    ];

    const baseForm = useForm<BaseResourceFormValues>({
        resolver: zodResolver(baseResourceFormSchema),
        defaultValues: {
            name: "",
            http: true
        }
    });

    const httpForm = useForm<HttpResourceFormValues>({
        resolver: zodResolver(httpResourceFormSchema),
        defaultValues: {
            subdomain: "",
            domainId: "",
            isBaseDomain: false
        }
    });

    const tcpUdpForm = useForm<TcpUdpResourceFormValues>({
        resolver: zodResolver(tcpUdpResourceFormSchema),
        defaultValues: {
            protocol: "tcp",
            proxyPort: undefined
        }
    });

    async function onSubmit() {
        setCreateLoading(true);

        const baseData = baseForm.getValues();
        const isHttp = baseData.http;

        try {
            const payload = {
                name: baseData.name,
                siteId: baseData.siteId,
                http: baseData.http
            };

            if (isHttp) {
                const httpData = httpForm.getValues();
                if (httpData.isBaseDomain) {
                    Object.assign(payload, {
                        domainId: httpData.domainId,
                        isBaseDomain: true,
                        protocol: "tcp"
                    });
                } else {
                    Object.assign(payload, {
                        subdomain: httpData.subdomain,
                        domainId: httpData.domainId,
                        isBaseDomain: false,
                        protocol: "tcp"
                    });
                }
            } else {
                const tcpUdpData = tcpUdpForm.getValues();
                Object.assign(payload, {
                    protocol: tcpUdpData.protocol,
                    proxyPort: tcpUdpData.proxyPort
                });
            }

            const res = await api
                .put<
                    AxiosResponse<Resource>
                >(`/org/${orgId}/site/${baseData.siteId}/resource/`, payload)
                .catch((e) => {
                    toast({
                        variant: "destructive",
                        title: "Error creating resource",
                        description: formatAxiosError(
                            e,
                            "An error occurred when creating the resource"
                        )
                    });
                });

            if (res && res.status === 201) {
                const id = res.data.data.resourceId;
                setResourceId(id);

                if (isHttp) {
                    router.push(`/${orgId}/settings/resources/${id}`);
                } else {
                    setShowSnippets(true);
                    router.refresh();
                }
            }
        } catch (e) {
            console.error("Error creating resource:", e);
            toast({
                variant: "destructive",
                title: "Error creating resource",
                description: "An unexpected error occurred"
            });
        }

        setCreateLoading(false);
    }

    useEffect(() => {
        const load = async () => {
            setLoadingPage(true);

            const fetchSites = async () => {
                const res = await api
                    .get<
                        AxiosResponse<ListSitesResponse>
                    >(`/org/${orgId}/sites/`)
                    .catch((e) => {
                        toast({
                            variant: "destructive",
                            title: t('sitesErrorFetch'),
                            description: formatAxiosError(
                                e,
                                t('sitesErrorFetchDescription')
                            )
                        });
                    });

                if (res?.status === 200) {
                    setSites(res.data.data.sites);

                    if (res.data.data.sites.length > 0) {
                        baseForm.setValue(
                            "siteId",
                            res.data.data.sites[0].siteId
                        );
                    }
                }
            };

            const fetchDomains = async () => {
                const res = await api
                    .get<
                        AxiosResponse<ListDomainsResponse>
                    >(`/org/${orgId}/domains/`)
                    .catch((e) => {
                        toast({
                            variant: "destructive",
                            title: t('domainsErrorFetch'),
                            description: formatAxiosError(
                                e,
                                t('domainsErrorFetchDescription')
                            )
                        });
                    });

                if (res?.status === 200) {
                    const domains = res.data.data.domains;
                    setBaseDomains(domains);
                    if (domains.length) {
                        httpForm.setValue("domainId", domains[0].domainId);
                    }
                }
            };

            await fetchSites();
            await fetchDomains();

            setLoadingPage(false);
        };

        load();
    }, []);

    return (
        <>
            <div className="flex justify-between">
                <HeaderTitle
                    title={t('resourceCreate')}
                    description={t('resourceCreateDescription')}
                />
                <Button
                    variant="outline"
                    onClick={() => {
                        router.push(`/${orgId}/settings/resources`);
                    }}
                >
                    {t('resourceSeeAll')}
                </Button>
            </div>

            {!loadingPage && (
                <div>
                    {!showSnippets ? (
                        <SettingsContainer>
                            <SettingsSection>
                                <SettingsSectionHeader>
                                    <SettingsSectionTitle>
                                        {t('resourceInfo')}
                                    </SettingsSectionTitle>
                                </SettingsSectionHeader>
                                <SettingsSectionBody>
                                    <SettingsSectionForm>
                                        <Form {...baseForm}>
                                            <form
                                                className="space-y-4"
                                                id="base-resource-form"
                                            >
                                                <FormField
                                                    control={baseForm.control}
                                                    name="name"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                {t('name')}
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                            <FormDescription>
                                                                {t('resourceNameDescription')}
                                                            </FormDescription>
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={baseForm.control}
                                                    name="siteId"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-col">
                                                            <FormLabel>
                                                                {t('site')}
                                                            </FormLabel>
                                                            <Popover>
                                                                <PopoverTrigger
                                                                    asChild
                                                                >
                                                                    <FormControl>
                                                                        <Button
                                                                            variant="outline"
                                                                            role="combobox"
                                                                            className={cn(
                                                                                "justify-between",
                                                                                !field.value &&
                                                                                    "text-muted-foreground"
                                                                            )}
                                                                        >
                                                                            {field.value
                                                                                ? sites.find(
                                                                                      (
                                                                                          site
                                                                                      ) =>
                                                                                          site.siteId ===
                                                                                          field.value
                                                                                  )
                                                                                      ?.name
                                                                                : t('siteSelect')}
                                                                            <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                        </Button>
                                                                    </FormControl>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="p-0">
                                                                    <Command>
                                                                        <CommandInput placeholder={t('siteSearch')} />
                                                                        <CommandList>
                                                                            <CommandEmpty>
                                                                                {t('siteNotFound')}
                                                                            </CommandEmpty>
                                                                            <CommandGroup>
                                                                                {sites.map(
                                                                                    (
                                                                                        site
                                                                                    ) => (
                                                                                        <CommandItem
                                                                                            value={`${site.siteId}:${site.name}:${site.niceId}`}
                                                                                            key={
                                                                                                site.siteId
                                                                                            }
                                                                                            onSelect={() => {
                                                                                                baseForm.setValue(
                                                                                                    "siteId",
                                                                                                    site.siteId
                                                                                                );
                                                                                            }}
                                                                                        >
                                                                                            <CheckIcon
                                                                                                className={cn(
                                                                                                    "mr-2 h-4 w-4",
                                                                                                    site.siteId ===
                                                                                                        field.value
                                                                                                        ? "opacity-100"
                                                                                                        : "opacity-0"
                                                                                                )}
                                                                                            />
                                                                                            {
                                                                                                site.name
                                                                                            }
                                                                                        </CommandItem>
                                                                                    )
                                                                                )}
                                                                            </CommandGroup>
                                                                        </CommandList>
                                                                    </Command>
                                                                </PopoverContent>
                                                            </Popover>
                                                            <FormMessage />
                                                            <FormDescription>
                                                                {t('siteSelectionDescription')}
                                                            </FormDescription>
                                                        </FormItem>
                                                    )}
                                                />
                                            </form>
                                        </Form>
                                    </SettingsSectionForm>
                                </SettingsSectionBody>
                            </SettingsSection>

                            <SettingsSection>
                                <SettingsSectionHeader>
                                    <SettingsSectionTitle>
                                        {t('resourceType')}
                                    </SettingsSectionTitle>
                                    <SettingsSectionDescription>
                                        {t('resourceTypeDescription')}
                                    </SettingsSectionDescription>
                                </SettingsSectionHeader>
                                <SettingsSectionBody>
                                    <StrategySelect
                                        options={resourceTypes}
                                        defaultValue="http"
                                        onChange={(value) => {
                                            baseForm.setValue(
                                                "http",
                                                value === "http"
                                            );
                                        }}
                                        cols={2}
                                    />
                                </SettingsSectionBody>
                            </SettingsSection>

                            {baseForm.watch("http") ? (
                                <SettingsSection>
                                    <SettingsSectionHeader>
                                        <SettingsSectionTitle>
                                            {t('resourceHTTPSSettings')}
                                        </SettingsSectionTitle>
                                        <SettingsSectionDescription>
                                            {t('resourceHTTPSSettingsDescription')}
                                        </SettingsSectionDescription>
                                    </SettingsSectionHeader>
                                    <SettingsSectionBody>
                                        <SettingsSectionForm>
                                            <Form {...httpForm}>
                                                <form
                                                    className="space-y-4"
                                                    id="http-settings-form"
                                                >
                                                    {env.flags
                                                        .allowBaseDomainResources && (
                                                        <FormField
                                                            control={
                                                                httpForm.control
                                                            }
                                                            name="isBaseDomain"
                                                            render={({
                                                                field
                                                            }) => (
                                                                <FormItem>
                                                                    <FormLabel>
                                                                        {t('domainType')}
                                                                    </FormLabel>
                                                                    <Select
                                                                        value={
                                                                            field.value
                                                                                ? "basedomain"
                                                                                : "subdomain"
                                                                        }
                                                                        onValueChange={(
                                                                            value
                                                                        ) => {
                                                                            field.onChange(
                                                                                value ===
                                                                                    "basedomain"
                                                                            );
                                                                        }}
                                                                    >
                                                                        <FormControl>
                                                                            <SelectTrigger>
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            <SelectItem value="subdomain">
                                                                                {t('subdomain')}
                                                                            </SelectItem>
                                                                            <SelectItem value="basedomain">
                                                                                {t('baseDomain')}
                                                                            </SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    )}

                                                    {!httpForm.watch(
                                                        "isBaseDomain"
                                                    ) && (
                                                        <FormItem>
                                                            <FormLabel>
                                                                {t('subdomain')}
                                                            </FormLabel>
                                                            <div className="flex space-x-0">
                                                                <div className="w-1/2">
                                                                    <FormField
                                                                        control={
                                                                            httpForm.control
                                                                        }
                                                                        name="subdomain"
                                                                        render={({
                                                                            field
                                                                        }) => (
                                                                            <FormItem>
                                                                                <FormControl>
                                                                                    <Input
                                                                                        {...field}
                                                                                        className="border-r-0 rounded-r-none"
                                                                                    />
                                                                                </FormControl>
                                                                                <FormMessage />
                                                                            </FormItem>
                                                                        )}
                                                                    />
                                                                </div>
                                                                <div className="w-1/2">
                                                                    <FormField
                                                                        control={
                                                                            httpForm.control
                                                                        }
                                                                        name="domainId"
                                                                        render={({
                                                                            field
                                                                        }) => (
                                                                            <FormItem>
                                                                                <Select
                                                                                    onValueChange={
                                                                                        field.onChange
                                                                                    }
                                                                                    value={
                                                                                        field.value
                                                                                    }
                                                                                    defaultValue={
                                                                                        field.value
                                                                                    }
                                                                                >
                                                                                    <FormControl>
                                                                                        <SelectTrigger className="rounded-l-none">
                                                                                            <SelectValue />
                                                                                        </SelectTrigger>
                                                                                    </FormControl>
                                                                                    <SelectContent>
                                                                                        {baseDomains.map(
                                                                                            (
                                                                                                option
                                                                                            ) => (
                                                                                                <SelectItem
                                                                                                    key={
                                                                                                        option.domainId
                                                                                                    }
                                                                                                    value={
                                                                                                        option.domainId
                                                                                                    }
                                                                                                >
                                                                                                    .
                                                                                                    {
                                                                                                        option.baseDomain
                                                                                                    }
                                                                                                </SelectItem>
                                                                                            )
                                                                                        )}
                                                                                    </SelectContent>
                                                                                </Select>
                                                                                <FormMessage />
                                                                            </FormItem>
                                                                        )}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <FormDescription>
                                                                {t('subdomnainDescription')}
                                                            </FormDescription>
                                                        </FormItem>
                                                    )}

                                                    {httpForm.watch(
                                                        "isBaseDomain"
                                                    ) && (
                                                        <FormField
                                                            control={
                                                                httpForm.control
                                                            }
                                                            name="domainId"
                                                            render={({
                                                                field
                                                            }) => (
                                                                <FormItem>
                                                                    <FormLabel>
                                                                        {t('baseDomain')}
                                                                    </FormLabel>
                                                                    <Select
                                                                        onValueChange={
                                                                            field.onChange
                                                                        }
                                                                        defaultValue={
                                                                            field.value
                                                                        }
                                                                        {...field}
                                                                    >
                                                                        <FormControl>
                                                                            <SelectTrigger>
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            {baseDomains.map(
                                                                                (
                                                                                    option
                                                                                ) => (
                                                                                    <SelectItem
                                                                                        key={
                                                                                            option.domainId
                                                                                        }
                                                                                        value={
                                                                                            option.domainId
                                                                                        }
                                                                                    >
                                                                                        {
                                                                                            option.baseDomain
                                                                                        }
                                                                                    </SelectItem>
                                                                                )
                                                                            )}
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    )}
                                                </form>
                                            </Form>
                                        </SettingsSectionForm>
                                    </SettingsSectionBody>
                                </SettingsSection>
                            ) : (
                                <SettingsSection>
                                    <SettingsSectionHeader>
                                        <SettingsSectionTitle>
                                            {t('resourceRawSettings')}
                                        </SettingsSectionTitle>
                                        <SettingsSectionDescription>
                                            {t('resourceRawSettingsDescription')}
                                        </SettingsSectionDescription>
                                    </SettingsSectionHeader>
                                    <SettingsSectionBody>
                                        <SettingsSectionForm>
                                            <Form {...tcpUdpForm}>
                                                <form
                                                    className="space-y-4"
                                                    id="tcp-udp-settings-form"
                                                >
                                                    <Controller
                                                        control={
                                                            tcpUdpForm.control
                                                        }
                                                        name="protocol"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    {t('protocol')}
                                                                </FormLabel>
                                                                <Select
                                                                    onValueChange={
                                                                        field.onChange
                                                                    }
                                                                    {...field}
                                                                >
                                                                    <FormControl>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder={t('protocolSelect')} />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="tcp">
                                                                            TCP
                                                                        </SelectItem>
                                                                        <SelectItem value="udp">
                                                                            UDP
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={
                                                            tcpUdpForm.control
                                                        }
                                                        name="proxyPort"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    {t('resourcePortNumber')}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        value={
                                                                            field.value ??
                                                                            ""
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            field.onChange(
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                                    ? parseInt(
                                                                                          e
                                                                                              .target
                                                                                              .value
                                                                                      )
                                                                                    : undefined
                                                                            )
                                                                        }
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                                <FormDescription>
                                                                    {t('resourcePortNumberDescription')}
                                                                </FormDescription>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </form>
                                            </Form>
                                        </SettingsSectionForm>
                                    </SettingsSectionBody>
                                </SettingsSection>
                            )}

                            <div className="flex justify-end space-x-2 mt-8">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        router.push(`/${orgId}/settings/resources`)
                                    }
                                >
                                    {t('cancel')}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={async () => {
                                        const isHttp = baseForm.watch("http");
                                        const baseValid = await baseForm.trigger();
                                        const settingsValid = isHttp
                                            ? await httpForm.trigger()
                                            : await tcpUdpForm.trigger();

                                        if (baseValid && settingsValid) {
                                            onSubmit();
                                        }
                                    }}
                                    loading={createLoading}
                                >
                                    {t('resourceCreate')}
                                </Button>
                            </div>
                        </SettingsContainer>
                    ) : (
                        <SettingsContainer>
                            <SettingsSection>
                                <SettingsSectionHeader>
                                    <SettingsSectionTitle>
                                        {t('resourceConfig')}
                                    </SettingsSectionTitle>
                                    <SettingsSectionDescription>
                                        {t('resourceConfigDescription')}
                                    </SettingsSectionDescription>
                                </SettingsSectionHeader>
                                <SettingsSectionBody>
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold">
                                                {t('resourceAddEntrypoints')}
                                            </h3>
                                            <CopyTextBox
                                                text={`entryPoints:
  ${tcpUdpForm.getValues("protocol")}-${tcpUdpForm.getValues("proxyPort")}:
    address: ":${tcpUdpForm.getValues("proxyPort")}/${tcpUdpForm.getValues("protocol")}"`}
                                                wrapText={false}
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold">
                                                {t('resourceExposePorts')}
                                            </h3>
                                            <CopyTextBox
                                                text={`ports:
  - ${tcpUdpForm.getValues("proxyPort")}:${tcpUdpForm.getValues("proxyPort")}${tcpUdpForm.getValues("protocol") === "tcp" ? "" : "/" + tcpUdpForm.getValues("protocol")}`}
                                                wrapText={false}
                                            />
                                        </div>

                                        <Link
                                            className="text-sm text-primary flex items-center gap-1"
                                            href="https://docs.fossorial.io/Pangolin/tcp-udp"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <span>
                                                {t('resourceLearnRaw')}
                                            </span>
                                            <SquareArrowOutUpRight size={14} />
                                        </Link>
                                    </div>
                                </SettingsSectionBody>
                            </SettingsSection>

                            <div className="flex justify-end space-x-2 mt-8">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        router.push(`/${orgId}/settings/resources`)
                                    }
                                >
                                    {t('resourceBack')}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() =>
                                        router.push(
                                            `/${orgId}/settings/resources/${resourceId}`
                                        )
                                    }
                                >
                                    {t('resourceGoTo')}
                                </Button>
                            </div>
                        </SettingsContainer>
                    )}
                </div>
            )}
        </>
    );
}
