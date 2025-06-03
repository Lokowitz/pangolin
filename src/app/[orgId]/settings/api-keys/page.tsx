import { internal } from "@app/lib/api";
import { authCookieHeader } from "@app/lib/api/cookies";
import { AxiosResponse } from "axios";
import SettingsSectionTitle from "@app/components/SettingsSectionTitle";
import OrgApiKeysTable, { OrgApiKeyRow } from "./OrgApiKeysTable";
import { ListOrgApiKeysResponse } from "@server/routers/apiKeys";

type ApiKeyPageProps = {
    params: Promise<{ orgId: string }>;
};

export const dynamic = "force-dynamic";

export default async function ApiKeysPage(props: ApiKeyPageProps) {
    const params = await props.params;
    let apiKeys: ListOrgApiKeysResponse["apiKeys"] = [];
    try {
        const res = await internal.get<AxiosResponse<ListOrgApiKeysResponse>>(
            `/org/${params.orgId}/api-keys`,
            await authCookieHeader()
        );
        apiKeys = res.data.data.apiKeys;
    } catch (e) {}

    const rows: OrgApiKeyRow[] = apiKeys.map((key) => {
        return {
            name: key.name,
            id: key.apiKeyId,
            key: `${key.apiKeyId}••••••••••••••••••••${key.lastChars}`,
            createdAt: key.createdAt
        };
    });

    return (
        <>
            <SettingsSectionTitle
                title="Manage API Keys"
                description="API keys are used to authenticate with the integration API"
            />

            <OrgApiKeysTable apiKeys={rows} orgId={params.orgId} />
        </>
    );
}
