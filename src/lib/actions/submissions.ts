"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import type { Submission } from "@/types";

/**
 * Get submissions for a bounty
 */
export async function getSubmissionsByBounty(bountyId: string): Promise<Submission[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("submissions")
    .select(
      `
      *,
      hunter:users!submissions_hunter_id_fkey(id, wallet_address, username, avatar_url)
    `
    )
    .eq("bounty_id", bountyId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching submissions:", error);
    return [];
  }

  return (data || []).map((s) => ({
    id: s.id,
    bountyId: s.bounty_id,
    hunterId: s.hunter_id,
    hunter: s.hunter
      ? {
        id: s.hunter.id,
        walletAddress: s.hunter.wallet_address,
        username: s.hunter.username,
        avatarUrl: s.hunter.avatar_url,
        bio: null,
        reputation: 0,
        completedBounties: 0,
        totalEarned: 0,
        createdAt: "",
        updatedAt: "",
      }
      : undefined,
    description: s.description,
    proofLink: s.proof_link,
    status: s.status,
    feedback: s.feedback,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  }));
}

/**
 * Get submissions by a specific hunter
 */
export async function getSubmissionsByHunter(
  walletAddress: string
): Promise<Submission[]> {
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

  const { data, error } = await supabase
    .from("submissions")
    .select(
      `
      *,
      bounty:bounties!submissions_bounty_id_fkey(id, contract_bounty_id, title, reward, status)
    `
    )
    .eq("hunter_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching submissions:", error);
    return [];
  }

  return (data || []).map((s) => ({
    id: s.id,
    bountyId: s.bounty_id,
    bounty: s.bounty
      ? {
        id: s.bounty.id,
        contractBountyId: s.bounty.contract_bounty_id ?? null,
        creatorId: "",
        title: s.bounty.title,
        description: "",
        category: "other" as const,
        difficulty: "beginner" as const,
        reward: Number(s.bounty.reward),
        rewardToken: "USDC" as const,
        status: s.bounty.status,
        deadline: null,
        tags: [],
        acceptanceCriteria: "",
        submissionCount: 0,
        hunterId: null,
        createdAt: "",
        updatedAt: "",
        completedAt: null,
      }
      : undefined,
    hunterId: s.hunter_id,
    description: s.description,
    proofLink: s.proof_link,
    status: s.status,
    feedback: s.feedback,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  }));
}

/**
 * Create a new submission
 */
