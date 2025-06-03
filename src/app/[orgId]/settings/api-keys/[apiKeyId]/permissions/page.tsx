"use client";

import PermissionsSelectBox from "@app/components/PermissionsSelectBox";
import {
    SettingsContainer,
    SettingsSection,
    SettingsSectionBody,
    SettingsSectionDescription,
    SettingsSectionFooter,
    SettingsSectionHeader,
    SettingsSectionTitle
} from "@app/components/Settings";
import { Button } from "@app/components/ui/button";
import { useEnvContext } from "@app/hooks/useEnvContext";
import { toast } from "@app/hooks/useToast";
import { createApiClient, formatAxiosError } from "@app/lib/api";
import { ListApiKeyActionsResponse } from "@server/routers/apiKeys";
import { AxiosResponse } from "axios";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
    const { env } = useEnvContext();
    const api = createApiClient({ env });
    const { orgId, apiKeyId } = useParams();

    const [loadingPage, setLoadingPage] = useState<boolean>(true);
    const [selectedPermissions, setSelectedPermissions] = useState<
        Record<string, boolean>
    >({});
    const [loadingSavePermissions, setLoadingSavePermissions] =
        useState<boolean>(false);

    useEffect(() => {
        async function load() {
            setLoadingPage(true);

            const res = await api
                .get<
                    AxiosResponse<ListApiKeyActionsResponse>
                >(`/org/${orgId}/api-key/${apiKeyId}/actions`)
                .catch((e) => {
                    toast({
                        variant: "destructive",
                        title: "Error loading API key actions",
                        description: formatAxiosError(
                            e,
                            "Error loading API key actions"
                        )
                    });
                });

            if (res && res.status === 200) {
                const data = res.data.data;
                for (const action of data.actions) {
                    setSelectedPermissions((prev) => ({
                        ...prev,
                        [action.actionId]: true
                    }));
                }
            }

            setLoadingPage(false);
        }

        load();
    }, []);

    async function savePermissions() {
        setLoadingSavePermissions(true);

        const actionsRes = await api
            .post(`/org/${orgId}/api-key/${apiKeyId}/actions`, {
                actionIds: Object.keys(selectedPermissions).filter(
                    (key) => selectedPermissions[key]
                )
            })
            .catch((e) => {
                console.error("Error setting permissions", e);
                toast({
                    variant: "destructive",
                    title: "Error setting permissions",
                    description: formatAxiosError(e)
                });
            });

        if (actionsRes && actionsRes.status === 200) {
            toast({
                title: "Permissions updated",
                description: "The permissions have been updated."
            });
        }

        setLoadingSavePermissions(false);
    }

    return (
        <>
            {!loadingPage && (
                <SettingsContainer>
                    <SettingsSection>
                        <SettingsSectionHeader>
                            <SettingsSectionTitle>
                                Permissions
                            </SettingsSectionTitle>
                            <SettingsSectionDescription>
                                Determine what this API key can do
                            </SettingsSectionDescription>
                        </SettingsSectionHeader>
                        <SettingsSectionBody>
                            <PermissionsSelectBox
                                selectedPermissions={selectedPermissions}
                                onChange={setSelectedPermissions}
                            />

                            <SettingsSectionFooter>
                                <Button
                                    onClick={async () => {
                                        await savePermissions();
                                    }}
                                    loading={loadingSavePermissions}
                                    disabled={loadingSavePermissions}
                                >
                                    Save Permissions
                                </Button>
                            </SettingsSectionFooter>
                        </SettingsSectionBody>
                    </SettingsSection>
                </SettingsContainer>
            )}
        </>
    );
}
