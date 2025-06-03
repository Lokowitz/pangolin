import { internal } from "@app/lib/api";
import { AxiosResponse } from "axios";
import { redirect } from "next/navigation";
import { authCookieHeader } from "@app/lib/api/cookies";
import { SidebarSettings } from "@app/components/SidebarSettings";
import Link from "next/link";
import SettingsSectionTitle from "@app/components/SettingsSectionTitle";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@app/components/ui/breadcrumb";
import { GetApiKeyResponse } from "@server/routers/apiKeys";
import ApiKeyProvider from "@app/providers/ApiKeyProvider";
import { HorizontalTabs } from "@app/components/HorizontalTabs";

interface SettingsLayoutProps {
    children: React.ReactNode;
    params: Promise<{ apiKeyId: string }>;
}

export default async function SettingsLayout(props: SettingsLayoutProps) {
    const params = await props.params;

    const { children } = props;

    let apiKey = null;
    try {
        const res = await internal.get<AxiosResponse<GetApiKeyResponse>>(
            `/api-key/${params.apiKeyId}`,
            await authCookieHeader()
        );
        apiKey = res.data.data;
    } catch (e) {
        console.error(e);
        redirect(`/admin/api-keys`);
    }

    const navItems = [
        {
            title: "Permissions",
            href: "/admin/api-keys/{apiKeyId}/permissions"
        }
    ];

    return (
        <>
            <SettingsSectionTitle title={`${apiKey?.name} Settings`} />

            <ApiKeyProvider apiKey={apiKey}>
                <HorizontalTabs items={navItems}>{children}</HorizontalTabs>
            </ApiKeyProvider>
        </>
    );
}
