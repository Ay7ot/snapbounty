"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";

// Use reliable RPC endpoints
const BASE_SEPOLIA_RPC = "https://sepolia.base.org";
const BASE_MAINNET_RPC = "https://mainnet.base.org";

// Configure wagmi with RainbowKit and custom transports
export const config = getDefaultConfig({
  appName: "SnapBounty",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
  chains:
    process.env.NODE_ENV === "production" ? [base] : [baseSepolia, base],
  transports: {
    [baseSepolia.id]: http(BASE_SEPOLIA_RPC),
    [base.id]: http(BASE_MAINNET_RPC),
  },
  ssr: true,
});

// Export chains for use elsewhere
export const supportedChains = config.chains;

// Default chain based on environment
export const defaultChain =
  process.env.NODE_ENV === "production" ? base : baseSepolia;
