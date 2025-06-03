import { useState } from "react";
import { Button } from "@app/components/ui/button";
import { MinusCircle, PlusCircle } from "lucide-react";
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

type SitePriceCalculatorProps = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    mode: "license" | "additional-sites";
};

export function SitePriceCalculator({
    isOpen,
    onOpenChange,
    mode
}: SitePriceCalculatorProps) {
    const [siteCount, setSiteCount] = useState(3);
    const pricePerSite = 5;
    const licenseFlatRate = 125;

    const incrementSites = () => {
        setSiteCount((prev) => prev + 1);
    };

    const decrementSites = () => {
        setSiteCount((prev) => (prev > 1 ? prev - 1 : 1));
    };

    function continueToPayment() {
        if (mode === "license") {
            // open in new tab
            window.open(
                `https://payment.fossorial.io/buy/dab98d3d-9976-49b1-9e55-1580059d833f?quantity=${siteCount}`,
                "_blank"
            );
        } else {
            window.open(
                `https://payment.fossorial.io/buy/2b881c36-ea5d-4c11-8652-9be6810a054f?quantity=${siteCount}`,
                "_blank"
            );
        }
    }

    const totalCost =
        mode === "license"
            ? licenseFlatRate + siteCount * pricePerSite
            : siteCount * pricePerSite;

    return (
        <Credenza open={isOpen} onOpenChange={onOpenChange}>
            <CredenzaContent>
                <CredenzaHeader>
                    <CredenzaTitle>
                        {mode === "license"
                            ? "Purchase License"
                            : "Purchase Additional Sites"}
                    </CredenzaTitle>
                    <CredenzaDescription>
                        Choose how many sites you want to{" "}
                        {mode === "license"
                            ? "purchase a license for. You can always add more sites later."
                            : "add to your existing license."}
                    </CredenzaDescription>
                </CredenzaHeader>
                <CredenzaBody>
                    <div className="space-y-6">
                        <div className="flex flex-col items-center space-y-4">
                            <div className="text-sm font-medium text-muted-foreground">
                                Number of Sites
                            </div>
                            <div className="flex items-center space-x-4">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={decrementSites}
                                    disabled={siteCount <= 1}
                                    aria-label="Decrease site count"
                                >
                                    <MinusCircle className="h-5 w-5" />
                                </Button>
                                <span className="text-3xl w-12 text-center">
                                    {siteCount}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={incrementSites}
                                    aria-label="Increase site count"
                                >
                                    <PlusCircle className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <p className="text-muted-foreground text-sm mt-2 text-center">
                                For the most up-to-date pricing and discounts,
                                please visit the{" "}
                                <a
                                    href="https://docs.fossorial.io/pricing"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline"
                                >
                                    pricing page
                                </a>
                                .
                            </p>
                        </div>
                    </div>
                </CredenzaBody>
                <CredenzaFooter>
                    <CredenzaClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </CredenzaClose>
                    <Button onClick={continueToPayment}>
                        See Purchase Portal
                    </Button>
                </CredenzaFooter>
            </CredenzaContent>
        </Credenza>
    );
}
