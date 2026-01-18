"use server";

import { getAdminClient } from "@/lib/supabase/admin";

export interface Dispute {
  id: string;
  bountyId: string;
  contractBountyId: number;
  hunterId: string;
  creatorId: string;
  hunterEvidenceUrl: string;
  creatorEvidenceUrl: string | null;
  openedAt: string;
  resolution: "pending" | "hunter_wins" | "creator_wins" | "split" | null;
  resolved: boolean;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined data
  hunter?: {
    id: string;
    walletAddress: string;
    username: string | null;
  };
  creator?: {
    id: string;
    walletAddress: string;
    username: string | null;
  };
  bounty?: {
    id: string;
    title: string;
    reward: number;
  };
}

/**
 * Create a new dispute record with hunter's evidence URL
 */
export async function createDispute(
  contractBountyId: number,
  hunterAddress: string,
  hunterEvidenceUrl: string
): Promise<Dispute | null> {
  try {
    const supabase = getAdminClient();

    // Get the bounty by contract ID
    const { data: bounty, error: bountyError } = await supabase
      .from("bounties")
      .select("id, creator_id")
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

    // Check if dispute already exists for this bounty
    const { data: existingDispute } = await supabase
      .from("disputes")
      .select("id")
      .eq("contract_bounty_id", contractBountyId)
      .single();

    if (existingDispute) {
      console.error("Dispute already exists for this bounty");
      return null;
    }

    // Create the dispute
    const { data, error } = await supabase
      .from("disputes")
      .insert({
        bounty_id: bounty.id,
        contract_bounty_id: contractBountyId,
        hunter_id: hunter.id,
        creator_id: bounty.creator_id,
        hunter_evidence_url: hunterEvidenceUrl,
        resolution: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating dispute:", error);
      return null;
    }

    return mapDisputeFromDb(data);
  } catch (err) {
    console.error("createDispute exception:", err);
    return null;
  }
}

/**
 * Submit creator's counter-evidence URL
 * Only allowed once per dispute
 */
export async function submitCreatorEvidence(
  contractBountyId: number,
  creatorAddress: string,
  creatorEvidenceUrl: string
): Promise<boolean> {
  try {
    const supabase = getAdminClient();

    // Get the dispute
    const { data: dispute, error: disputeError } = await supabase
      .from("disputes")
      .select("id, creator_evidence_url, creator_id")
      .eq("contract_bounty_id", contractBountyId)
      .single();

    if (disputeError || !dispute) {
      console.error("Error finding dispute:", disputeError);
      return false;
    }

    // Check if creator evidence already submitted
    if (dispute.creator_evidence_url) {
      console.error("Creator evidence already submitted");
      return false;
    }

    // Verify the caller is the creator
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("wallet_address", creatorAddress.toLowerCase())
      .single();

    if (!user || user.id !== dispute.creator_id) {
      console.error("User is not the creator of this dispute");
      return false;
    }

    // Update the dispute with creator's evidence
    const { error } = await supabase
      .from("disputes")
      .update({
        creator_evidence_url: creatorEvidenceUrl,
      })
      .eq("id", dispute.id);

    if (error) {
      console.error("Error updating dispute:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("submitCreatorEvidence exception:", err);
    return false;
  }
}

/**
 * Get dispute by contract bounty ID
 */
export async function getDisputeByContractId(
  contractBountyId: number
): Promise<Dispute | null> {
  try {
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("disputes")
      .select(
        `
        *,
        hunter:users!disputes_hunter_id_fkey(id, wallet_address, username),
        creator:users!disputes_creator_id_fkey(id, wallet_address, username),
        bounty:bounties!disputes_bounty_id_fkey(id, title, reward)
      `
      )
      .eq("contract_bounty_id", contractBountyId)
      .single();

    if (error) {
      // No dispute found is not an error
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("Error fetching dispute:", error);
      return null;
    }

    return mapDisputeFromDb(data);
  } catch (err) {
    console.error("getDisputeByContractId exception:", err);
    return null;
  }
}

/**
 * Get all unresolved disputes (for arbiter view)
 */
export async function getUnresolvedDisputes(): Promise<Dispute[]> {
  try {
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("disputes")
      .select(
        `
        *,
        hunter:users!disputes_hunter_id_fkey(id, wallet_address, username),
        creator:users!disputes_creator_id_fkey(id, wallet_address, username),
        bounty:bounties!disputes_bounty_id_fkey(id, title, reward)
      `
      )
      .eq("resolved", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching disputes:", error);
      return [];
    }

    return (data || []).map(mapDisputeFromDb);
  } catch (err) {
    console.error("getUnresolvedDisputes exception:", err);
    return [];
  }
}

/**
 * Update dispute resolution
 */
export async function resolveDisputeRecord(
  contractBountyId: number,
  resolution: "hunter_wins" | "creator_wins" | "split"
): Promise<boolean> {
  try {
    const supabase = getAdminClient();

    const { error } = await supabase
      .from("disputes")
      .update({
        resolution,
        resolved: true,
        resolved_at: new Date().toISOString(),
      })
      .eq("contract_bounty_id", contractBountyId);

    if (error) {
      console.error("Error resolving dispute:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("resolveDisputeRecord exception:", err);
    return false;
  }
}

// Helper to map DB row to Dispute type
function mapDisputeFromDb(data: Record<string, unknown>): Dispute {
  return {
    id: data.id as string,
    bountyId: data.bounty_id as string,
    contractBountyId: data.contract_bounty_id as number,
    hunterId: data.hunter_id as string,
    creatorId: data.creator_id as string,
    hunterEvidenceUrl: data.hunter_evidence_url as string,
    creatorEvidenceUrl: data.creator_evidence_url as string | null,
    openedAt: data.opened_at as string,
    resolution: data.resolution as Dispute["resolution"],
    resolved: data.resolved as boolean,
    resolvedAt: data.resolved_at as string | null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
    hunter: data.hunter as Dispute["hunter"],
    creator: data.creator as Dispute["creator"],
    bounty: data.bounty as Dispute["bounty"],
  };
}
