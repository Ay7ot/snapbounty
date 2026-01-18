import { Metadata } from "next";
import TestnetContent from "./TestnetContent";

export const metadata: Metadata = {
    title: "Testnet Guide",
    description:
        "Get started with SnapBounty on Base Sepolia testnet. Learn how to connect your wallet, get test tokens, and start testing the platform.",
    openGraph: {
        title: "Testnet Guide | SnapBounty",
        description:
            "Get started with SnapBounty on Base Sepolia testnet. Learn how to connect your wallet, get test tokens, and start testing.",
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function TestnetPage() {
    return <TestnetContent />;
}
