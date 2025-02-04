"use client";

import { Button } from "@app/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@app/components/ui/card";
import Link from "next/link";

export default function ResourceAccessDenied() {
    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="text-center text-2xl font-bold">
                    Access Denied
                </CardTitle>
            </CardHeader>
            <CardContent>
                You're not allowed to access this resource. If this is a mistake,
                please contact the administrator.
                <div className="text-center mt-4">
                    <Button>
                        <Link href="/">Go Home</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
