"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@app/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@app/components/ui/form";
import { Input } from "@app/components/ui/input";
import { useForm } from "react-hook-form";
import { toast } from "@app/hooks/useToast";
import { useRouter, useParams, redirect } from "next/navigation";
import {
    SettingsContainer,
    SettingsSection,
    SettingsSectionHeader,
    SettingsSectionTitle,
    SettingsSectionDescription,
    SettingsSectionBody,
    SettingsSectionForm,
    SettingsSectionFooter,
    SettingsSectionGrid
} from "@app/components/Settings";
import { formatAxiosError } from "@app/lib/api";
import { createApiClient } from "@app/lib/api";
import { useEnvContext } from "@app/hooks/useEnvContext";
import { useState, useEffect } from "react";
import { SwitchInput } from "@app/components/SwitchInput";
import { Alert, AlertDescription, AlertTitle } from "@app/components/ui/alert";
import { InfoIcon, ExternalLink } from "lucide-react";
import {
    InfoSection,
    InfoSectionContent,
    InfoSections,
    InfoSectionTitle
} from "@app/components/InfoSection";
import CopyToClipboard from "@app/components/CopyToClipboard";
import { Badge } from "@app/components/ui/badge";
import { useLicenseStatusContext } from "@app/hooks/useLicenseStatusContext";

const GeneralFormSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
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

type GeneralFormValues = z.infer<typeof GeneralFormSchema>;

export default function GeneralPage() {
    const { env } = useEnvContext();
    const api = createApiClient({ env });
    const router = useRouter();
    const { idpId } = useParams();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const { isUnlocked } = useLicenseStatusContext();

    const redirectUrl = `${env.app.dashboardUrl}/auth/idp/${idpId}/oidc/callback`;

    const form = useForm<GeneralFormValues>({
        resolver: zodResolver(GeneralFormSchema),
        defaultValues: {
            name: "",
            clientId: "",
            clientSecret: "",
            authUrl: "",
            tokenUrl: "",
            identifierPath: "sub",
            emailPath: "email",
            namePath: "name",
            scopes: "openid profile email",
            autoProvision: true
        }
    });

    useEffect(() => {
        const loadIdp = async () => {
            try {
                const res = await api.get(`/idp/${idpId}`);
                if (res.status === 200) {
                    const data = res.data.data;
                    form.reset({
                        name: data.idp.name,
                        clientId: data.idpOidcConfig.clientId,
                        clientSecret: data.idpOidcConfig.clientSecret,
                        authUrl: data.idpOidcConfig.authUrl,
                        tokenUrl: data.idpOidcConfig.tokenUrl,
                        identifierPath: data.idpOidcConfig.identifierPath,
                        emailPath: data.idpOidcConfig.emailPath,
                        namePath: data.idpOidcConfig.namePath,
                        scopes: data.idpOidcConfig.scopes,
                        autoProvision: data.idp.autoProvision
                    });
                }
            } catch (e) {
                toast({
                    title: "Error",
                    description: formatAxiosError(e),
                    variant: "destructive"
                });
                router.push("/admin/idp");
            } finally {
                setInitialLoading(false);
            }
        };

        loadIdp();
    }, [idpId, api, form, router]);

    async function onSubmit(data: GeneralFormValues) {
        setLoading(true);

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

            const res = await api.post(`/idp/${idpId}/oidc`, payload);

            if (res.status === 200) {
                toast({
                    title: "Success",
                    description: "Identity provider updated successfully"
                });
                router.refresh();
            }
        } catch (e) {
            toast({
                title: "Error",
                description: formatAxiosError(e),
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }

    if (initialLoading) {
        return null;
    }

    return (
        <>
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
                        <InfoSections cols={3}>
                            <InfoSection>
                                <InfoSectionTitle>
                                    Redirect URL
                                </InfoSectionTitle>
                                <InfoSectionContent>
                                    <CopyToClipboard text={redirectUrl} />
                                </InfoSectionContent>
                            </InfoSection>
                        </InfoSections>

                        <Alert variant="neutral" className="">
                            <InfoIcon className="h-4 w-4" />
                            <AlertTitle className="font-semibold">
                                About Redirect URL
                            </AlertTitle>
                            <AlertDescription>
                                This is the URL to which users will be
                                redirected after authentication. You need to
                                configure this URL in your identity provider
                                settings.
                            </AlertDescription>
                        </Alert>
                        <SettingsSectionForm>
                            <Form {...form}>
                                <form
                                    onSubmit={form.handleSubmit(onSubmit)}
                                    className="space-y-4"
                                    id="general-settings-form"
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

                <SettingsSectionGrid cols={2}>
                    <SettingsSection>
                        <SettingsSectionHeader>
                            <SettingsSectionTitle>
                                OAuth2/OIDC Configuration
                            </SettingsSectionTitle>
                            <SettingsSectionDescription>
                                Configure the OAuth2/OIDC provider endpoints and
                                credentials
                            </SettingsSectionDescription>
                        </SettingsSectionHeader>
                        <SettingsSectionBody>
                            <SettingsSectionForm>
                                <Form {...form}>
                                    <form
                                        onSubmit={form.handleSubmit(onSubmit)}
                                        className="space-y-4"
                                        id="general-settings-form"
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
                                                        <Input {...field} />
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
                                                        <Input {...field} />
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
                            </SettingsSectionForm>
                        </SettingsSectionBody>
                    </SettingsSection>

                    <SettingsSection>
                        <SettingsSectionHeader>
                            <SettingsSectionTitle>
                                Token Configuration
                            </SettingsSectionTitle>
                            <SettingsSectionDescription>
                                Configure how to extract user information from
                                the ID token
                            </SettingsSectionDescription>
                        </SettingsSectionHeader>
                        <SettingsSectionBody>
                            <SettingsSectionForm>
                                <Form {...form}>
                                    <form
                                        onSubmit={form.handleSubmit(onSubmit)}
                                        className="space-y-4"
                                        id="general-settings-form"
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
                                                        The JMESPath to the user
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
                                                        The JMESPath to the
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
                                                        The JMESPath to the
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
                            </SettingsSectionForm>
                        </SettingsSectionBody>
                    </SettingsSection>
                </SettingsSectionGrid>
            </SettingsContainer>

            <div className="flex justify-end mt-8">
                <Button
                    type="submit"
                    form="general-settings-form"
                    loading={loading}
                    disabled={loading}
                >
                    Save General Settings
                </Button>
            </div>
        </>
    );
}
