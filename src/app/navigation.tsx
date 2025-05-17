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

export const orgLangingNavItems: SidebarNavItem[] = [
    {
        title: "Overview",
        href: "/{orgId}",
        icon: <Home className="h-4 w-4" />
    }
];

export const rootNavItems: SidebarNavItem[] = [
    {
        title: "Home",
        href: "/",
        icon: <Home className="h-4 w-4" />
    }
];

export const orgNavItems: SidebarNavItem[] = [
    {
        title: "Sites",
        href: "/{orgId}/settings/sites",
        icon: <Combine className="h-4 w-4" />
    },
    {
        title: "Resources",
        href: "/{orgId}/settings/resources",
        icon: <Waypoints className="h-4 w-4" />
    },
    {
        title: "Access Control",
        href: "/{orgId}/settings/access",
        icon: <Users className="h-4 w-4" />,
        autoExpand: true,
        children: [
            {
                title: "Users",
                href: "/{orgId}/settings/access/users",
                children: [
                    {
                        title: "Invitations",
                        href: "/{orgId}/settings/access/invitations"
                    }
                ]
            },
            {
                title: "Roles",
                href: "/{orgId}/settings/access/roles"
            }
        ]
    },
    {
        title: "Shareable Links",
        href: "/{orgId}/settings/share-links",
        icon: <LinkIcon className="h-4 w-4" />
    },
    {
        title: "API Keys",
        href: "/{orgId}/settings/api-keys",
        icon: <KeyRound className="h-4 w-4" />
    },
    {
        title: "Settings",
        href: "/{orgId}/settings/general",
        icon: <Settings className="h-4 w-4" />
    }
];

export const adminNavItems: SidebarNavItem[] = [
    {
        title: "All Users",
        href: "/admin/users",
        icon: <Users className="h-4 w-4" />
    },
    {
        title: "API Keys",
        href: "/admin/api-keys",
        icon: <KeyRound className="h-4 w-4" />
    },
    {
        title: "Identity Providers",
        href: "/admin/idp",
        icon: <Fingerprint className="h-4 w-4" />
    },
    {
        title: "License",
        href: "/admin/license",
        icon: <TicketCheck className="h-4 w-4" />
    }
];
