import { base, baseSepolia } from "wagmi/chains";

// Contract addresses by chain
export const ESCROW_ADDRESSES: Record<number, `0x${string}`> = {
  [baseSepolia.id]: "0x683E131dD6ee598E537ce155BFc0aAF0e19d0107", // Deployed on Base Sepolia
  [base.id]: "0x0000000000000000000000000000000000000000", // TODO: Deploy to mainnet
};

// USDC addresses by chain (using MockUSDC on testnet)
export const USDC_ADDRESSES: Record<number, `0x${string}`> = {
  [baseSepolia.id]: "0xC821CdC016583D29e307E06bd96587cAC1757bB4", // MockUSDC on Base Sepolia
  [base.id]: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Official USDC on Base
};

// Platform fee in basis points (500 = 5%)
export const PLATFORM_FEE_BPS = 500;

// Bounty status enum matching contract
export enum BountyStatus {
  Open = 0,
  Claimed = 1,
  Submitted = 2,
  Completed = 3,
  Cancelled = 4,
}

// Human-readable status labels
export const BOUNTY_STATUS_LABELS: Record<BountyStatus, string> = {
  [BountyStatus.Open]: "Open",
  [BountyStatus.Claimed]: "Claimed",
  [BountyStatus.Submitted]: "In Review",
  [BountyStatus.Completed]: "Completed",
  [BountyStatus.Cancelled]: "Cancelled",
};

// SnapBountyEscrow ABI (minimal for frontend use)
export const SNAP_BOUNTY_ESCROW_ABI = [
  // Read functions
  {
    inputs: [{ name: "bountyId", type: "uint256" }],
    name: "getBounty",
    outputs: [
      {
        components: [
          { name: "creator", type: "address" },
          { name: "hunter", type: "address" },
          { name: "reward", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "proofHash", type: "bytes32" },
          { name: "deadline", type: "uint256" },
          { name: "createdAt", type: "uint256" },
          { name: "claimedAt", type: "uint256" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "hunter", type: "address" }],
    name: "getActiveClaim",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "bountyId", type: "uint256" }],
    name: "isExpired",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "bountyCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "platformFeeBps",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "", type: "address" }],
    name: "activeClaim",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Write functions
  {
    inputs: [
      { name: "reward", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
    name: "createBounty",
    outputs: [{ name: "bountyId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "bountyId", type: "uint256" }],
    name: "claimBounty",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "bountyId", type: "uint256" },
      { name: "proofHash", type: "bytes32" },
    ],
    name: "submitWork",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "bountyId", type: "uint256" }],
    name: "approveWork",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "bountyId", type: "uint256" },
      { name: "reason", type: "string" },
    ],
    name: "rejectWork",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "bountyId", type: "uint256" }],
    name: "cancelBounty",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "bountyId", type: "uint256" }],
    name: "releaseClaim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "bountyId", type: "uint256" },
      { indexed: true, name: "creator", type: "address" },
      { indexed: false, name: "reward", type: "uint256" },
      { indexed: false, name: "deadline", type: "uint256" },
    ],
    name: "BountyCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "bountyId", type: "uint256" },
      { indexed: true, name: "hunter", type: "address" },
      { indexed: false, name: "claimedAt", type: "uint256" },
    ],
    name: "BountyClaimed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "bountyId", type: "uint256" },
      { indexed: true, name: "hunter", type: "address" },
      { indexed: false, name: "proofHash", type: "bytes32" },
    ],
    name: "WorkSubmitted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "bountyId", type: "uint256" },
      { indexed: true, name: "hunter", type: "address" },
      { indexed: false, name: "payout", type: "uint256" },
      { indexed: false, name: "fee", type: "uint256" },
    ],
    name: "WorkApproved",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "bountyId", type: "uint256" },
      { indexed: true, name: "hunter", type: "address" },
      { indexed: false, name: "reason", type: "string" },
    ],
    name: "WorkRejected",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "bountyId", type: "uint256" },
      { indexed: true, name: "creator", type: "address" },
      { indexed: false, name: "refundAmount", type: "uint256" },
    ],
    name: "BountyCancelled",
    type: "event",
  },
] as const;

// ERC20 ABI (minimal for USDC interactions)
export const ERC20_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Contract type for bounty data
export interface ContractBounty {
  creator: `0x${string}`;
  hunter: `0x${string}`;
  reward: bigint;
  status: number;
  proofHash: `0x${string}`;
  deadline: bigint;
  createdAt: bigint;
  claimedAt: bigint;
}


