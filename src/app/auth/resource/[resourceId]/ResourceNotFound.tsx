import { Button } from "@app/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@app/components/ui/card";
import Link from "next/link";

export default async function ResourceNotFound() {
    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="text-center text-2xl font-bold">
                    Resource Not Found
                </CardTitle>
            </CardHeader>
            <CardContent>
                The resource you're trying to access does not exist.
                <div className="text-center mt-4">
                    <Button>
                        <Link href="/">Go Home</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
