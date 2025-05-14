import { Button } from "@app/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@app/components/ui/card";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default async function ResourceNotFound() {
    const t = useTranslations();

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="text-center text-2xl font-bold">
                    {t('resourceNotFound')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {t('resourceNotFoundDescription')}
                <div className="text-center mt-4">
                    <Button>
                        <Link href="/">{t('goHome')}</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
