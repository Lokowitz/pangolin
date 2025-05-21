"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { createApiClient } from "@app/lib/api";
import { useEnvContext } from "@app/hooks/useEnvContext";
import { AxiosResponse } from "axios";
import {
    RequestTotpSecretBody,
    RequestTotpSecretResponse,
    VerifyTotpBody,
    VerifyTotpResponse
} from "@server/routers/auth";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@app/components/ui/form";
import {
    Credenza,
    CredenzaBody,
    CredenzaClose,
    CredenzaContent,
    CredenzaDescription,
    CredenzaFooter,
    CredenzaHeader,
    CredenzaTitle
} from "@app/components/Credenza";
import { toast } from "@app/hooks/useToast";
import { formatAxiosError } from "@app/lib/api";
import CopyTextBox from "@app/components/CopyTextBox";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { useUserContext } from "@app/hooks/useUserContext";
import { useTranslations } from "next-intl";

const enableSchema = z.object({
    password: z.string().min(1, { message: "Password is required" })
});

const confirmSchema = z.object({
    code: z.string().length(6, { message: "Invalid code" })
});

type Enable2FaProps = {
    open: boolean;
    setOpen: (val: boolean) => void;
};

export default function Enable2FaForm({ open, setOpen }: Enable2FaProps) {
    const [step, setStep] = useState(1);
    const [secretKey, setSecretKey] = useState("");
    const [secretUri, setSecretUri] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [backupCodes, setBackupCodes] = useState<string[]>([]);

    const { user, updateUser } = useUserContext();

    const api = createApiClient(useEnvContext());

    const enableForm = useForm<z.infer<typeof enableSchema>>({
        resolver: zodResolver(enableSchema),
        defaultValues: {
            password: ""
        }
    });

    const confirmForm = useForm<z.infer<typeof confirmSchema>>({
        resolver: zodResolver(confirmSchema),
        defaultValues: {
            code: ""
        }
    });

    const t = useTranslations();

    const request2fa = async (values: z.infer<typeof enableSchema>) => {
        setLoading(true);

        const res = await api
            .post<AxiosResponse<RequestTotpSecretResponse>>(
                `/auth/2fa/request`,
                {
                    password: values.password
                } as RequestTotpSecretBody
            )
            .catch((e) => {
                toast({
                    title: t('otpErrorEnable'),
                    description: formatAxiosError(
                        e,
                        t('otpErrorEnableDescription')
                    ),
                    variant: "destructive"
                });
            });

        if (res && res.data.data.secret) {
            setSecretKey(res.data.data.secret);
            setSecretUri(res.data.data.uri);
            setStep(2);
        }

        setLoading(false);
    };

    const confirm2fa = async (values: z.infer<typeof confirmSchema>) => {
        setLoading(true);

        const res = await api
            .post<AxiosResponse<VerifyTotpResponse>>(`/auth/2fa/enable`, {
                code: values.code
            } as VerifyTotpBody)
            .catch((e) => {
                toast({
                    title: t('otpErrorEnable'),
                    description: formatAxiosError(
                        e,
                        t('otpErrorEnableDescription')
                    ),
                    variant: "destructive"
                });
            });

        if (res && res.data.data.valid) {
            setBackupCodes(res.data.data.backupCodes || []);
            updateUser({ twoFactorEnabled: true });
            setStep(3);
        }

        setLoading(false);
    };

    const handleVerify = () => {
        if (verificationCode.length !== 6) {
            setError(t('otpSetupCheckCode'));
            return;
        }
        if (verificationCode === "123456") {
            setSuccess(true);
            setStep(3);
        } else {
            setError(t('otpSetupCheckCodeRetry'));
        }
    };

    function reset() {
        setLoading(false);
        setStep(1);
        setSecretKey("");
        setSecretUri("");
        setVerificationCode("");
        setError("");
        setSuccess(false);
        setBackupCodes([]);
        enableForm.reset();
        confirmForm.reset();
    }

    return (
        <Credenza
            open={open}
            onOpenChange={(val) => {
                setOpen(val);
                reset();
            }}
        >
            <CredenzaContent>
                <CredenzaHeader>
                    <CredenzaTitle>
                        {t('otpSetup')}
                    </CredenzaTitle>
                    <CredenzaDescription>
                        {t('otpSetupDescription')}
                    </CredenzaDescription>
                </CredenzaHeader>
                <CredenzaBody>
                    {step === 1 && (
                        <Form {...enableForm}>
                            <form
                                onSubmit={enableForm.handleSubmit(request2fa)}
                                className="space-y-4"
                                id="form"
                            >
                                <div className="space-y-4">
                                    <FormField
                                        control={enableForm.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('password')}</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </form>
                        </Form>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <p>
                                {t('otpSetupScanQr')}
                            </p>
                            <div className="h-[250px] mx-auto flex items-center justify-center">
                                <QRCodeCanvas value={secretUri} size={200} />
                            </div>
                            <div className="max-w-md mx-auto">
                                <CopyTextBox
                                    text={secretUri}
                                    wrapText={false}
                                />
                            </div>

                            <Form {...confirmForm}>
                                <form
                                    onSubmit={confirmForm.handleSubmit(
                                        confirm2fa
                                    )}
                                    className="space-y-4"
                                    id="form"
                                >
                                    <div className="space-y-4">
                                        <FormField
                                            control={confirmForm.control}
                                            name="code"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {t('otpSetupSecretCode')}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="code"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </form>
                            </Form>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4 text-center">
                            <CheckCircle2
                                className="mx-auto text-green-500"
                                size={48}
                            />
                            <p className="font-semibold text-lg">
                                {t('otpSetupSuccess')}
                            </p>
                            <p>
                                {t('otpSetupSuccessStoreBackupCodes')}
                            </p>

                            <div className="max-w-md mx-auto">
                                <CopyTextBox text={backupCodes.join("\n")} />
                            </div>
                        </div>
                    )}
                </CredenzaBody>
                <CredenzaFooter>
                    <CredenzaClose asChild>
                        <Button variant="outline">Close</Button>
                    </CredenzaClose>
                    {(step === 1 || step === 2) && (
                        <Button
                            type="button"
                            loading={loading}
                            disabled={loading}
                            onClick={() => {
                                if (step === 1) {
                                    enableForm.handleSubmit(request2fa)();
                                } else {
                                    confirmForm.handleSubmit(confirm2fa)();
                                }
                            }}
                        >
                            {t('submit')}
                        </Button>
                    )}
                </CredenzaFooter>
            </CredenzaContent>
        </Credenza>
    );
}
