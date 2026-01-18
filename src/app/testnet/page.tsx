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
    Plus,
    Link2,
    Smartphone,
} from "lucide-react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { useMintUsdc } from "@/hooks/useMintUsdc";
import { useUsdcBalance } from "@/hooks/useContract";
import { useState, useCallback } from "react";
import Link from "next/link";
import { BASE_SEPOLIA_NETWORK, CHAINLIST_BASE_SEPOLIA_URL } from "@/config/wagmi";

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
    const { address, isConnected, connector } = useAccount();
    const chainId = useChainId();
    const { switchChain, isPending: isSwitching, error: switchError } = useSwitchChain();
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
    const [isAddingNetwork, setIsAddingNetwork] = useState(false);
    const [networkAddError, setNetworkAddError] = useState<string | null>(null);
    const [networkAddSuccess, setNetworkAddSuccess] = useState(false);

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

    const handleSwitchChain = useCallback(async () => {
        if (switchChain) {
            try {
                switchChain({ chainId: baseSepolia.id });
            } catch (error) {
                console.error("Failed to switch chain:", error);
            }
        }
    }, [switchChain]);

    // Add Base Sepolia network to wallet manually
    const handleAddNetwork = useCallback(async () => {
        setIsAddingNetwork(true);
        setNetworkAddError(null);
        setNetworkAddSuccess(false);

        try {
            // Get the provider from the connector
            const provider = await connector?.getProvider();
            
            if (!provider || typeof (provider as { request?: unknown }).request !== 'function') {
                throw new Error("No compatible wallet provider found. Please use a wallet that supports adding networks.");
            }

            // Try to switch to the chain first (in case it's already added)
            try {
                await (provider as { request: (args: { method: string; params: unknown[] }) => Promise<unknown> }).request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: BASE_SEPOLIA_NETWORK.chainId }],
                });
                setNetworkAddSuccess(true);
                return;
            } catch (switchError: unknown) {
                // If the error is because the chain hasn't been added, we'll add it
                const errorCode = (switchError as { code?: number })?.code;
                if (errorCode !== 4902 && errorCode !== -32603) {
                    throw switchError;
                }
            }

            // Add the chain
            await (provider as { request: (args: { method: string; params: unknown[] }) => Promise<unknown> }).request({
                method: 'wallet_addEthereumChain',
                params: [
                    {
                        chainId: BASE_SEPOLIA_NETWORK.chainId,
                        chainName: BASE_SEPOLIA_NETWORK.chainName,
                        nativeCurrency: BASE_SEPOLIA_NETWORK.nativeCurrency,
                        rpcUrls: BASE_SEPOLIA_NETWORK.rpcUrls,
                        blockExplorerUrls: BASE_SEPOLIA_NETWORK.blockExplorerUrls,
                    },
                ],
            });
            setNetworkAddSuccess(true);
        } catch (error: unknown) {
            console.error("Failed to add network:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            
            if (errorMessage.includes("User rejected") || errorMessage.includes("rejected")) {
                setNetworkAddError("You rejected the request. Please try again.");
            } else if (errorMessage.includes("already pending")) {
                setNetworkAddError("A request is already pending. Please check your wallet.");
            } else {
                setNetworkAddError("Failed to add network. Try using Chainlist instead.");
            }
        } finally {
            setIsAddingNetwork(false);
        }
    }, [connector]);

    const copyAddress = () => {
        if (address) {
            navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
                            <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 bg-bg-tertiary rounded-lg border border-border-default max-w-full overflow-hidden">
                                <div className="flex items-center gap-2 shrink-0">
                                    <div className="w-2 h-2 rounded-full bg-accent-green"></div>
                                    <span className="text-sm text-text-secondary whitespace-nowrap">Connected</span>
                                </div>
                                <div className="hidden sm:block h-4 w-px bg-border-default shrink-0"></div>
                                <button
                                    onClick={copyAddress}
                                    className="flex items-center gap-2 text-sm text-text-primary hover:text-accent-green transition-colors shrink-0"
                                >
                                    <span className="font-mono break-all">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                                    {copied ? (
                                        <Check className="w-4 h-4 text-accent-green shrink-0" />
                                    ) : (
                                        <Copy className="w-4 h-4 shrink-0" />
                                    )}
                                </button>
                                {!isBaseSepolia && (
                                    <>
                                        <div className="hidden sm:block h-4 w-px bg-border-default shrink-0"></div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <AlertCircle className="w-4 h-4 text-accent-orange shrink-0" />
                                            <span className="text-sm text-accent-orange whitespace-nowrap">Wrong Network</span>
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
                                                    <div className="space-y-3">
                                                        {/* Current Network Warning */}
                                                        <div className="p-4 bg-accent-orange/10 rounded-lg border border-accent-orange/30">
                                                            <div className="flex items-center gap-2 text-accent-orange mb-3">
                                                                <AlertCircle className="w-5 h-5" />
                                                                <span className="text-sm font-medium">Wrong Network Detected</span>
                                                            </div>
                                                            <p className="text-xs text-text-secondary mb-3">
                                                                You need to be on Base Sepolia testnet to use SnapBounty.
                                                            </p>
                                                            
                                                            {/* Switch Network Button */}
                                                            <Button 
                                                                onClick={handleSwitchChain} 
                                                                size="sm" 
                                                                className="w-full mb-2"
                                                                disabled={isSwitching}
                                                            >
                                                                {isSwitching ? "Switching..." : "Switch Network"}
                                                            </Button>

                                                            {switchError && (
                                                                <p className="text-xs text-red-400 mt-2">
                                                                    {switchError.message.includes("rejected") 
                                                                        ? "Request rejected. Please try again." 
                                                                        : "Network not found. Try adding it below."}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Add Network Manually */}
                                                        <div className="p-4 bg-bg-primary/50 rounded-lg border border-border-default">
                                                            <div className="flex items-center gap-2 text-text-primary mb-3">
                                                                <Plus className="w-4 h-4" />
                                                                <span className="text-sm font-medium">Add Base Sepolia to Wallet</span>
                                                            </div>
                                                            
                                                            <div className="space-y-2">
                                                                <Button 
                                                                    onClick={handleAddNetwork} 
                                                                    variant="secondary"
                                                                    size="sm" 
                                                                    className="w-full"
                                                                    disabled={isAddingNetwork}
                                                                >
                                                                    {isAddingNetwork ? "Adding Network..." : "Add Network Automatically"}
                                                                </Button>

                                                                <a
                                                                    href={CHAINLIST_BASE_SEPOLIA_URL}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center justify-center gap-2 w-full p-2 text-sm text-text-secondary hover:text-accent-green transition-colors"
                                                                >
                                                                    <Link2 className="w-4 h-4" />
                                                                    Or use Chainlist
                                                                    <ExternalLink className="w-3 h-3" />
                                                                </a>
                                                            </div>

                                                            {networkAddSuccess && (
                                                                <div className="mt-2 p-2 bg-accent-green/10 rounded border border-accent-green/30">
                                                                    <p className="text-xs text-accent-green flex items-center gap-1">
                                                                        <CheckCircle2 className="w-3 h-3" />
                                                                        Network added successfully!
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {networkAddError && (
                                                                <p className="text-xs text-red-400 mt-2">
                                                                    {networkAddError}
                                                                </p>
                                                            )}
                                                        </div>
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
                                                0xDc23e13811965c54C94275431398734Eb268e0e1
                                            </code>
                                            <a
                                                href="https://sepolia.basescan.org/address/0xDc23e13811965c54C94275431398734Eb268e0e1"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1 hover:bg-bg-tertiary rounded transition-colors shrink-0"
                                            >
                                                <ExternalLink className="w-4 h-4 text-text-tertiary hover:text-accent-green transition-colors" />
                                            </a>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-bg-primary/50 rounded-lg border border-border-default">
                                        <p className="text-xs text-text-tertiary mb-1">Mock USDC Contract</p>
                                        <div className="flex items-center justify-between gap-2">
                                            <code className="text-sm text-text-primary font-mono break-all">
                                                0xC821CdC016583D29e307E06bd96587cAC1757bB4
                                            </code>
                                            <a
                                                href="https://sepolia.basescan.org/address/0xC821CdC016583D29e307E06bd96587cAC1757bB4"
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

                    {/* Manual Network Setup Section */}
                    <section className="mb-16">
                        <Card variant="elevated">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Smartphone className="w-5 h-5 text-accent-blue" />
                                    Manual Network Setup for Mobile
                                </CardTitle>
                                <CardDescription>
                                    Having trouble switching networks? Follow these step-by-step guides to add Base Sepolia manually.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {/* Network Details */}
                                    <div className="p-4 bg-bg-primary/50 rounded-lg border border-border-default">
                                        <h4 className="font-semibold text-text-primary mb-3">Network Details</h4>
                                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-text-tertiary">Network Name</p>
                                                <p className="text-text-primary font-mono">Base Sepolia</p>
                                            </div>
                                            <div>
                                                <p className="text-text-tertiary">Chain ID</p>
                                                <div className="flex items-center gap-2">
                                                    <code className="text-text-primary font-mono">84532</code>
                                                    <button
                                                        onClick={() => copyToClipboard("84532")}
                                                        className="p-1 hover:bg-bg-tertiary rounded transition-colors"
                                                    >
                                                        {copied ? <Check className="w-3 h-3 text-accent-green" /> : <Copy className="w-3 h-3 text-text-tertiary" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-text-tertiary">RPC URL</p>
                                                <div className="flex items-center gap-2">
                                                    <code className="text-text-primary font-mono text-xs break-all">https://sepolia.base.org</code>
                                                    <button
                                                        onClick={() => copyToClipboard("https://sepolia.base.org")}
                                                        className="p-1 hover:bg-bg-tertiary rounded transition-colors shrink-0"
                                                    >
                                                        {copied ? <Check className="w-3 h-3 text-accent-green" /> : <Copy className="w-3 h-3 text-text-tertiary" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-text-tertiary">Block Explorer</p>
                                                <div className="flex items-center gap-2">
                                                    <code className="text-text-primary font-mono text-xs">sepolia.basescan.org</code>
                                                    <a
                                                        href="https://sepolia.basescan.org"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1 hover:bg-bg-tertiary rounded transition-colors"
                                                    >
                                                        <ExternalLink className="w-3 h-3 text-text-tertiary" />
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* MetaMask Setup */}
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-text-primary">MetaMask Setup</h4>
                                        <div className="space-y-3">
                                            <div className="flex gap-4">
                                                <div className="shrink-0 w-8 h-8 rounded-full bg-accent-green/20 flex items-center justify-center">
                                                    <span className="text-sm font-bold text-accent-green">1</span>
                                                </div>
                                                <div>
                                                    <h5 className="font-medium text-text-primary mb-1">Open MetaMask</h5>
                                                    <p className="text-sm text-text-secondary">
                                                        Tap the MetaMask icon on your mobile home screen to open the app.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-4">
                                                <div className="shrink-0 w-8 h-8 rounded-full bg-accent-green/20 flex items-center justify-center">
                                                    <span className="text-sm font-bold text-accent-green">2</span>
                                                </div>
                                                <div>
                                                    <h5 className="font-medium text-text-primary mb-1">Access Network Menu</h5>
                                                    <p className="text-sm text-text-secondary">
                                                        Tap the network dropdown at the top (it shows your current network).
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-4">
                                                <div className="shrink-0 w-8 h-8 rounded-full bg-accent-green/20 flex items-center justify-center">
                                                    <span className="text-sm font-bold text-accent-green">3</span>
                                                </div>
                                                <div>
                                                    <h5 className="font-medium text-text-primary mb-1">Add Network</h5>
                                                    <p className="text-sm text-text-secondary mb-2">
                                                        Scroll to the bottom and tap "Add Network".
                                                    </p>
                                                    <Button
                                                        onClick={() => copyToClipboard("Base Sepolia\n84532\nhttps://sepolia.base.org\nETH\nhttps://sepolia.basescan.org")}
                                                        variant="secondary"
                                                        size="sm"
                                                    >
                                                        Copy Network Details
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="flex gap-4">
                                                <div className="shrink-0 w-8 h-8 rounded-full bg-accent-green/20 flex items-center justify-center">
                                                    <span className="text-sm font-bold text-accent-green">4</span>
                                                </div>
                                                <div>
                                                    <h5 className="font-medium text-text-primary mb-1">Enter Details</h5>
                                                    <p className="text-sm text-text-secondary">
                                                        Fill in the network details and save. Switch to Base Sepolia when prompted.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Alternative Method */}
                                    <div className="p-4 bg-accent-blue/10 rounded-lg border border-accent-blue/30">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Link2 className="w-5 h-5 text-accent-blue" />
                                            <h4 className="font-semibold text-text-primary">Quick Setup Alternative</h4>
                                        </div>
                                        <p className="text-sm text-text-secondary mb-4">
                                            The easiest way to add Base Sepolia is through Chainlist - it handles everything for you.
                                        </p>
                                        <a
                                            href={CHAINLIST_BASE_SEPOLIA_URL}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-blue hover:bg-accent-blue/90 text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Add via Chainlist
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
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

