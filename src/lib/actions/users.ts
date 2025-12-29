"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import type { User } from "@/types";

/**
 * Get user profile by wallet address
 */
export async function getUserProfile(walletAddress: string): Promise<User | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("wallet_address", walletAddress.toLowerCase())
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    walletAddress: data.wallet_address,
    username: data.username,
    avatarUrl: data.avatar_url,
    bio: data.bio,
    reputation: data.reputation,
    completedBounties: data.completed_bounties,
    totalEarned: Number(data.total_earned),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Get or create user by wallet address
 * Uses admin client to bypass RLS
 */
export async function getOrCreateUser(walletAddress: string): Promise<{ id: string } | null> {
  try {
    const supabase = getAdminClient();
    const normalizedAddress = walletAddress.toLowerCase();

    // First try to find existing user
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("id")
      .eq("wallet_address", normalizedAddress)
      .single();

    if (existingUser) {
      return { id: existingUser.id };
    }

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("User fetch error:", fetchError);
    }

    // Create new user
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({ wallet_address: normalizedAddress })
      .select("id")
      .single();

    if (createError) {
      // Handle race condition - user might have been created by another request
      if (createError.code === "23505") {
        const { data: raceUser } = await supabase
          .from("users")
          .select("id")
          .eq("wallet_address", normalizedAddress)
          .single();
        
        if (raceUser) {
          return { id: raceUser.id };
        }
      }
      console.error("User create error:", createError);
      return null;
    }

    return { id: newUser.id };
  } catch (err) {
    console.error("getOrCreateUser exception:", err);
    return null;
  }
}

/**
 * Get user's completed bounties
 */
export async function getUserCompletedBounties(walletAddress: string, limit: number = 10) {
  const supabase = await createClient();

  // First get user ID
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("wallet_address", walletAddress.toLowerCase())
    .single();

  if (!user) {
    return [];
  }

  // Get bounties where this user is the hunter and status is completed
  const { data, error } = await supabase
    .from("bounties")
    .select("*")
    .eq("hunter_id", user.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching completed bounties:", error);
    return [];
  }

  return (data || []).map((b) => ({
    id: b.id,
    contractBountyId: b.contract_bounty_id ?? null,
    creatorId: b.creator_id,
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
    createdAt: b.created_at,
    updatedAt: b.updated_at,
    completedAt: b.completed_at,
  }));
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  walletAddress: string,
  updates: { username?: string; bio?: string; avatarUrl?: string }
): Promise<User | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .update({
      username: updates.username,
      bio: updates.bio,
      avatar_url: updates.avatarUrl,
    })
    .eq("wallet_address", walletAddress.toLowerCase())
    .select()
    .single();

  if (error || !data) {
    console.error("Error updating profile:", error);
    return null;
  }

  return {
    id: data.id,
    walletAddress: data.wallet_address,
    username: data.username,
    avatarUrl: data.avatar_url,
    bio: data.bio,
    reputation: data.reputation,
    completedBounties: data.completed_bounties,
    totalEarned: Number(data.total_earned),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}


