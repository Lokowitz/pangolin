"use client";

import { Button } from "@app/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator
} from "@app/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@app/components/ui/popover";
import { useEnvContext } from "@app/hooks/useEnvContext";
import { cn } from "@app/lib/cn";
import { ListUserOrgsResponse } from "@server/routers/org";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUserContext } from "@app/hooks/useUserContext";
import { useTranslations } from "next-intl";

interface OrgSelectorProps {
    orgId?: string;
    orgs?: ListUserOrgsResponse["orgs"];
}

export function OrgSelector({ orgId, orgs }: OrgSelectorProps) {
    const { user } = useUserContext();
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const { env } = useEnvContext();
    const t = useTranslations();

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="lg"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full h-12 px-3 py-4 bg-neutral hover:bg-neutral"
                >
                    <div className="flex items-center justify-between w-full">
                        <div className="flex flex-col items-start">
                            <span className="font-bold text-sm">
                                {t('org')}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                {orgId
                                    ? orgs?.find(
                                          (org) =>
                                              org.orgId ===
                                              orgId
                                      )?.name
                                    : t('noneSelected')}
                            </span>
                        </div>
                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[180px] p-0">
                <Command>
                    <CommandInput placeholder={t('searchProgress')} />
                    <CommandEmpty>
                        {t('orgNotFound2')}
                    </CommandEmpty>
                    {(!env.flags.disableUserCreateOrg ||
                        user.serverAdmin) && (
                        <>
                            <CommandGroup heading={t('create')}>
                                <CommandList>
                                    <CommandItem
                                        onSelect={(
                                            currentValue
                                        ) => {
                                            router.push(
                                                "/setup"
                                            );
                                        }}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        {t('setupNewOrg')}
                                    </CommandItem>
                                </CommandList>
                            </CommandGroup>
                            <CommandSeparator />
                        </>
                    )}
                    <CommandGroup heading={t('orgs')}>
                        <CommandList>
                            {orgs?.map((org) => (
                                <CommandItem
                                    key={org.orgId}
                                    onSelect={(
                                        currentValue
                                    ) => {
                                        router.push(
                                            `/${org.orgId}/settings`
                                        );
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            orgId === org.orgId
                                                ? "opacity-100"
                                                : "opacity-0"
                                        )}
                                    />
                                    {org.name}
                                </CommandItem>
                            ))}
                        </CommandList>
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
