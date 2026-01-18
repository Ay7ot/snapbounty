import { base, baseSepolia } from "wagmi/chains";

// Contract addresses by chain
export const ESCROW_ADDRESSES: Record<number, `0x${string}`> = {
  [baseSepolia.id]: "0xDc23e13811965c54C94275431398734Eb268e0e1", // Deployed on Base Sepolia (v4 with MockUSDC)
  [base.id]: "0x0000000000000000000000000000000000000000", // TODO: Deploy to mainnet
};

// USDC addresses by chain (using MockUSDC on testnet)
export const USDC_ADDRESSES: Record<number, `0x${string}`> = {
  [baseSepolia.id]: "0xC821CdC016583D29e307E06bd96587cAC1757bB4", // MockUSDC on Base Sepolia
  [base.id]: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Official USDC on Base
};

// Platform fee in basis points (500 = 5%)
export const PLATFORM_FEE_BPS = 500;

// Maximum time a hunter can hold a claim (30 days in seconds)
export const MAX_CLAIM_DURATION = 30 * 24 * 60 * 60; // 2,592,000 seconds

// Dispute fee (1 USDC)
export const DISPUTE_FEE = 1_000_000; // 1 USDC in 6 decimals

// Maximum rejections before auto-escalation
export const MAX_REJECTIONS = 3;

// Dispute resolution window (14 days in seconds)
export const DISPUTE_RESOLUTION_WINDOW = 14 * 24 * 60 * 60;

// Bounty status enum matching contract
export enum BountyStatus {
  Open = 0,
  Claimed = 1,
  Submitted = 2,
  Completed = 3,
  Cancelled = 4,
  Disputed = 5,
}

// Dispute resolution enum
export enum DisputeResolution {
  Pending = 0,
  HunterWins = 1,
  CreatorWins = 2,
  Split = 3,
}

// Human-readable status labels
export const BOUNTY_STATUS_LABELS: Record<BountyStatus, string> = {
  [BountyStatus.Open]: "Open",
  [BountyStatus.Claimed]: "Claimed",
  [BountyStatus.Submitted]: "In Review",
  [BountyStatus.Completed]: "Completed",
  [BountyStatus.Cancelled]: "Cancelled",
  [BountyStatus.Disputed]: "In Dispute",
};

// Human-readable dispute resolution labels
export const DISPUTE_RESOLUTION_LABELS: Record<DisputeResolution, string> = {
  [DisputeResolution.Pending]: "Pending",
  [DisputeResolution.HunterWins]: "Hunter Won",
  [DisputeResolution.CreatorWins]: "Creator Won",
  [DisputeResolution.Split]: "Split 50/50",
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
          { name: "rejectionCount", type: "uint8" },
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
    inputs: [{ name: "bountyId", type: "uint256" }],
    name: "canBeCancelled",
    outputs: [
      { name: "canCancel", type: "bool" },
      { name: "reason", type: "string" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "bountyId", type: "uint256" }],
    name: "getClaimExpirationTime",
    outputs: [{ name: "expiresAt", type: "uint256" }],
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
  // Dispute functions
  {
    inputs: [
      { name: "bountyId", type: "uint256" },
      { name: "evidenceHash", type: "bytes32" },
    ],
    name: "openDispute",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "bountyId", type: "uint256" },
      { name: "evidenceHash", type: "bytes32" },
    ],
    name: "submitDisputeEvidence",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "bountyId", type: "uint256" },
      { name: "resolution", type: "uint8" },
    ],
    name: "resolveDispute",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "bountyId", type: "uint256" }],
    name: "autoResolveDispute",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Dispute view functions
  {
    inputs: [{ name: "bountyId", type: "uint256" }],
    name: "getDispute",
    outputs: [
      {
        components: [
          { name: "bountyId", type: "uint256" },
          { name: "initiator", type: "address" },
          { name: "hunterEvidence", type: "bytes32" },
          { name: "creatorEvidence", type: "bytes32" },
          { name: "openedAt", type: "uint256" },
          { name: "disputeFee", type: "uint256" },
          { name: "resolution", type: "uint8" },
          { name: "resolved", type: "bool" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "bountyId", type: "uint256" }],
    name: "canOpenDispute",
    outputs: [
      { name: "canDispute", type: "bool" },
      { name: "reason", type: "string" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "disputeFee",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "arbiter",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
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
  // Dispute events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "bountyId", type: "uint256" },
      { indexed: true, name: "hunter", type: "address" },
      { indexed: false, name: "evidenceHash", type: "bytes32" },
      { indexed: false, name: "disputeFee", type: "uint256" },
    ],
    name: "DisputeOpened",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "bountyId", type: "uint256" },
      { indexed: true, name: "submitter", type: "address" },
      { indexed: false, name: "evidenceHash", type: "bytes32" },
    ],
    name: "DisputeEvidenceSubmitted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "bountyId", type: "uint256" },
      { indexed: false, name: "resolution", type: "uint8" },
      { indexed: false, name: "hunterPayout", type: "uint256" },
      { indexed: false, name: "creatorRefund", type: "uint256" },
    ],
    name: "DisputeResolved",
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
  rejectionCount: number;
}

// Contract type for dispute data
export interface ContractDispute {
  bountyId: bigint;
  initiator: `0x${string}`;
  hunterEvidence: `0x${string}`;
  creatorEvidence: `0x${string}`;
  openedAt: bigint;
  disputeFee: bigint;
  resolution: number;
  resolved: boolean;
}


