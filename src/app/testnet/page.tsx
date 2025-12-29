"use client";

import { Header, Footer } from "@/components/layout";
import { Button, Badge, Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui";
import { TransactionButton } from "@/components/tx";
import {
    Wallet,
    Network,
    Coins,
    ExternalLink,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Copy,
    Check,
    Info,
} from "lucide-react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { useMintUsdc } from "@/hooks/useMintUsdc";
import { useUsdcBalance } from "@/hooks/useContract";
import { useState } from "react";
import Link from "next/link";

const steps = [
    {
        step: "01",
        title: "Connect Your Wallet",
        description: "Click the Connect Wallet button in the header to connect MetaMask, WalletConnect, or another supported wallet.",
        icon: Wallet,
    },
    {
        step: "02",
        title: "Switch to Base Sepolia",
        description: "Make sure you're connected to Base Sepolia testnet. If not, we'll help you switch.",
        icon: Network,
    },
    {
        step: "03",
        title: "Get Test ETH",
        description: "You'll need test ETH for gas fees. Use one of the faucets below to get free test ETH.",
        icon: Coins,
    },
    {
        step: "04",
        title: "Mint Test USDC",
        description: "Click the button below to mint 10,000 test USDC tokens directly to your wallet.",
        icon: Coins,
    },
];

const faucets = [
    {
        name: "Base Sepolia Faucet",
        url: "https://www.coinbase.com/faucets/base-ethereum-goerli-faucet",
        description: "Official Base Sepolia faucet",
    },
    {
        name: "QuickNode Faucet",
        url: "https://faucet.quicknode.com/base/sepolia",
        description: "QuickNode Base Sepolia faucet",
    },
    {
        name: "Alchemy Faucet",
        url: "https://sepoliafaucet.com/",
        description: "Alchemy Sepolia faucet (works with Base Sepolia)",
    },
];

export default function TestnetGuidePage() {
    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();
    const {
        mint,
        isPending: isMinting,
        isConfirming: isConfirmingMint,
        isSuccess: mintSuccess,
        error: mintError,
        hash: mintHash,
        reset: resetMint,
    } = useMintUsdc();
    const { formattedBalance, refetch: refetchBalance } = useUsdcBalance(address);
    const [copied, setCopied] = useState(false);

    const isBaseSepolia = chainId === baseSepolia.id;

    const handleMint = async () => {
        await mint(10000);
    };

    const handleMintSuccess = async () => {
        // Refetch balance after a short delay to ensure blockchain state is updated
        setTimeout(() => {
            refetchBalance();
        }, 1000);
    };

    const handleSwitchChain = () => {
        if (switchChain) {
            switchChain({ chainId: baseSepolia.id });
        }
    };

    const copyAddress = () => {
        if (address) {
            navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1 pt-20 pb-24">
                <div className="container-custom">
                    {/* Hero Section */}
                    <section className="text-center mb-16">
                        <Badge variant="active" className="mb-6 px-4 py-1.5 text-sm">
                            <span className="relative flex h-2 w-2 mr-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-green"></span>
                            </span>
                            Testnet Guide
                        </Badge>

                        <h1 className="heading-display text-text-primary mb-6">
                            Test <span className="text-gradient-green">SnapBounty</span> on Base Sepolia
                        </h1>

                        <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-8 leading-relaxed">
                            Follow this guide to connect your wallet, get test tokens, and start testing the SnapBounty platform.
                            All transactions happen on Base Sepolia testnet - no real money required!
                        </p>

                        {isConnected && (
                            <div className="mt-8 inline-flex items-center gap-4 px-6 py-3 bg-bg-tertiary rounded-lg border border-border-default">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-accent-green"></div>
                                    <span className="text-sm text-text-secondary">Connected</span>
                                </div>
                                <div className="h-4 w-px bg-border-default"></div>
                                <button
                                    onClick={copyAddress}
                                    className="flex items-center gap-2 text-sm text-text-primary hover:text-accent-green transition-colors"
                                >
                                    {address?.slice(0, 6)}...{address?.slice(-4)}
                                    {copied ? (
                                        <Check className="w-4 h-4 text-accent-green" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                </button>
                                {!isBaseSepolia && (
                                    <>
                                        <div className="h-4 w-px bg-border-default"></div>
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-accent-orange" />
                                            <span className="text-sm text-accent-orange">Wrong Network</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </section>

                    {/* Steps Section */}
                    <section className="mb-16">
                        <div className="grid md:grid-cols-2 gap-6">
                            {steps.map((item, index) => (
                                <Card key={item.step} variant="glass" hoverable={false}>
                                    <CardHeader>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-12 h-12 rounded-lg bg-bg-tertiary border border-border-default flex items-center justify-center">
                                                <span className="text-lg font-bold text-text-secondary">{item.step}</span>
                                            </div>
                                            <div className="p-2 rounded-lg bg-accent-green/10">
                                                <item.icon className="h-5 w-5 text-accent-green" />
                                            </div>
                                        </div>
                                        <CardTitle>{item.title}</CardTitle>
                                        <CardDescription>{item.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {index === 0 && !isConnected && (
                                            <div className="mt-4 p-4 bg-bg-primary/50 rounded-lg border border-border-default">
                                                <p className="text-sm text-text-secondary mb-3">Connect your wallet to get started</p>
                                                <p className="text-xs text-text-tertiary">
                                                    Click the Connect Wallet button in the header above
                                                </p>
                                            </div>
                                        )}
                                        {index === 1 && isConnected && (
                                            <div className="mt-4">
                                                {isBaseSepolia ? (
                                                    <div className="p-4 bg-accent-green/10 rounded-lg border border-accent-green/30">
                                                        <div className="flex items-center gap-2 text-accent-green">
                                                            <CheckCircle2 className="w-5 h-5" />
                                                            <span className="text-sm font-medium">Connected to Base Sepolia</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="p-4 bg-accent-orange/10 rounded-lg border border-accent-orange/30">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-2 text-accent-orange">
                                                                <AlertCircle className="w-5 h-5" />
                                                                <span className="text-sm font-medium">Switch to Base Sepolia</span>
                                                            </div>
                                                        </div>
                                                        <Button onClick={handleSwitchChain} size="sm" className="w-full">
                                                            Switch Network
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {index === 2 && (
                                            <div className="mt-4 space-y-2">
                                                {faucets.map((faucet) => (
                                                    <a
                                                        key={faucet.name}
                                                        href={faucet.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-between p-3 bg-bg-primary/50 rounded-lg border border-border-default hover:border-accent-green/30 transition-colors group"
                                                    >
                                                        <div>
                                                            <p className="text-sm font-medium text-text-primary">{faucet.name}</p>
                                                            <p className="text-xs text-text-tertiary">{faucet.description}</p>
                                                        </div>
                                                        <ExternalLink className="w-4 h-4 text-text-tertiary group-hover:text-accent-green transition-colors" />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                        {index === 3 && isConnected && isBaseSepolia && (
                                            <div className="mt-4">
                                                <div className="p-4 bg-bg-primary/50 rounded-lg border border-border-default mb-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div>
                                                            <p className="text-sm font-medium text-text-primary">Your USDC Balance</p>
                                                            <p className="text-2xl font-bold text-accent-green mt-1">{formattedBalance} USDC</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <TransactionButton
                                                    onClick={handleMint}
                                                    isPending={isMinting}
                                                    isConfirming={isConfirmingMint}
                                                    isSuccess={mintSuccess}
                                                    error={mintError}
                                                    hash={mintHash}
                                                    onSuccess={handleMintSuccess}
                                                    onReset={resetMint}
                                                    pendingText="Confirm in wallet..."
                                                    confirmingText="Minting USDC..."
                                                    successMessage="Successfully minted 10,000 test USDC!"
                                                    size="lg"
                                                >
                                                    Mint 10,000 Test USDC
                                                </TransactionButton>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>

                    {/* Testing Guide Section */}
                    <section className="mb-16">
                        <Card variant="elevated">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Info className="w-5 h-5 text-accent-blue" />
                                    How to Test SnapBounty
                                </CardTitle>
                                <CardDescription>
                                    Once you have test ETH and USDC, follow these steps to test the platform
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="shrink-0 w-8 h-8 rounded-full bg-accent-green/20 flex items-center justify-center">
                                            <span className="text-sm font-bold text-accent-green">1</span>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-text-primary mb-1">Create a Bounty</h4>
                                            <p className="text-sm text-text-secondary mb-2">
                                                Go to the{" "}
                                                <Link href="/create" className="text-accent-green hover:underline">
                                                    Post Bounty
                                                </Link>{" "}
                                                page and create a test bounty. You'll need to approve USDC spending first.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="shrink-0 w-8 h-8 rounded-full bg-accent-green/20 flex items-center justify-center">
                                            <span className="text-sm font-bold text-accent-green">2</span>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-text-primary mb-1">Claim a Bounty</h4>
                                            <p className="text-sm text-text-secondary mb-2">
                                                Browse available bounties on the{" "}
                                                <Link href="/explore" className="text-accent-green hover:underline">
                                                    Explore
                                                </Link>{" "}
                                                page and claim one that interests you.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="shrink-0 w-8 h-8 rounded-full bg-accent-green/20 flex items-center justify-center">
                                            <span className="text-sm font-bold text-accent-green">3</span>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-text-primary mb-1">Submit Work</h4>
                                            <p className="text-sm text-text-secondary mb-2">
                                                Complete the bounty task and submit your work. You can submit a proof URL or hash.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="shrink-0 w-8 h-8 rounded-full bg-accent-green/20 flex items-center justify-center">
                                            <span className="text-sm font-bold text-accent-green">4</span>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-text-primary mb-1">Approve or Reject</h4>
                                            <p className="text-sm text-text-secondary mb-2">
                                                As the bounty creator, review the submission and approve or reject it. If approved,
                                                the hunter receives the reward minus the platform fee (5%).
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Contract Info Section */}
                    <section>
                        <Card variant="outline">
                            <CardHeader>
                                <CardTitle>Contract Information</CardTitle>
                                <CardDescription>Smart contract addresses on Base Sepolia testnet</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="p-4 bg-bg-primary/50 rounded-lg border border-border-default">
                                        <p className="text-xs text-text-tertiary mb-1">Escrow Contract</p>
                                        <div className="flex items-center justify-between gap-2">
                                            <code className="text-sm text-text-primary font-mono break-all">
                                                0x683E131dD6ee598E537ce155BFc0aAF0e19d0107
                                            </code>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText("0x683E131dD6ee598E537ce155BFc0aAF0e19d0107");
                                                    setCopied(true);
                                                    setTimeout(() => setCopied(false), 2000);
                                                }}
                                                className="p-1 hover:bg-bg-tertiary rounded transition-colors shrink-0"
                                            >
                                                {copied ? (
                                                    <Check className="w-4 h-4 text-accent-green" />
                                                ) : (
                                                    <Copy className="w-4 h-4 text-text-tertiary" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-bg-primary/50 rounded-lg border border-border-default">
                                        <p className="text-xs text-text-tertiary mb-1">Mock USDC Contract</p>
                                        <div className="flex items-center justify-between gap-2">
                                            <code className="text-sm text-text-primary font-mono break-all">
                                                0xC821CdC016583D29e307E06bd96587cAC1757bB4
                                            </code>
                                            <a
                                                href={`https://sepolia.basescan.org/address/0xC821CdC016583D29e307E06bd96587cAC1757bB4`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1 hover:bg-bg-tertiary rounded transition-colors shrink-0"
                                            >
                                                <ExternalLink className="w-4 h-4 text-text-tertiary hover:text-accent-green transition-colors" />
                                            </a>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-bg-primary/50 rounded-lg border border-border-default">
                                        <p className="text-xs text-text-tertiary mb-1">Network</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-text-primary font-medium">Base Sepolia</span>
                                            <Badge variant="active">Testnet</Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* CTA Section */}
                    <section className="mt-16">
                        <div className="relative rounded-lg overflow-hidden">
                            <div className="absolute inset-0 bg-linear-to-r from-accent-purple/20 to-accent-green/20 opacity-30" />
                            <div className="absolute inset-0 bg-bg-elevated/40 backdrop-blur-sm" />
                            <div className="relative z-10 px-6 py-12 text-center">
                                <h2 className="heading-2 text-white mb-4">Ready to Start Testing?</h2>
                                <p className="text-lg text-gray-300 max-w-xl mx-auto mb-8">
                                    Make sure you have test ETH for gas and test USDC for bounties, then start exploring!
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link href="/explore">
                                        <Button size="lg" className="min-w-[160px]">
                                            Explore Bounties
                                            <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                    <Link href="/create">
                                        <Button variant="secondary" size="lg" className="min-w-[160px]">
                                            Create Bounty
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}

