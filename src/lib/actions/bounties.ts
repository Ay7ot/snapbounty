"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import type { Bounty, BountyFilters, PaginatedResponse } from "@/types";

/**
 * Get bounties with filters and pagination
 */
export async function getBounties(
  filters: BountyFilters = {},
  page: number = 1,
  limit: number = 12
): Promise<PaginatedResponse<Bounty>> {
  const supabase = await createClient();

  let query = supabase
    .from("bounties")
    .select(
      `
      *,
      creator:users!bounties_creator_id_fkey(id, wallet_address, username, avatar_url, reputation),
      hunter:users!bounties_hunter_id_fkey(id, wallet_address, username, avatar_url)
    `,
      { count: "exact" }
    );

  // Apply filters
  if (filters.category) {
    query = query.eq("category", filters.category);
  }

  if (filters.difficulty) {
    query = query.eq("difficulty", filters.difficulty);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.minReward) {
    query = query.gte("reward", filters.minReward);
  }

  if (filters.maxReward) {
    query = query.lte("reward", filters.maxReward);
  }

  if (filters.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  // Apply sorting
  switch (filters.sortBy) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "reward_high":
      query = query.order("reward", { ascending: false });
      break;
    case "reward_low":
      query = query.order("reward", { ascending: true });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching bounties:", error);
    throw new Error("Failed to fetch bounties");
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  // Transform data to match Bounty type
  const bounties: Bounty[] = (data || []).map((b) => ({
    id: b.id,
    contractBountyId: b.contract_bounty_id ?? null,
    creatorId: b.creator_id,
    creator: b.creator
      ? {
        id: b.creator.id,
        walletAddress: b.creator.wallet_address,
        username: b.creator.username,
        avatarUrl: b.creator.avatar_url,
        bio: null,
        reputation: b.creator.reputation,
        completedBounties: 0,
        totalEarned: 0,
        createdAt: "",
        updatedAt: "",
      }
      : undefined,
    title: b.title,
    description: b.description,
    category: b.category,
    difficulty: b.difficulty,
    reward: Number(b.reward),
    rewardToken: b.reward_token,
    status: b.status,
    deadline: b.deadline,
    tags: b.tags || [],
    acceptanceCriteria: b.acceptance_criteria,
    submissionCount: b.submission_count,
    hunterId: b.hunter_id,
    hunter: b.hunter
      ? {
        id: b.hunter.id,
        walletAddress: b.hunter.wallet_address,
        username: b.hunter.username,
        avatarUrl: b.hunter.avatar_url,
        bio: null,
        reputation: 0,
        completedBounties: 0,
        totalEarned: 0,
        createdAt: "",
        updatedAt: "",
      }
      : undefined,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
    completedAt: b.completed_at,
  }));

  return {
    data: bounties,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

/**
 * Get a single bounty by ID
 */
export async function getBountyById(id: string): Promise<Bounty | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bounties")
    .select(
      `
      *,
      creator:users!bounties_creator_id_fkey(id, wallet_address, username, avatar_url, reputation),
      hunter:users!bounties_hunter_id_fkey(id, wallet_address, username, avatar_url)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching bounty:", error);
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    contractBountyId: data.contract_bounty_id ?? null,
    creatorId: data.creator_id,
    creator: data.creator
      ? {
        id: data.creator.id,
        walletAddress: data.creator.wallet_address,
        username: data.creator.username,
        avatarUrl: data.creator.avatar_url,
        bio: null,
        reputation: data.creator.reputation,
        completedBounties: 0,
        totalEarned: 0,
        createdAt: "",
        updatedAt: "",
      }
      : undefined,
    title: data.title,
    description: data.description,
    category: data.category,
    difficulty: data.difficulty,
    reward: Number(data.reward),
    rewardToken: data.reward_token,
    status: data.status,
    deadline: data.deadline,
    tags: data.tags || [],
    acceptanceCriteria: data.acceptance_criteria,
    submissionCount: data.submission_count,
    hunterId: data.hunter_id,
    hunter: data.hunter
      ? {
        id: data.hunter.id,
        walletAddress: data.hunter.wallet_address,
        username: data.hunter.username,
        avatarUrl: data.hunter.avatar_url,
        bio: null,
        reputation: 0,
        completedBounties: 0,
        totalEarned: 0,
        createdAt: "",
        updatedAt: "",
      }
      : undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    completedAt: data.completed_at,
  };
}

/**
 * Get bounties created by a specific user
 */
export async function getBountiesByCreator(
  walletAddress: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResponse<Bounty>> {
  const supabase = await createClient();

  // First get user ID
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("wallet_address", walletAddress.toLowerCase())
    .single();

  if (!user) {
    return {
      data: [],
      pagination: { page, limit, total: 0, totalPages: 0, hasMore: false },
    };
  }

  return getBounties({ status: undefined }, page, limit);
}

/**
 * Get featured bounties for homepage
 */
export async function getFeaturedBounties(limit: number = 4): Promise<Bounty[]> {
  const result = await getBounties({ status: "open", sortBy: "reward_high" }, 1, limit);
  return result.data;
}

/**
 * Update bounty status in Supabase
 * Uses admin client to bypass RLS
 */
export async function updateBountyStatus(
  bountyId: string,
  status: "open" | "claimed" | "submitted" | "completed" | "cancelled" | "disputed",
  hunterId?: string | null
): Promise<boolean> {
  try {
    const supabase = getAdminClient();

    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (hunterId !== undefined) {
      updates.hunter_id = hunterId;
    }

    if (status === "completed") {
      updates.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("bounties")
      .update(updates)
      .eq("id", bountyId)
      .select();

    if (error) {
      console.error("Error updating bounty status:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("updateBountyStatus exception:", err);
    return false;
  }
}

/**
 * Update bounty status by contract bounty ID
 * Uses admin client to bypass RLS
 */
/**
 * Create a bounty in Supabase
 * Uses admin client to bypass RLS
 */
export async function createBountyRecord(data: {
  creatorId: string;
  contractBountyId: number | null;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  reward: number;
  deadline: string | null;
  acceptanceCriteria: string;
  tags: string[];
}): Promise<{ id: string } | null> {
  try {
    const supabase = getAdminClient();

    const { data: bounty, error } = await supabase
      .from("bounties")
      .insert({
        creator_id: data.creatorId,
        contract_bounty_id: data.contractBountyId,
        title: data.title,
        description: data.description,
        category: data.category,
        difficulty: data.difficulty,
        reward: data.reward,
        deadline: data.deadline,
        acceptance_criteria: data.acceptanceCriteria,
        tags: data.tags,
        status: "open",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating bounty record:", error);
      return null;
    }

    return { id: bounty.id };
  } catch (err) {
    console.error("createBountyRecord exception:", err);
    return null;
  }
}

/**
 * Get bounty by contract bounty ID
 */
export async function getBountyByContractId(contractBountyId: number): Promise<Bounty | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bounties")
    .select(
      `
      *,
      creator:users!bounties_creator_id_fkey(id, wallet_address, username, avatar_url, reputation),
      hunter:users!bounties_hunter_id_fkey(id, wallet_address, username, avatar_url)
    `
    )
    .eq("contract_bounty_id", contractBountyId)
    .single();

  if (error) {
    console.error("Error fetching bounty by contract ID:", error);
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    contractBountyId: data.contract_bounty_id ?? null,
    creatorId: data.creator_id,
    creator: data.creator
      ? {
        id: data.creator.id,
        walletAddress: data.creator.wallet_address,
        username: data.creator.username,
        avatarUrl: data.creator.avatar_url,
        bio: null,
        reputation: data.creator.reputation,
        completedBounties: 0,
        totalEarned: 0,
        createdAt: "",
        updatedAt: "",
      }
      : undefined,
    title: data.title,
    description: data.description,
    category: data.category,
    difficulty: data.difficulty,
    reward: Number(data.reward),
    rewardToken: data.reward_token,
    status: data.status,
    deadline: data.deadline,
    tags: data.tags || [],
    acceptanceCriteria: data.acceptance_criteria,
    submissionCount: data.submission_count,
    hunterId: data.hunter_id,
    hunter: data.hunter
      ? {
        id: data.hunter.id,
        walletAddress: data.hunter.wallet_address,
        username: data.hunter.username,
        avatarUrl: data.hunter.avatar_url,
        bio: null,
        reputation: 0,
        completedBounties: 0,
        totalEarned: 0,
        createdAt: "",
        updatedAt: "",
      }
      : undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    completedAt: data.completed_at,
  };
}

export async function updateBountyStatusByContractId(
  contractBountyId: number,
  status: "open" | "claimed" | "submitted" | "completed" | "cancelled" | "disputed",
  hunterAddress?: string | null
): Promise<boolean> {
  try {
    const supabase = getAdminClient();

    // Get hunter user ID if hunter address provided
    let hunterId: string | null = null;
    if (hunterAddress) {
      const { data: hunter } = await supabase
        .from("users")
        .select("id")
        .eq("wallet_address", hunterAddress.toLowerCase())
        .single();

      if (hunter) {
        hunterId = hunter.id;
      } else {
        // Create user if they don't exist
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert({ wallet_address: hunterAddress.toLowerCase() })
          .select("id")
          .single();

        if (createError) {
          console.error("Failed to create user:", createError);
        } else if (newUser) {
          hunterId = newUser.id;
        }
      }
    }

    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (hunterId) {
      updates.hunter_id = hunterId;
    } else if (status === "open") {
      updates.hunter_id = null;
    }

    if (status === "completed") {
      updates.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("bounties")
      .update(updates)
      .eq("contract_bounty_id", contractBountyId)
      .select();

    if (error) {
      console.error("Error updating bounty status:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("updateBountyStatusByContractId exception:", err);
    return false;
  }
}


