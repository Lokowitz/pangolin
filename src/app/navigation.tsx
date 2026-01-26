import { SidebarNavItem } from "@app/components/SidebarNav";
import { Env } from "@app/lib/types/env";
import { build } from "@server/build";
import {
    LuChartLine,
    LuCombine,
    LuCreditCard,
    LuFingerprint,
    LuGlobe,
    LuGlobeLock,
    LuKeyRound,
    LuLaptop,
    LuLink as LinkIcon,
    LuLogs, // Added from 'dev' branch
    LuMonitorUp,
    LuReceiptText,
    LuScanEye, // Added from 'dev' branch
    LuServer,
    LuSettings,
    LuSquareMousePointer,
    LuTicketCheck,
    LuUser,
    LuUserCog,
    LuUsers,
    LuWaypoints
} from "react-icons/lu";

export type SidebarNavSection = {
    // Added from 'dev' branch
    heading: string;
    items: SidebarNavItem[];
};

// Merged from 'user-management-and-resources' branch
export const orgLangingNavItems: SidebarNavItem[] = [
    {
        title: "sidebarAccount",
        href: "/{orgId}",
        icon: <LuUser className="size-4 flex-none" />
    }
];

export const orgNavSections = (env?: Env): SidebarNavSection[] => [
    {
        heading: "sidebarGeneral",
        items: [
            {
                title: "sidebarSites",
                href: "/{orgId}/settings/sites",
                icon: <LuCombine className="size-4 flex-none" />
            },
            {
                title: "sidebarResources",
                icon: <LuWaypoints className="size-4 flex-none" />,
                items: [
                    {
                        title: "sidebarProxyResources",
                        href: "/{orgId}/settings/resources/proxy",
                        icon: <LuGlobe className="size-4 flex-none" />
                    },
                    {
                        title: "sidebarClientResources",
                        href: "/{orgId}/settings/resources/client",
                        icon: <LuGlobeLock className="size-4 flex-none" />
                    }
                ]
            },
            {
                title: "sidebarClients",
                icon: <LuMonitorUp className="size-4 flex-none" />,
                items: [
                    {
                        href: "/{orgId}/settings/clients/user",
                        title: "sidebarUserDevices",
                        icon: <LuLaptop className="size-4 flex-none" />
                    },
                    {
                        href: "/{orgId}/settings/clients/machine",
                        title: "sidebarMachineClients",
                        icon: <LuServer className="size-4 flex-none" />
                    }
                ]
            },
            {
                title: "sidebarDomains",
                href: "/{orgId}/settings/domains",
                icon: <LuGlobe className="size-4 flex-none" />
            },
            ...(build == "saas"
                ? [
                      {
                          title: "sidebarRemoteExitNodes",
                          href: "/{orgId}/settings/remote-exit-nodes",
                          icon: <LuServer className="size-4 flex-none" />
                      }
                  ]
                : [])
        ]
    },
    {
        heading: "access",
        items: [
            {
                title: "sidebarUsers",
                icon: <LuUser className="size-4 flex-none" />,
                items: [
                    {
                        title: "sidebarUsers",
                        href: "/{orgId}/settings/access/users",
                        icon: <LuUser className="size-4 flex-none" />
                    },
                    {
                        title: "sidebarInvitations",
                        href: "/{orgId}/settings/access/invitations",
                        icon: <LuTicketCheck className="size-4 flex-none" />
                    }
                ]
            },
            {
                title: "sidebarRoles",
                href: "/{orgId}/settings/access/roles",
                icon: <LuUsers className="size-4 flex-none" />
            },
            ...(build === "saas" || env?.flags.useOrgOnlyIdp
                ? [
                      {
                          title: "sidebarIdentityProviders",
                          href: "/{orgId}/settings/idp",
                          icon: <LuFingerprint className="size-4 flex-none" />
                      }
                  ]
                : []),
            ...(build !== "oss"
                ? [
                      {
                          title: "sidebarApprovals",
                          href: "/{orgId}/settings/access/approvals",
                          icon: <LuUserCog className="size-4 flex-none" />
                      }
                  ]
                : []),
            {
                title: "sidebarShareableLinks",
                href: "/{orgId}/settings/share-links",
                icon: <LinkIcon className="size-4 flex-none" />
            }
        ]
    },
    {
        heading: "sidebarLogsAndAnalytics",
        items: (() => {
            const logItems: SidebarNavItem[] = [
                {
                    title: "sidebarLogsRequest",
                    href: "/{orgId}/settings/logs/request",
                    icon: <LuSquareMousePointer className="size-4 flex-none" />
                },
                ...(build != "oss"
                    ? [
                          {
                              title: "sidebarLogsAccess",
                              href: "/{orgId}/settings/logs/access",
                              icon: <LuScanEye className="size-4 flex-none" />
                          },
                          {
                              title: "sidebarLogsAction",
                              href: "/{orgId}/settings/logs/action",
                              icon: <LuLogs className="size-4 flex-none" />
                          }
                      ]
                    : [])
            ];

            const analytics = {
                title: "sidebarLogsAnalytics",
                href: "/{orgId}/settings/logs/analytics",
                icon: <LuChartLine className="h-4 w-4" />
            };

            // If only one log item, return it directly without grouping
            if (logItems.length === 1) {
                return [analytics, ...logItems];
            }

            // If multiple log items, create a group
            return [
                analytics,
                {
                    title: "sidebarLogs",
                    icon: <LuLogs className="size-4 flex-none" />,
                    items: logItems
                }
            ];
        })()
    },
    {
        heading: "sidebarOrganization",
        items: [
            {
                title: "sidebarApiKeys",
                href: "/{orgId}/settings/api-keys",
                icon: <LuKeyRound className="size-4 flex-none" />
            },
            {
                title: "sidebarBluePrints",
                href: "/{orgId}/settings/blueprints",
                icon: <LuReceiptText className="size-4 flex-none" />
            },
            {
                title: "sidebarSettings",
                href: "/{orgId}/settings/general",
                icon: <LuSettings className="size-4 flex-none" />
            },

            ...(build == "saas"
                ? [
                      {
                          title: "sidebarBilling",
                          href: "/{orgId}/settings/billing",
                          icon: <LuCreditCard className="size-4 flex-none" />
                      }
                  ]
                : []),
            ...(build == "saas"
                ? [
                      {
                          title: "sidebarEnterpriseLicenses",
                          href: "/{orgId}/settings/license",
                          icon: <LuTicketCheck className="size-4 flex-none" />
                      }
                  ]
                : [])
        ]
    }
];

export const adminNavSections = (env?: Env): SidebarNavSection[] => [
    {
        heading: "sidebarAdmin",
        items: [
            {
                title: "sidebarAllUsers",
                href: "/admin/users",
                icon: <LuUsers className="size-4 flex-none" />
            },
            {
                title: "sidebarApiKeys",
                href: "/admin/api-keys",
                icon: <LuKeyRound className="size-4 flex-none" />
            },
            ...(build === "oss" || !env?.flags.useOrgOnlyIdp
                ? [
                      {
                          title: "sidebarIdentityProviders",
                          href: "/admin/idp",
                          icon: <LuFingerprint className="size-4 flex-none" />
                      }
                  ]
                : []),
            ...(build == "enterprise"
                ? [
                      {
                          title: "sidebarLicense",
                          href: "/admin/license",
                          icon: <LuTicketCheck className="size-4 flex-none" />
                      }
                  ]
                : [])
        ]
    }
];
