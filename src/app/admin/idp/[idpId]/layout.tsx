import { internal } from "@app/lib/api";
import { GetIdpResponse } from "@server/routers/idp";
import { AxiosResponse } from "axios";
import { redirect } from "next/navigation";
import { authCookieHeader } from "@app/lib/api/cookies";
import { HorizontalTabs } from "@app/components/HorizontalTabs";
import { ProfessionalContentOverlay } from "@app/components/ProfessionalContentOverlay";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SettingsSectionTitle from "@app/components/SettingsSectionTitle";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@app/components/ui/breadcrumb";

interface SettingsLayoutProps {
    children: React.ReactNode;
    params: Promise<{ idpId: string }>;
}

export default async function SettingsLayout(props: SettingsLayoutProps) {
    const params = await props.params;
    const { children } = props;

    let idp = null;
    try {
        const res = await internal.get<AxiosResponse<GetIdpResponse>>(
            `/idp/${params.idpId}`,
            await authCookieHeader()
        );
        idp = res.data.data;
    } catch {
        redirect("/admin/idp");
    }

    const navItems: HorizontalTabs = [
        {
            title: "General",
            href: `/admin/idp/${params.idpId}/general`
        },
        {
            title: "Organization Policies",
            href: `/admin/idp/${params.idpId}/policies`
        }
    ];

    return (
        <>
            <SettingsSectionTitle
                title={`${idp.idp.name} Settings`}
                description="Configure the settings for your identity provider"
            />

            <div className="space-y-6">
                <HorizontalTabs items={navItems}>{children}</HorizontalTabs>
            </div>
        </>
    );
}
