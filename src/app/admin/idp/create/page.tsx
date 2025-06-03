"use client";

import {
    SettingsContainer,
    SettingsSection,
    SettingsSectionBody,
    SettingsSectionDescription,
    SettingsSectionForm,
    SettingsSectionGrid,
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
import { createElement, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@app/components/ui/input";
import { Button } from "@app/components/ui/button";
import { createApiClient, formatAxiosError } from "@app/lib/api";
import { useEnvContext } from "@app/hooks/useEnvContext";
import { toast } from "@app/hooks/useToast";
import { useRouter } from "next/navigation";
import { Checkbox } from "@app/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@app/components/ui/alert";
import { InfoIcon, ExternalLink } from "lucide-react";
import { StrategySelect } from "@app/components/StrategySelect";
import { SwitchInput } from "@app/components/SwitchInput";
import { Badge } from "@app/components/ui/badge";
import { useLicenseStatusContext } from "@app/hooks/useLicenseStatusContext";

const createIdpFormSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    type: z.enum(["oidc"]),
    clientId: z.string().min(1, { message: "Client ID is required." }),
    clientSecret: z.string().min(1, { message: "Client Secret is required." }),
    authUrl: z.string().url({ message: "Auth URL must be a valid URL." }),
    tokenUrl: z.string().url({ message: "Token URL must be a valid URL." }),
    identifierPath: z
        .string()
        .min(1, { message: "Identifier Path is required." }),
    emailPath: z.string().optional(),
    namePath: z.string().optional(),
    scopes: z.string().min(1, { message: "Scopes are required." }),
    autoProvision: z.boolean().default(false)
});

type CreateIdpFormValues = z.infer<typeof createIdpFormSchema>;

interface ProviderTypeOption {
    id: "oidc";
    title: string;
    description: string;
}

const providerTypes: ReadonlyArray<ProviderTypeOption> = [
    {
        id: "oidc",
        title: "OAuth2/OIDC",
        description: "Configure an OpenID Connect identity provider"
    }
];

