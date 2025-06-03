"use client";

import React, { useEffect, useState } from "react";
import { SidebarNav } from "@app/components/SidebarNav";
import { OrgSelector } from "@app/components/OrgSelector";
import { cn } from "@app/lib/cn";
import { ListUserOrgsResponse } from "@server/routers/org";
import SupporterStatus from "@app/components/SupporterStatus";
import { Button } from "@app/components/ui/button";
import { ExternalLink, Menu, X, Server } from "lucide-react";
import Image from "next/image";
import ProfileIcon from "@app/components/ProfileIcon";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetTitle,
    SheetDescription
} from "@app/components/ui/sheet";
import { useEnvContext } from "@app/hooks/useEnvContext";
import { Breadcrumbs } from "@app/components/Breadcrumbs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserContext } from "@app/hooks/useUserContext";
import { useLicenseStatusContext } from "@app/hooks/useLicenseStatusContext";
import { useTheme } from "next-themes";

interface LayoutProps {
    children: React.ReactNode;
    orgId?: string;
    orgs?: ListUserOrgsResponse["orgs"];
    navItems?: Array<{
        title: string;
        href: string;
        icon?: React.ReactNode;
        children?: Array<{
            title: string;
            href: string;
            icon?: React.ReactNode;
        }>;
    }>;
    showSidebar?: boolean;
    showBreadcrumbs?: boolean;
    showHeader?: boolean;
    showTopBar?: boolean;
}

export function Layout({
    children,
    orgId,
    orgs,
    navItems = [],
    showSidebar = true,
    showBreadcrumbs = true,
    showHeader = true,
    showTopBar = true
}: LayoutProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { env } = useEnvContext();
    const pathname = usePathname();
    const isAdminPage = pathname?.startsWith("/admin");
    const { user } = useUserContext();
    const { isUnlocked } = useLicenseStatusContext();

    const { theme } = useTheme();
    const [path, setPath] = useState<string>(""); // Default logo path

    useEffect(() => {
        function getPath() {
            let lightOrDark = theme;

            if (theme === "system" || !theme) {
                lightOrDark = window.matchMedia("(prefers-color-scheme: dark)")
                    .matches
                    ? "dark"
                    : "light";
            }

            if (lightOrDark === "light") {
                return "/logo/word_mark_black.png";
            }

            return "/logo/word_mark_white.png";
        }

        setPath(getPath());
    }, [theme, env]);

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            {/* Full width header */}
            {showHeader && (
                <div className="border-b shrink-0 bg-card">
                    <div className="h-16 flex items-center px-4">
                        <div className="flex items-center gap-4">
                            {showSidebar && (
                                <div className="md:hidden">
                                    <Sheet
                                        open={isMobileMenuOpen}
                                        onOpenChange={setIsMobileMenuOpen}
                                    >
                                        <SheetTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <Menu className="h-6 w-6" />
                                            </Button>
                                        </SheetTrigger>
                                        <SheetContent
                                            side="left"
                                            className="w-64 p-0 flex flex-col h-full"
                                        >
                                            <SheetTitle className="sr-only">
                                                Navigation Menu
                                            </SheetTitle>
                                            <SheetDescription className="sr-only">
                                                Main navigation menu for the
                                                application
                                            </SheetDescription>
                                            <div className="flex-1 overflow-y-auto">
                                                <div className="p-4">
                                                    <SidebarNav
                                                        items={navItems}
                                                        onItemClick={() =>
                                                            setIsMobileMenuOpen(
                                                                false
                                                            )
                                                        }
                                                    />
                                                </div>
                                                {!isAdminPage &&
                                                    user.serverAdmin && (
                                                        <div className="p-4 border-t">
                                                            <Link
                                                                href="/admin"
                                                                className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md w-full"
                                                                onClick={() =>
                                                                    setIsMobileMenuOpen(
                                                                        false
                                                                    )
                                                                }
                                                            >
                                                                <Server className="h-4 w-4" />
                                                                Server Admin
                                                            </Link>
                                                        </div>
                                                    )}
                                            </div>
                                            <div className="p-4 space-y-4 border-t shrink-0">
                                                <SupporterStatus />
                                                <OrgSelector
                                                    orgId={orgId}
                                                    orgs={orgs}
                                                />
                                                {env?.app?.version && (
                                                    <div className="text-xs text-muted-foreground text-center">
                                                        v{env.app.version}
                                                    </div>
                                                )}
                                            </div>
                                        </SheetContent>
                                    </Sheet>
                                </div>
                            )}
                            <Link
                                href="/"
                                className="flex items-center hidden md:block"
                            >
                                {path && (
                                    <Image
                                        src={path}
                                        alt="Pangolin Logo"
                                        width={110}
                                        height={25}
                                    />
                                )}
                            </Link>
                            {showBreadcrumbs && (
                                <div className="hidden md:block overflow-x-auto scrollbar-hide">
                                    <Breadcrumbs />
                                </div>
                            )}
                        </div>
                        {showTopBar && (
                            <div className="ml-auto flex items-center justify-end md:justify-between">
                                <div className="hidden md:flex items-center space-x-3 mr-6">
                                    <Link
                                        href="https://docs.fossorial.io"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        Documentation
                                    </Link>
                                </div>
                                <div>
                                    <ProfileIcon />
                                </div>
                            </div>
                        )}
                    </div>
                    {showBreadcrumbs && (
                        <div className="md:hidden px-4 pb-2 overflow-x-auto scrollbar-hide">
                            <Breadcrumbs />
                        </div>
                    )}
                </div>
            )}

            <div className="flex flex-1 overflow-hidden">
                {/* Desktop Sidebar */}
                {showSidebar && (
                    <div className="hidden md:flex w-64 border-r bg-card flex-col h-full shrink-0">
                        <div className="flex-1 overflow-y-auto">
                            <div className="p-4">
                                <SidebarNav items={navItems} />
                            </div>
                            {!isAdminPage && user.serverAdmin && (
                                <div className="p-4 border-t">
                                    <Link
                                        href="/admin"
                                        className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md w-full"
                                    >
                                        <Server className="h-4 w-4" />
                                        Server Admin
                                    </Link>
                                </div>
                            )}
                        </div>
                        <div className="p-4 space-y-4 border-t shrink-0">
                            <SupporterStatus />
                            <OrgSelector orgId={orgId} orgs={orgs} />
                            <div className="space-y-2">
                                <div className="text-xs text-muted-foreground text-center">
                                    <Link
                                        href="https://github.com/fosrl/pangolin"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-1"
                                    >
                                        {!isUnlocked()
                                            ? "Community Edition"
                                            : "Commercial Edition"}
                                        <ExternalLink size={12} />
                                    </Link>
                                </div>
                                {env?.app?.version && (
                                    <div className="text-xs text-muted-foreground text-center">
                                        v{env.app.version}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Main content */}
                <div
                    className={cn(
                        "flex-1 flex flex-col h-full min-w-0",
                        !showSidebar && "w-full"
                    )}
                >
                    <main className="flex-1 overflow-y-auto p-3 md:p-6 w-full">
                        <div className="container mx-auto max-w-12xl mb-12">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