export async function createSubmission(
  bountyId: string,
  hunterId: string,
  description: string,
  proofLink?: string
): Promise<Submission | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("submissions")
    .insert({
      bounty_id: bountyId,
      hunter_id: hunterId,
      description,
      proof_link: proofLink,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating submission:", error);
    return null;
  }

  // Update bounty submission count
  await supabase.rpc("increment_submission_count", { bounty_id: bountyId });

  return {
    id: data.id,
    bountyId: data.bounty_id,
    hunterId: data.hunter_id,
    description: data.description,
    proofLink: data.proof_link,
    status: data.status,
    feedback: data.feedback,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Create a submission using admin client (bypasses RLS)
 * Used when submitting work from the BountyDetail page
 */
export async function createSubmissionByContractId(
  contractBountyId: number,
  hunterAddress: string,
  description: string,
  proofLink?: string
): Promise<Submission | null> {
  try {
    const supabase = getAdminClient();

    // Get the bounty by contract ID
    const { data: bounty, error: bountyError } = await supabase
      .from("bounties")
      .select("id")
      .eq("contract_bounty_id", contractBountyId)
      .single();

    if (bountyError || !bounty) {
      console.error("Error finding bounty:", bountyError);
      return null;
    }

    // Get or create hunter user
    let { data: hunter } = await supabase
      .from("users")
      .select("id")
      .eq("wallet_address", hunterAddress.toLowerCase())
      .single();

    if (!hunter) {
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({ wallet_address: hunterAddress.toLowerCase() })
        .select("id")
        .single();

      if (createError) {
        console.error("Failed to create user:", createError);
        return null;
      }
      hunter = newUser;
    }

    // Check if there's already a pending submission from this hunter for this bounty
    const { data: existingSubmission } = await supabase
      .from("submissions")
      .select("id")
      .eq("bounty_id", bounty.id)
      .eq("hunter_id", hunter.id)
      .eq("status", "pending")
      .single();

    if (existingSubmission) {
      // Update existing pending submission
      const { data, error } = await supabase
        .from("submissions")
        .update({
          description,
          proof_link: proofLink,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSubmission.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating submission:", error);
        return null;
      }

      return {
        id: data.id,
        bountyId: data.bounty_id,
        hunterId: data.hunter_id,
        description: data.description,
        proofLink: data.proof_link,
        status: data.status,
        feedback: data.feedback,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }

    // Create new submission
    const { data, error } = await supabase
      .from("submissions")
      .insert({
        bounty_id: bounty.id,
        hunter_id: hunter.id,
        description,
        proof_link: proofLink,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating submission:", error);
      return null;
    }

    // Update bounty submission count
    await supabase
      .from("bounties")
      .update({
        submission_count: (await supabase
          .from("submissions")
          .select("id", { count: "exact" })
          .eq("bounty_id", bounty.id)).count || 0
      })
      .eq("id", bounty.id);

    return {
      id: data.id,
      bountyId: data.bounty_id,
      hunterId: data.hunter_id,
      description: data.description,
      proofLink: data.proof_link,
      status: data.status,
      feedback: data.feedback,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.error("createSubmissionByContractId exception:", err);
    return null;
  }
}

/**
 * Update submission status by bounty contract ID
 * Used when approving or rejecting work
 */
export async function updateSubmissionStatusByContractId(
  contractBountyId: number,
  status: "pending" | "approved" | "rejected",
  feedback?: string
): Promise<boolean> {
  try {
    const supabase = getAdminClient();

    // Get the bounty by contract ID
    const { data: bounty, error: bountyError } = await supabase
      .from("bounties")
      .select("id, hunter_id")
      .eq("contract_bounty_id", contractBountyId)
      .single();

    if (bountyError || !bounty) {
      console.error("Error finding bounty:", bountyError);
      return false;
    }

    // Find the pending submission for this bounty
    const { data: submission, error: subError } = await supabase
      .from("submissions")
      .select("id")
      .eq("bounty_id", bounty.id)
      .eq("hunter_id", bounty.hunter_id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (subError || !submission) {
      console.error("Error finding submission:", subError);
      return false;
    }

    // Update the submission status
    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (feedback) {
      updates.feedback = feedback;
    }

    const { error: updateError } = await supabase
      .from("submissions")
      .update(updates)
      .eq("id", submission.id);

    if (updateError) {
      console.error("Error updating submission status:", updateError);
      return false;
    }

    // If approved, update hunter stats
    if (status === "approved" && bounty.hunter_id) {
      const { data: bountyData } = await supabase
        .from("bounties")
        .select("reward")
        .eq("id", bounty.id)
        .single();

      if (bountyData) {
        // Get current user stats
        const { data: userData } = await supabase
          .from("users")
          .select("completed_bounties, total_earned")
          .eq("id", bounty.hunter_id)
          .single();

        if (userData) {
          // Update user stats
          await supabase
            .from("users")
            .update({
              completed_bounties: (userData.completed_bounties || 0) + 1,
              total_earned: Number(userData.total_earned || 0) + Number(bountyData.reward || 0),
              updated_at: new Date().toISOString(),
            })
            .eq("id", bounty.hunter_id);
        }
      }
    }

    return true;
  } catch (err) {
    console.error("updateSubmissionStatusByContractId exception:", err);
    return false;
  }
}

/**
 * Get the latest submission for a bounty by a specific hunter
 */
export async function getLatestSubmissionForBounty(
  contractBountyId: number,
  hunterAddress: string
): Promise<Submission | null> {
  try {
    const supabase = getAdminClient();

    // Get the bounty
    const { data: bounty } = await supabase
      .from("bounties")
      .select("id")
      .eq("contract_bounty_id", contractBountyId)
      .single();

    if (!bounty) return null;

    // Get the hunter
    const { data: hunter } = await supabase
      .from("users")
      .select("id")
      .eq("wallet_address", hunterAddress.toLowerCase())
      .single();

    if (!hunter) return null;

    // Get the latest submission
    const { data } = await supabase
      .from("submissions")
      .select("*")
      .eq("bounty_id", bounty.id)
      .eq("hunter_id", hunter.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!data) return null;

    return {
      id: data.id,
      bountyId: data.bounty_id,
      hunterId: data.hunter_id,
      description: data.description,
      proofLink: data.proof_link,
      status: data.status,
      feedback: data.feedback,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch {
    return null;
  }
}