export default function Page() {
    const { env } = useEnvContext();
    const api = createApiClient({ env });
    const router = useRouter();
    const [createLoading, setCreateLoading] = useState(false);
    const { isUnlocked } = useLicenseStatusContext();

    const form = useForm<CreateIdpFormValues>({
        resolver: zodResolver(createIdpFormSchema),
        defaultValues: {
            name: "",
            type: "oidc",
            clientId: "",
            clientSecret: "",
            authUrl: "",
            tokenUrl: "",
            identifierPath: "sub",
            namePath: "name",
            emailPath: "email",
            scopes: "openid profile email",
            autoProvision: false
        }
    });

    async function onSubmit(data: CreateIdpFormValues) {
        setCreateLoading(true);

        try {
            const payload = {
                name: data.name,
                clientId: data.clientId,
                clientSecret: data.clientSecret,
                authUrl: data.authUrl,
                tokenUrl: data.tokenUrl,
                identifierPath: data.identifierPath,
                emailPath: data.emailPath,
                namePath: data.namePath,
                autoProvision: data.autoProvision,
                scopes: data.scopes
            };

            const res = await api.put("/idp/oidc", payload);

            if (res.status === 201) {
                toast({
                    title: "Success",
                    description: "Identity provider created successfully"
                });
                router.push(`/admin/idp/${res.data.data.idpId}`);
            }
        } catch (e) {
            toast({
                title: "Error",
                description: formatAxiosError(e),
                variant: "destructive"
            });
        } finally {
            setCreateLoading(false);
        }
    }

    return (
        <>
            <div className="flex justify-between">
                <HeaderTitle
                    title="Create Identity Provider"
                    description="Configure a new identity provider for user authentication"
                />
                <Button
                    variant="outline"
                    onClick={() => {
                        router.push("/admin/idp");
                    }}
                >
                    See All Identity Providers
                </Button>
            </div>

            <SettingsContainer>
                <SettingsSection>
                    <SettingsSectionHeader>
                        <SettingsSectionTitle>
                            General Information
                        </SettingsSectionTitle>
                        <SettingsSectionDescription>
                            Configure the basic information for your identity
                            provider
                        </SettingsSectionDescription>
                    </SettingsSectionHeader>
                    <SettingsSectionBody>
                        <SettingsSectionForm>
                            <Form {...form}>
                                <form
                                    className="space-y-4"
                                    id="create-idp-form"
                                    onSubmit={form.handleSubmit(onSubmit)}
                                >
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Name</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    A display name for this
                                                    identity provider
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="flex items-start mb-0">
                                        <SwitchInput
                                            id="auto-provision-toggle"
                                            label="Auto Provision Users"
                                            defaultChecked={form.getValues(
                                                "autoProvision"
                                            )}
                                            onCheckedChange={(checked) => {
                                                form.setValue(
                                                    "autoProvision",
                                                    checked
                                                );
                                            }}
                                        />
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                        When enabled, users will be
                                        automatically created in the system upon
                                        first login with the ability to map
                                        users to roles and organizations.
                                    </span>
                                </form>
                            </Form>
                        </SettingsSectionForm>
                    </SettingsSectionBody>
                </SettingsSection>

                <SettingsSection>
                    <SettingsSectionHeader>
                        <SettingsSectionTitle>
                            Provider Type
                        </SettingsSectionTitle>
                        <SettingsSectionDescription>
                            Select the type of identity provider you want to
                            configure
                        </SettingsSectionDescription>
                    </SettingsSectionHeader>
                    <SettingsSectionBody>
                        <StrategySelect
                            options={providerTypes}
                            defaultValue={form.getValues("type")}
                            onChange={(value) => {
                                form.setValue("type", value as "oidc");
                            }}
                            cols={3}
                        />
                    </SettingsSectionBody>
                </SettingsSection>

                {form.watch("type") === "oidc" && (
                    <SettingsSectionGrid cols={2}>
                        <SettingsSection>
                            <SettingsSectionHeader>
                                <SettingsSectionTitle>
                                    OAuth2/OIDC Configuration
                                </SettingsSectionTitle>
                                <SettingsSectionDescription>
                                    Configure the OAuth2/OIDC provider endpoints
                                    and credentials
                                </SettingsSectionDescription>
                            </SettingsSectionHeader>
                            <SettingsSectionBody>
                                <Form {...form}>
                                    <form
                                        className="space-y-4"
                                        id="create-idp-form"
                                        onSubmit={form.handleSubmit(onSubmit)}
                                    >
                                        <FormField
                                            control={form.control}
                                            name="clientId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Client ID
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input {...field} />
                                                    </FormControl>
                                                    <FormDescription>
                                                        The OAuth2 client ID
                                                        from your identity
                                                        provider
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="clientSecret"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Client Secret
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="password"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        The OAuth2 client secret
                                                        from your identity
                                                        provider
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="authUrl"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Authorization URL
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="https://your-idp.com/oauth2/authorize"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        The OAuth2 authorization
                                                        endpoint URL
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="tokenUrl"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Token URL
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="https://your-idp.com/oauth2/token"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        The OAuth2 token
                                                        endpoint URL
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </form>
                                </Form>

                                <Alert variant="neutral">
                                    <InfoIcon className="h-4 w-4" />
                                    <AlertTitle className="font-semibold">
                                        Important Information
                                    </AlertTitle>
                                    <AlertDescription>
                                        After creating the identity provider,
                                        you will need to configure the callback
                                        URL in your identity provider's
                                        settings. The callback URL will be
                                        provided after successful creation.
                                    </AlertDescription>
                                </Alert>
                            </SettingsSectionBody>
                        </SettingsSection>

                        <SettingsSection>
                            <SettingsSectionHeader>
                                <SettingsSectionTitle>
                                    Token Configuration
                                </SettingsSectionTitle>
                                <SettingsSectionDescription>
                                    Configure how to extract user information
                                    from the ID token
                                </SettingsSectionDescription>
                            </SettingsSectionHeader>
                            <SettingsSectionBody>
                                <Form {...form}>
                                    <form
                                        className="space-y-4"
                                        id="create-idp-form"
                                        onSubmit={form.handleSubmit(onSubmit)}
                                    >
                                        <Alert variant="neutral">
                                            <InfoIcon className="h-4 w-4" />
                                            <AlertTitle className="font-semibold">
                                                About JMESPath
                                            </AlertTitle>
                                            <AlertDescription>
                                                The paths below use JMESPath
                                                syntax to extract values from
                                                the ID token.
                                                <a
                                                    href="https://jmespath.org"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:underline inline-flex items-center"
                                                >
                                                    Learn more about JMESPath{" "}
                                                    <ExternalLink className="ml-1 h-4 w-4" />
                                                </a>
                                            </AlertDescription>
                                        </Alert>

                                        <FormField
                                            control={form.control}
                                            name="identifierPath"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Identifier Path
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input {...field} />
                                                    </FormControl>
                                                    <FormDescription>
                                                        The path to the user
                                                        identifier in the ID
                                                        token
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="emailPath"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Email Path (Optional)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input {...field} />
                                                    </FormControl>
                                                    <FormDescription>
                                                        The path to the
                                                        user's email in the ID
                                                        token
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="namePath"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Name Path (Optional)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input {...field} />
                                                    </FormControl>
                                                    <FormDescription>
                                                        The path to the
                                                        user's name in the ID
                                                        token
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="scopes"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Scopes
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input {...field} />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Space-separated list of
                                                        OAuth2 scopes to request
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </form>
                                </Form>
                            </SettingsSectionBody>
                        </SettingsSection>
                    </SettingsSectionGrid>
                )}
            </SettingsContainer>

            <div className="flex justify-end space-x-2 mt-8">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                        router.push("/admin/idp");
                    }}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={createLoading}
                    loading={createLoading}
                    onClick={form.handleSubmit(onSubmit)}
                >
                    Create Identity Provider
                </Button>
            </div>
        </>
    );
}
