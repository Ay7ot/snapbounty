"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";

// Use reliable RPC endpoints
const BASE_SEPOLIA_RPC = "https://sepolia.base.org";
const BASE_MAINNET_RPC = "https://mainnet.base.org";

// Check if we're in testnet mode (default to true for now since contracts are on Base Sepolia)
// Set NEXT_PUBLIC_USE_MAINNET=true when ready for mainnet
const isTestnetMode = process.env.NEXT_PUBLIC_USE_MAINNET !== "true";

// Configure wagmi with RainbowKit and custom transports
// Always include both chains so users can switch between them
export const config = getDefaultConfig({
  appName: "SnapBounty",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
  chains: isTestnetMode ? [baseSepolia, base] : [base, baseSepolia],
  transports: {
    [baseSepolia.id]: http(BASE_SEPOLIA_RPC),
    [base.id]: http(BASE_MAINNET_RPC),
  },
  ssr: true,
});

// Export chains for use elsewhere
export const supportedChains = config.chains;

// Default chain based on mode
export const defaultChain = isTestnetMode ? baseSepolia : base;

// Base Sepolia network details for manual wallet addition
export const BASE_SEPOLIA_NETWORK = {
  chainId: "0x14A34", // 84532 in hex
  chainIdDecimal: 84532,
  chainName: "Base Sepolia",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: [BASE_SEPOLIA_RPC],
  blockExplorerUrls: ["https://sepolia.basescan.org"],
};

// Chainlist URL for Base Sepolia
export const CHAINLIST_BASE_SEPOLIA_URL = "https://chainlist.org/chain/84532";
