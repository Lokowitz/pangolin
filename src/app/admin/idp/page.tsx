import { internal } from "@app/lib/api";
import { authCookieHeader } from "@app/lib/api/cookies";
import { AxiosResponse } from "axios";
import SettingsSectionTitle from "@app/components/SettingsSectionTitle";
import IdpTable, { IdpRow } from "./AdminIdpTable";
import { useTranslations } from "next-intl";

export default async function IdpPage() {
    let idps: IdpRow[] = [];
    try {
        const res = await internal.get<AxiosResponse<{ idps: IdpRow[] }>>(
            `/idp`,
            await authCookieHeader()
        );
        idps = res.data.data.idps;
    } catch (e) {
        console.error(e);
    }
    const t = useTranslations();

    return (
        <>
            <SettingsSectionTitle
                title={t('idpManage')}
                description={t('idpManageDescription')}
            />
            <IdpTable idps={idps} />
        </>
    );
}
