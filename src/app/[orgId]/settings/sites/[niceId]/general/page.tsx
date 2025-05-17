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
import { useTranslations } from 'next-intl';

const GeneralFormSchema = z.object({
    name: z.string().nonempty("Name is required")
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
            name: site?.name
        },
        mode: "onChange"
    });
    const t = useTranslations();

    async function onSubmit(data: GeneralFormValues) {
        setLoading(true);

        await api
            .post(`/site/${site?.siteId}`, {
                name: data.name
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

        updateSite({ name: data.name });

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
                        {t('generalSettings')}
                    </SettingsSectionTitle>
                    <SettingsSectionDescription>
                        {t('siteGeneralDescription')}
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
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('name')}</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                            <FormDescription>
                                                {t('siteNameDescription')}
                                            </FormDescription>
                                        </FormItem>
                                    )}
                                />
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
                        {t('saveGeneralSettings')}
                    </Button>
                </SettingsSectionFooter>
            </SettingsSection>
        </SettingsContainer>
    );
}
