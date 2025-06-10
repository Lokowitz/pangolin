"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useSiteContext } from "@app/hooks/useSiteContext";
import { useForm } from "react-hook-form";
import { toast } from "@app/hooks/useToast";
import { useRouter } from "next/navigation";
import {
    SettingsContainer,
    SettingsSection,
    SettingsSectionHeader,
    SettingsSectionTitle,
    SettingsSectionDescription,
    SettingsSectionBody,
    SettingsSectionForm,
    SettingsSectionFooter
} from "@app/components/Settings";
import { formatAxiosError } from "@app/lib/api";
import { createApiClient } from "@app/lib/api";
import { useEnvContext } from "@app/hooks/useEnvContext";
import { useState } from "react";
import { SwitchInput } from "@app/components/SwitchInput";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";

const GeneralFormSchema = z.object({
    name: z.string().nonempty("Name is required"),
    dockerSocketEnabled: z.boolean().optional()
});

type GeneralFormValues = z.infer<typeof GeneralFormSchema>;

export default function GeneralPage() {
    const { site, updateSite } = useSiteContext();

    const api = createApiClient(useEnvContext());

    const [loading, setLoading] = useState(false);

    const router = useRouter();

    const form = useForm<GeneralFormValues>({
        resolver: zodResolver(GeneralFormSchema),
        defaultValues: {
            name: site?.name,
            dockerSocketEnabled: site?.dockerSocketEnabled ?? false
        },
        mode: "onChange"
    });

    async function onSubmit(data: GeneralFormValues) {
        setLoading(true);

        await api
            .post(`/site/${site?.siteId}`, {
                name: data.name,
                dockerSocketEnabled: data.dockerSocketEnabled
            })
            .catch((e) => {
                toast({
                    variant: "destructive",
                    title: "Failed to update site",
                    description: formatAxiosError(
                        e,
                        "An error occurred while updating the site."
                    )
                });
            });

        updateSite({
            name: data.name,
            dockerSocketEnabled: data.dockerSocketEnabled
        });

        toast({
            title: "Site updated",
            description: "The site has been updated."
        });

        setLoading(false);

        router.refresh();
    }

    return (
        <SettingsContainer>
            <SettingsSection>
                <SettingsSectionHeader>
                    <SettingsSectionTitle>
                        General Settings
                    </SettingsSectionTitle>
                    <SettingsSectionDescription>
                        Configure the general settings for this site
                    </SettingsSectionDescription>
                </SettingsSectionHeader>

                <SettingsSectionBody>
                    <SettingsSectionForm>
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="space-y-6"
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
                                            <FormMessage />
                                            <FormDescription>
                                                This is the display name of the
                                                site.
                                            </FormDescription>
                                        </FormItem>
                                    )}
                                />
                                {site && site.type === "newt" && (
                                    <FormField
                                        control={form.control}
                                        name="dockerSocketEnabled"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <SwitchInput
                                                        id="docker-socket-enabled"
                                                        label="Enable Docker Socket"
                                                        defaultChecked={
                                                            field.value
                                                        }
                                                        onCheckedChange={
                                                            field.onChange
                                                        }
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                                <FormDescription>
                                                    Enable Docker Socket
                                                    discovery for populating
                                                    container information.
                                                    Socket path must be provided
                                                    to Newt.{" "}
                                                    <a
                                                        href="https://docs.fossorial.io/Newt/overview#docker-socket-integration"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary hover:underline inline-flex items-center"
                                                    >
                                                        Learn more
                                                        <ExternalLink className="ml-1 h-4 w-4" />
                                                    </a>
                                                </FormDescription>
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </form>
                        </Form>
                    </SettingsSectionForm>
                </SettingsSectionBody>

                <SettingsSectionFooter>
                    <Button
                        type="submit"
                        form="general-settings-form"
                        loading={loading}
                        disabled={loading}
                    >
                        Save General Settings
                    </Button>
                </SettingsSectionFooter>
            </SettingsSection>
        </SettingsContainer>
    );
}
