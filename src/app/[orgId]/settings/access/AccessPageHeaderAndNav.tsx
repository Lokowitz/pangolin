"use client";

import { HorizontalTabs } from "@app/components/HorizontalTabs";
import SettingsSectionTitle from "@app/components/SettingsSectionTitle";
import { useTranslations } from "next-intl";

interface AccessPageHeaderAndNavProps {
    children: React.ReactNode;
    hasInvitations: boolean;
}

/**
 * Renders the access management section header and navigation tabs for users, roles, and optionally invitations.
 *
 * Displays a localized section title and description, followed by horizontal navigation tabs. The "Invitations" tab is included if `hasInvitations` is true.
 *
 * @param hasInvitations - Whether to include the "Invitations" tab in the navigation
 * @param children - Content to display below the navigation tabs
 */
export default function AccessPageHeaderAndNav({
    children,
    hasInvitations
}: AccessPageHeaderAndNavProps) {
    const t = useTranslations();
    
    const navItems = [
        {
            title: t('users'),
            href: `/{orgId}/settings/access/users`
        },
        {
            title: t('roles'),
            href: `/{orgId}/settings/access/roles`
        }
    ];

    if (hasInvitations) {
        navItems.push({
            title: t('invite'),
            href: `/{orgId}/settings/access/invitations`
        });
    }

    return (
        <>
            <SettingsSectionTitle
                title={t('accessUsersRoles')}
                description={t('accessUsersRolesDescription')}
            />

            <HorizontalTabs items={navItems}>
                {children}
            </HorizontalTabs>
        </>
    );
}
