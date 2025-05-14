import { internal } from "@app/lib/api";
import { authCookieHeader } from "@app/lib/api/cookies";
import { verifySession } from "@app/lib/auth/verifySession";
import { AcceptInviteResponse } from "@server/routers/user";
import { AxiosResponse } from "axios";
import { redirect } from "next/navigation";
import InviteStatusCard from "./InviteStatusCard";
import { formatAxiosError } from "@app/lib/api";
import { useTranslations } from "next-intl";

;

export default async function InvitePage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await props.searchParams;

    const tokenParam = params.token as string;

    if (!tokenParam) {
        redirect("/");
    }

    const user = await verifySession();

    const t = useTranslations();

    const parts = tokenParam.split("-");
    if (parts.length !== 2) {
        return (
            <>
                <h1>{t('inviteInvalid')}</h1>
                <p>{t('inviteInvalidDescription')}</p>
            </>
        );
    }

    const inviteId = parts[0];
    const token = parts[1];

    let error = "";
    const res = await internal
        .post<AxiosResponse<AcceptInviteResponse>>(
            `/invite/accept`,
            {
                inviteId,
                token,
            },
            await authCookieHeader()
        )
        .catch((e) => {
            error = formatAxiosError(e);
        });

    if (res && res.status === 200) {
        redirect(`/${res.data.data.orgId}`);
    }

    function cardType() {
        if (error.includes(t('inviteErrorWrongUser'))) {
            return "wrong_user";
        } else if (
            error.includes(t('inviteErrorUserNotExists'))
        ) {
            return "user_does_not_exist";
        } else if (error.includes(t('inviteErrorLoginRequired'))) {
            return "not_logged_in";
        } else {
            return "rejected";
        }
    }

    const type = cardType();

    if (!user && type === "user_does_not_exist") {
        redirect(`/auth/signup?redirect=/invite?token=${params.token}`);
    }

    if (!user && type === "not_logged_in") {
        redirect(`/auth/login?redirect=/invite?token=${params.token}`);
    }

    return (
        <>
            <InviteStatusCard type={type} token={tokenParam} />
        </>
    );
}
