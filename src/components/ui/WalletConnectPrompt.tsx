"use client";

import { AlertCircle } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Card, CardContent } from "@/components/ui/Card";

export function WalletConnectPrompt({
    title = "Connect Your Wallet",
    description = "You need to connect your wallet to access this feature.",
}: {
    title?: string;
    description?: string;
}) {
    return (
        <Card>
            <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                <AlertCircle className="h-12 w-12 text-text-tertiary mb-4" />
                <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
                <p className="mt-2 mb-6 text-sm text-text-secondary max-w-sm">
                    {description}
                </p>
                <ConnectButton showBalance={false} />
            </CardContent>
        </Card>
    );
}

