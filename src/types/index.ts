import type { Category, Difficulty, BountyStatus } from "@/config/site";

/**
 * User profile type
 */
export interface User {
  id: string;
  walletAddress: string;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  reputation: number;
  completedBounties: number;
  totalEarned: number; // In USD equivalent
  createdAt: string;
  updatedAt: string;
}

/**
 * Bounty type
 */
export interface Bounty {
  id: string;
  contractBountyId: number | null; // Maps to smart contract bounty ID
  creatorId: string;
  creator?: User;
  title: string;
  description: string;
  category: Category;
  difficulty: Difficulty;
  reward: number; // In wei or smallest unit
  rewardToken: "USDC" | "ETH";
  status: BountyStatus;
  deadline: string | null;
  tags: string[];
  acceptanceCriteria: string;
  submissionCount: number;
  hunterId: string | null;
  hunter?: User;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

/**
 * Submission type
 */
export interface Submission {
  id: string;
  bountyId: string;
  bounty?: Bounty;
  hunterId: string;
  hunter?: User;
  description: string;
  proofLink: string | null;
  status: "pending" | "approved" | "rejected";
  feedback: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Notification type
 */
export interface Notification {
  id: string;
  userId: string;
  type:
    | "bounty_claimed"
    | "submission_received"
    | "submission_approved"
    | "submission_rejected"
    | "payment_received"
    | "bounty_expired";
  title: string;
  message: string;
  read: boolean;
  relatedBountyId: string | null;
  createdAt: string;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

/**
 * Pagination params
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Bounty filter options
 */
export interface BountyFilters {
  category?: Category;
  difficulty?: Difficulty;
  status?: BountyStatus;
  minReward?: number;
  maxReward?: number;
  search?: string;
  sortBy?: "newest" | "oldest" | "reward_high" | "reward_low";
}

