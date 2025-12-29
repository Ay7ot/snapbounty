"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import {
  Plus,
  FileText,
  Briefcase,
  DollarSign,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  SkeletonDashboard,
  SkeletonBountyListItem,
  NoBountiesCreated,
  NoActiveClaims,
} from "@/components/ui";
import { WalletConnectPrompt } from "@/components/ui/WalletConnectPrompt";
import { BountyCardCompact } from "@/components/bounty";
import { useActiveClaim, useBountyFromContract } from "@/hooks/useContract";
import { getSupabase } from "@/lib/supabase/client";
import type { Bounty, Submission } from "@/types";

type Tab = "posted" | "claims" | "submissions";

export function DashboardContent() {
  const { address, isConnected } = useAccount();
  const { activeClaimId, hasActiveClaim } = useActiveClaim(address);

  const [activeTab, setActiveTab] = useState<Tab>("posted");
  const [isLoading, setIsLoading] = useState(true);
  const [postedBounties, setPostedBounties] = useState<Bounty[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState({
    totalPosted: 0,
    totalEarned: 0,
    completedBounties: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch dashboard data
  const fetchData = useCallback(async (showLoading = true) => {
    if (!address) {
      setIsLoading(false);
      return;
    }

    if (showLoading) setIsLoading(true);
    setIsRefreshing(true);
    const supabase = getSupabase();

    try {
      // Get user
      const { data: user } = await supabase
        .from("users")
        .select("id, completed_bounties, total_earned")
        .eq("wallet_address", address.toLowerCase())
        .single();

      if (user) {
        setStats({
          totalPosted: 0,
          totalEarned: Number(user.total_earned) || 0,
          completedBounties: user.completed_bounties || 0,
        });

        // Get posted bounties
        const { data: bounties } = await supabase
          .from("bounties")
          .select("*")
          .eq("creator_id", user.id)
          .order("created_at", { ascending: false });

        if (bounties) {
          setPostedBounties(
            bounties.map((b: any) => ({
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
            }))
          );
          setStats((prev) => ({ ...prev, totalPosted: bounties.length }));
        }

        // Get submissions
        const { data: subs } = await supabase
          .from("submissions")
          .select(
            `
            *,
            bounty:bounties!submissions_bounty_id_fkey(id, contract_bounty_id, title, reward, status)
          `
          )
          .eq("hunter_id", user.id)
          .order("created_at", { ascending: false });

        if (subs) {
          setSubmissions(
            subs.map((s: any) => ({
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
            }))
          );
        }
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [address]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh on window focus
  useEffect(() => {
    const handleFocus = () => {
      if (!isLoading && address) {
        fetchData(false);
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchData, isLoading, address]);

  const handleRefresh = () => {
    if (!isRefreshing) {
      fetchData(false);
    }
  };

  if (!isConnected) {
    return (
      <WalletConnectPrompt
        title="Connect Your Wallet"
        description="Connect your wallet to view your dashboard, track active bounties, and see your earnings."
      />
    );
  }

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  const tabs = [
    { id: "posted" as Tab, label: "Posted Bounties", count: postedBounties.length },
    { id: "claims" as Tab, label: "Active Claims", count: hasActiveClaim ? 1 : 0 },
    { id: "submissions" as Tab, label: "Submissions", count: submissions.length },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Cards with Refresh */}
      <div className="space-y-4">
        <div className="flex justify-end">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-accent-green transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent-green/10 flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-accent-green" />
                </div>
                <div>
                  <p className="text-sm text-text-tertiary">Bounties Posted</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {stats.totalPosted}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent-purple/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-accent-purple" />
                </div>
                <div>
                  <p className="text-sm text-text-tertiary">Bounties Completed</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {stats.completedBounties}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent-green/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-accent-green" />
                </div>
                <div>
                  <p className="text-sm text-text-tertiary">Total Earned</p>
                  <p className="text-2xl font-bold text-accent-green">
                    ${stats.totalEarned.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border-default">
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === tab.id
                ? "text-accent-green"
                : "text-text-secondary hover:text-text-primary"
                }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <Badge variant="open" className="ml-2 text-xs">
                  {tab.count}
                </Badge>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-green" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "posted" && (
          <PostedBountiesTab bounties={postedBounties} />
        )}
        {activeTab === "claims" && (
          <ActiveClaimsTab
            activeClaimId={activeClaimId}
            hasActiveClaim={hasActiveClaim}
          />
        )}
        {activeTab === "submissions" && (
          <SubmissionsTab submissions={submissions} />
        )}
      </div>
    </div>
  );
}

function PostedBountiesTab({ bounties }: { bounties: Bounty[] }) {
  if (bounties.length === 0) {
    return (
      <NoBountiesCreated
        onCreateBounty={() => (window.location.href = "/create")}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link href="/create">
          <Button>
            <Plus className="h-4 w-4" />
            New Bounty
          </Button>
        </Link>
      </div>
      <div className="space-y-3">
        {bounties.map((bounty) => (
          <BountyCardCompact key={bounty.id} bounty={bounty} />
        ))}
      </div>
    </div>
  );
}

function ActiveClaimsTab({
  activeClaimId,
  hasActiveClaim,
}: {
  activeClaimId: number;
  hasActiveClaim: boolean;
}) {
  const { bounty: contractBounty, isLoading: isLoadingContract } = useBountyFromContract(
    hasActiveClaim ? activeClaimId : undefined
  );
  const [databaseBounty, setDatabaseBounty] = useState<Bounty | null>(null);
  const [isLoadingDb, setIsLoadingDb] = useState(true);

  // Fetch database bounty data
  useEffect(() => {
    if (!hasActiveClaim || !activeClaimId) {
      setIsLoadingDb(false);
      return;
    }

    const fetchBounty = async () => {
      setIsLoadingDb(true);
      const supabase = getSupabase();

      try {
        const { data, error } = await supabase
          .from("bounties")
          .select(
            `
            *,
            creator:users!bounties_creator_id_fkey(id, wallet_address, username, avatar_url, reputation),
            hunter:users!bounties_hunter_id_fkey(id, wallet_address, username, avatar_url)
          `
          )
          .eq("contract_bounty_id", activeClaimId)
          .single();

        if (error) {
          console.error("Error fetching bounty:", error);
          setDatabaseBounty(null);
          return;
        }

        if (data) {
          setDatabaseBounty({
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
          });
        }
      } catch (err) {
        console.error("Error fetching bounty:", err);
        setDatabaseBounty(null);
      } finally {
        setIsLoadingDb(false);
      }
    };

    fetchBounty();
  }, [activeClaimId, hasActiveClaim]);

  if (!hasActiveClaim) {
    return <NoActiveClaims />;
  }

  if (isLoadingContract || isLoadingDb) {
    return <SkeletonBountyListItem />;
  }

  const bountyTitle = databaseBounty?.title || `Bounty #${activeClaimId}`;
  const bountyReward = databaseBounty?.reward || (contractBounty ? Number(contractBounty.reward) / 1e6 : 0);
  const bountyId = databaseBounty?.id || activeClaimId.toString();

  // Determine status badge
  const getStatusBadge = () => {
    if (contractBounty) {
      if (contractBounty.status === 1) return { variant: "active" as const, label: "In Progress" };
      if (contractBounty.status === 2) return { variant: "pending" as const, label: "Submitted" };
    }
    if (databaseBounty) {
      if (databaseBounty.status === "claimed") return { variant: "active" as const, label: "In Progress" };
      if (databaseBounty.status === "submitted") return { variant: "pending" as const, label: "Submitted" };
    }
    return { variant: "open" as const, label: "Unknown" };
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-tertiary mb-1">Active Claim</p>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-lg font-bold text-text-primary truncate">
                  {bountyTitle}
                </p>
                <Badge variant={statusBadge.variant} className="shrink-0">
                  {statusBadge.label}
                </Badge>
              </div>
              {databaseBounty?.description && (
                <p className="text-sm text-text-secondary mt-2 line-clamp-2">
                  {databaseBounty.description}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 border-border-default pt-4 sm:pt-0">
              <p className="text-accent-green font-bold text-lg">
                ${bountyReward.toFixed(2)} USDC
              </p>
              <Link href={`/bounty/${bountyId}`} className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto">View Details</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SubmissionsTab({ submissions }: { submissions: Submission[] }) {
  if (submissions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary">
            No Submissions Yet
          </h3>
          <p className="mt-2 text-sm text-text-secondary">
            Claim a bounty and submit your work to see it here
          </p>
          <Link href="/explore">
            <Button variant="secondary" className="mt-4">
              Browse Bounties
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {submissions.map((submission) => (
        <Card key={submission.id} className="group overflow-hidden">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2 sm:mb-1">
                  <Link
                    href={`/bounty/${submission.bounty?.id || submission.bountyId}`}
                    className="font-semibold text-text-primary hover:text-accent-green transition-colors line-clamp-1"
                  >
                    {submission.bounty?.title || `Bounty #${submission.bountyId}`}
                  </Link>
                  <Badge
                    variant={
                      submission.status === "approved"
                        ? "completed"
                        : submission.status === "rejected"
                          ? "closed"
                          : "pending"
                    }
                    className="shrink-0 sm:hidden"
                  >
                    {submission.status}
                  </Badge>
                </div>

                <p className="text-xs text-text-tertiary">
                  Submitted on {new Date(submission.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-border-default/50">
                <Badge
                  variant={
                    submission.status === "approved"
                      ? "completed"
                      : submission.status === "rejected"
                        ? "closed"
                        : "pending"
                  }
                  className="shrink-0 hidden sm:flex"
                >
                  {submission.status}
                </Badge>

                {submission.bounty && (
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-text-tertiary sm:hidden">Reward</p>
                    <p className="font-bold text-accent-green text-lg">
                      ${submission.bounty.reward}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {submission.feedback && (
              <div className="mt-4 p-4 rounded-lg bg-bg-secondary/50 border border-border-default">
                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-1">Feedback</p>
                <p className="text-sm text-text-secondary leading-relaxed">{submission.feedback}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


