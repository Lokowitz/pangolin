"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { createApiClient } from "@app/lib/api";
import LoginForm, { LoginFormIDP } from "@app/components/LoginForm";
import { useEnvContext } from "@app/hooks/useEnvContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";
import { cleanRedirect } from "@app/lib/cleanRedirect";

type DashboardLoginFormProps = {
    redirect?: string;
    idps?: LoginFormIDP[];
};

export default function DashboardLoginForm({
    redirect,
    idps
}: DashboardLoginFormProps) {
    const router = useRouter();
    // const api = createApiClient(useEnvContext());
    //
    // useEffect(() => {
    //     const logout = async () => {
    //         try {
    //             await api.post("/auth/logout");
    //             console.log("user logged out");
    //         } catch (e) {}
    //     };
    //
    //     logout();
    // });

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <div className="flex flex-row items-center justify-center">
                    <Image
                        src={`/logo/pangolin_orange.svg`}
                        alt="Pangolin Logo"
                        width={100}
                        height={100}
                    />
                </div>
                <div className="text-center space-y-1">
                    <h1 className="text-2xl font-bold mt-1">
                        Welcome to Pangolin
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Log in to get started
                    </p>
                </div>
            </CardHeader>
            <CardContent>
                <LoginForm
                    redirect={redirect}
                    idps={idps}
                    onLogin={() => {
                        if (redirect) {
                            const safe = cleanRedirect(redirect);
                            router.push(safe);
                        } else {
                            router.push("/");
                        }
                    }}
                />
            </CardContent>
        </Card>
    );
}
