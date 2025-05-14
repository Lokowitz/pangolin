import { SidebarNavItem } from "@app/components/SidebarNav";
import {
    Home,
    Settings,
    Users,
    Link as LinkIcon,
    Waypoints,
    Combine,
    Fingerprint,
    KeyRound,
    TicketCheck
} from "lucide-react";
import { useTranslations } from "next-intl";

const t = useTranslations();

export const orgLangingNavItems: SidebarNavItem[] = [
    {
        title: t('overview'),
        href: "/{orgId}",
        icon: <Home className="h-4 w-4" />
    }
];

export const rootNavItems: SidebarNavItem[] = [
    {
        title: t('home'),
        href: "/",
        icon: <Home className="h-4 w-4" />
    }
];

export const orgNavItems: SidebarNavItem[] = [
    {
        title: t('sites'),
        href: "/{orgId}/settings/sites",
        icon: <Combine className="h-4 w-4" />
    },
    {
        title: t('resources'),
        href: "/{orgId}/settings/resources",
        icon: <Waypoints className="h-4 w-4" />
    },
    {
        title: t('accessControl'),
        href: "/{orgId}/settings/access",
        icon: <Users className="h-4 w-4" />,
        autoExpand: true,
        children: [
            {
                title: t('users'),
                href: "/{orgId}/settings/access/users",
                children: [
                    {
                        title: t('invite'),
                        href: "/{orgId}/settings/access/invitations"
                    }
                ]
            },
            {
                title: t('roles'),
                href: "/{orgId}/settings/access/roles"
            }
        ]
    },
    {
        title: t('share'),
        href: "/{orgId}/settings/share-links",
        icon: <LinkIcon className="h-4 w-4" />
    },
    {
        title: t('apiKeys'),
        href: "/{orgId}/settings/api-keys",
        icon: <KeyRound className="h-4 w-4" />,
        showProfessional: true
    },
    {
        title: t('settings'),
        href: "/{orgId}/settings/general",
        icon: <Settings className="h-4 w-4" />
    }
];

export const adminNavItems: SidebarNavItem[] = [
    {
        title: t('usersAll'),
        href: "/admin/users",
        icon: <Users className="h-4 w-4" />
    },
    {
        title: t('apiKeys'),
        href: "/admin/api-keys",
        icon: <KeyRound className="h-4 w-4" />,
        showProfessional: true
    },
    {
        title: t('idp'),
        href: "/admin/idp",
        icon: <Fingerprint className="h-4 w-4" />
    },
    {
        title: t('license'),
        href: "/admin/license",
        icon: <TicketCheck className="h-4 w-4" />
    }
];
