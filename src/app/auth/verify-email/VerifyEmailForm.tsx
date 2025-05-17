"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { AxiosResponse } from "axios";
import { VerifyEmailResponse } from "@server/routers/auth";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { toast } from "@app/hooks/useToast";
import { useRouter } from "next/navigation";
import { formatAxiosError } from "@app/lib/api";;
import { createApiClient } from "@app/lib/api";
import { useEnvContext } from "@app/hooks/useEnvContext";
import { cleanRedirect } from "@app/lib/cleanRedirect";
import { useTranslations } from "next-intl";

const FormSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    pin: z.string().min(8, {
        message: "Your verification code must be 8 characters.",
    }),
});

export type VerifyEmailFormProps = {
    email: string;
    redirect?: string;
};

export default function VerifyEmailForm({
    email,
    redirect,
}: VerifyEmailFormProps) {
    const router = useRouter();

    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isResending, setIsResending] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const api = createApiClient(useEnvContext());

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            email: email,
            pin: "",
        },
    });

    const t = useTranslations();

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        setIsSubmitting(true);

        const res = await api
            .post<AxiosResponse<VerifyEmailResponse>>("/auth/verify-email", {
                code: data.pin,
            })
            .catch((e) => {
                setError(formatAxiosError(e, "An error occurred"));
                console.error("Failed to verify email:", e);
                setIsSubmitting(false);
            });

        if (res && res.data?.data?.valid) {
            setError(null);
            setSuccessMessage(
                "Email successfully verified! Redirecting you..."
            );
            setTimeout(() => {
                if (redirect) {
                    const safe = cleanRedirect(redirect);
                    router.push(safe);
                } else {
                    router.push("/");
                }
                setIsSubmitting(false);
            }, 1500);
        }
    }

    async function handleResendCode() {
        setIsResending(true);

        const res = await api.post("/auth/verify-email/request").catch((e) => {
            setError(formatAxiosError(e, "An error occurred"));
            console.error("Failed to resend verification code:", e);
        });

        if (res) {
            setError(null);
            toast({
                variant: "default",
                title: "Verification code resent",
                description: "We've resent a verification code to your email address. Please check your inbox.",
            });
        }

        setIsResending(false);
    }

    return (
        <div>
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>{t('emailVerify')}</CardTitle>
                    <CardDescription>
                        {t('emailVerifyDescription')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-4"
                        >
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('email')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                disabled
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="pin"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('verificationCode')}</FormLabel>
                                        <FormControl>
                                            <div className="flex justify-center">
                                                <InputOTP
                                                    maxLength={8}
                                                    {...field}
                                                >
                                                    <InputOTPGroup className="flex">
                                                        <InputOTPSlot
                                                            index={0}
                                                        />
                                                        <InputOTPSlot
                                                            index={1}
                                                        />
                                                        <InputOTPSlot
                                                            index={2}
                                                        />
                                                        <InputOTPSlot
                                                            index={3}
                                                        />
                                                        <InputOTPSlot
                                                            index={4}
                                                        />
                                                        <InputOTPSlot
                                                            index={5}
                                                        />
                                                        <InputOTPSlot
                                                            index={6}
                                                        />
                                                        <InputOTPSlot
                                                            index={7}
                                                        />
                                                    </InputOTPGroup>
                                                </InputOTP>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                        <FormDescription>
                                            {t('verificationCodeEmailSent')}
                                        </FormDescription>
                                    </FormItem>
                                )}
                            />

                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {successMessage && (
                                <Alert variant="success">
                                    <AlertDescription>
                                        {successMessage}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isSubmitting}
                            >
                                {isSubmitting && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {t('emailVerifySubmit')}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <div className="text-center text-muted-foreground mt-2">
                <Button
                    type="button"
                    variant="link"
                    onClick={handleResendCode}
                    disabled={isResending}
                >
                    {isResending
                        ? t('emailVerifyResendProgress')
                        : t('emailVerifyResend')}
                </Button>
            </div>
        </div>
    );
}
