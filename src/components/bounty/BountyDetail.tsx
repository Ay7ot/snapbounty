"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import {
  Clock,
  User,
  Calendar,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Tag,
  Target,
  Layers,
  AlertCircle,
  Scale,
  FileText,
  Gavel,
  AlertTriangle,
  Shield,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { TransactionButton } from "@/components/tx/TransactionButton";
import { ApprovalFlow } from "@/components/tx/ApprovalFlow";
import { BountyStatusBadge } from "./BountyStatusBadge";
import {
  useClaimBounty,
  useSubmitWork,
  useApproveWork,
  useRejectWork,
  useCancelBounty,
  useReleaseClaim,
  useCanClaim,
  useIsCreator,
  useIsHunter,
  useBountyFromContract,
  useCanOpenDispute,
  useOpenDispute,
  useGetDispute,
  useDisputeFee,
  useSubmitDisputeEvidence,
  useResolveDispute,
  useIsArbiter,
  useAutoResolveDispute,
} from "@/hooks/useContract";
import { BountyStatus, DisputeResolution, DISPUTE_RESOLUTION_WINDOW } from "@/config/contracts";
import { updateBountyStatusByContractId } from "@/lib/actions/bounties";
import {
  createSubmissionByContractId,
  updateSubmissionStatusByContractId,
} from "@/lib/actions/submissions";
import {
  createDispute,
  submitCreatorEvidence,
  getDisputeByContractId,
  resolveDisputeRecord,
  type Dispute as DisputeRecord,
} from "@/lib/actions/disputes";
import { cn } from "@/lib/utils";
import type { Bounty, Submission } from "@/types";

interface BountyDetailProps {
  bounty: Bounty;
  submissions?: Submission[];
  onRefresh?: () => void;
}

const categoryLabels: Record<string, string> = {
  development: "Development",
  design: "Design",
  writing: "Writing",
  research: "Research",
  "ai-prompting": "AI Prompting",
  other: "Other",
};

const difficultyLabels: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const difficultyColors: Record<string, string> = {
  beginner: "text-accent-green",
  intermediate: "text-accent-blue",
  advanced: "text-accent-purple",
};

export function BountyDetail({ bounty, submissions = [], onRefresh }: BountyDetailProps) {
  const { address, isConnected } = useAccount();

  const contractBountyId = bounty.contractBountyId ?? undefined;
  const hasContractId = contractBountyId !== undefined && contractBountyId > 0;

  // Contract hooks
  const { bounty: contractBounty, refetch: refetchContract } = useBountyFromContract(
    hasContractId ? contractBountyId : undefined
  );
  const canClaim = useCanClaim(hasContractId ? contractBountyId : undefined);
  const isCreator = useIsCreator(hasContractId ? contractBountyId : undefined);
  const isHunter = useIsHunter(hasContractId ? contractBountyId : undefined);
  const isCreatorByWallet =
    address && bounty.creator?.walletAddress?.toLowerCase() === address.toLowerCase();

  // Action hooks
  const claimHook = useClaimBounty();
  const submitHook = useSubmitWork();
  const approveHook = useApproveWork();
  const rejectHook = useRejectWork();
  const cancelHook = useCancelBounty();
  const releaseHook = useReleaseClaim();

  // Dispute hooks
  const { canDispute, refetch: refetchCanDispute } = useCanOpenDispute(hasContractId ? contractBountyId : undefined);
  const { dispute, refetch: refetchDispute } = useGetDispute(
    hasContractId ? contractBountyId : undefined
  );
  const { formattedDisputeFee, disputeFeeAmount } = useDisputeFee();
  const openDisputeHook = useOpenDispute();
  const submitEvidenceHook = useSubmitDisputeEvidence();
  const resolveDisputeHook = useResolveDispute();
  const autoResolveHook = useAutoResolveDispute();
  const isArbiter = useIsArbiter();

  // Local state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [proofLink, setProofLink] = useState("");
  const [submissionDescription, setSubmissionDescription] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [disputeEvidence, setDisputeEvidence] = useState("");
  const [creatorEvidence, setCreatorEvidence] = useState("");
  const [disputeRecord, setDisputeRecord] = useState<DisputeRecord | null>(null);

  // Status helpers (moved up for useCallback dependency)
  const status = contractBounty?.status ?? BountyStatus.Open;
  const isOpen = status === BountyStatus.Open;
  const isClaimed = status === BountyStatus.Claimed;
  const isSubmitted = status === BountyStatus.Submitted;
  const isCompleted = status === BountyStatus.Completed;
  const isCancelled = status === BountyStatus.Cancelled;
  const isDisputed = status === BountyStatus.Disputed;

  // Fetch dispute record from database (contains actual evidence URLs)
  const fetchDisputeRecord = useCallback(async () => {
    if (contractBountyId && isDisputed) {
      const record = await getDisputeByContractId(contractBountyId);
      setDisputeRecord(record);
    }
  }, [contractBountyId, isDisputed]);

  useEffect(() => {
    fetchDisputeRecord();
  }, [fetchDisputeRecord]);

  const canAutoResolve =
    dispute &&
    !dispute.resolved &&
    Date.now() / 1000 > Number(dispute.openedAt) + DISPUTE_RESOLUTION_WINDOW;

  const handleRefresh = () => {
    refetchContract();
    refetchDispute();
    refetchCanDispute();
    onRefresh?.();
  };

  // Success handlers
  const handleClaimSuccess = async () => {
    if (contractBountyId && address) {
      await updateBountyStatusByContractId(contractBountyId, "claimed", address);
    }
    handleRefresh();
  };

  const handleSubmitSuccess = async () => {
    if (contractBountyId && address) {
      await createSubmissionByContractId(
        contractBountyId,
        address,
        submissionDescription,
        proofLink || undefined
      );
      await updateBountyStatusByContractId(contractBountyId, "submitted");
    }
    handleRefresh();
    setShowSubmitModal(false);
    setSubmissionDescription("");
    setProofLink("");
  };

  const handleApproveSuccess = async () => {
    if (contractBountyId) {
      await updateSubmissionStatusByContractId(contractBountyId, "approved");
      await updateBountyStatusByContractId(contractBountyId, "completed");
    }
    handleRefresh();
  };

  const handleRejectSuccess = async () => {
    if (contractBountyId) {
      await updateSubmissionStatusByContractId(contractBountyId, "rejected", rejectReason);
      await updateBountyStatusByContractId(contractBountyId, "claimed");
    }
    handleRefresh();
    setShowRejectModal(false);
    setRejectReason("");
  };

  const handleCancelSuccess = async () => {
    if (contractBountyId) {
      await updateBountyStatusByContractId(contractBountyId, "cancelled");
    }
    handleRefresh();
  };

  const handleReleaseSuccess = async () => {
    if (contractBountyId) {
      await updateBountyStatusByContractId(contractBountyId, "open", null);
    }
    handleRefresh();
  };

  const handleDisputeSuccess = async () => {
    if (contractBountyId && address) {
      // Save dispute record with evidence URL to database
      await createDispute(contractBountyId, address, disputeEvidence);
      await updateBountyStatusByContractId(contractBountyId, "disputed");
    }
    handleRefresh();
    fetchDisputeRecord();
    setShowDisputeModal(false);
    setDisputeEvidence("");
  };

  const handleEvidenceSuccess = async () => {
    if (contractBountyId && address) {
      // Save creator's counter-evidence URL to database
      await submitCreatorEvidence(contractBountyId, address, creatorEvidence);
    }
    handleRefresh();
    fetchDisputeRecord();
    setShowEvidenceModal(false);
    setCreatorEvidence("");
  };

  const handleResolveSuccess = async (resolution: "hunter_wins" | "creator_wins" | "split") => {
    if (contractBountyId) {
      // Update bounty status to completed
      await updateBountyStatusByContractId(contractBountyId, "completed");
      // Update dispute record with resolution
      await resolveDisputeRecord(contractBountyId, resolution);
    }
    handleRefresh();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No deadline";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Render sidebar action card
  const renderActionCard = () => {
    // Not connected
    if (!isConnected) {
      return (
        <div className="p-6 rounded-xl bg-linear-to-br from-bg-tertiary to-bg-elevated border border-border-default">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-accent-green/10 flex items-center justify-center">
              <Shield className="h-7 w-7 text-accent-green" />
            </div>
            <div>
              <p className="font-semibold text-text-primary">Ready to Hunt?</p>
              <p className="text-sm text-text-secondary mt-1">
                Connect your wallet to claim this bounty
              </p>
            </div>
          </div>
        </div>
      );
    }

    // No contract ID
    if (!hasContractId) {
      return (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Pending</span>
          </div>
          <p className="text-xs text-text-secondary">
            This bounty is being processed. Actions will be available soon.
          </p>
        </div>
      );
    }

    // Completed
    if (isCompleted) {
      return (
        <div className="p-5 rounded-xl bg-accent-green/10 border border-accent-green/30">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-accent-green" />
            <div>
              <p className="font-medium text-accent-green">Completed</p>
              <p className="text-xs text-text-secondary mt-0.5">Payment released to hunter</p>
            </div>
          </div>
        </div>
      );
    }

    // Cancelled
    if (isCancelled) {
      return (
        <div className="p-5 rounded-xl bg-red-500/10 border border-red-500/30">
          <div className="flex items-center gap-3">
            <XCircle className="h-6 w-6 text-red-400" />
            <div>
              <p className="font-medium text-red-400">Cancelled</p>
              <p className="text-xs text-text-secondary mt-0.5">Bounty was cancelled by creator</p>
            </div>
          </div>
        </div>
      );
    }

    // Disputed
    if (isDisputed && dispute) {
      const resolutionDeadline = new Date(
        (Number(dispute.openedAt) + DISPUTE_RESOLUTION_WINDOW) * 1000
      );

      return (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center gap-2 text-amber-500 mb-2">
              <Scale className="h-5 w-5" />
              <span className="font-medium">Under Dispute</span>
            </div>
            <p className="text-xs text-text-secondary">
              Resolution deadline: {resolutionDeadline.toLocaleDateString()}
            </p>
          </div>

          {/* Evidence Links Section */}
          {disputeRecord && (
            <div className="p-4 rounded-xl bg-bg-secondary border border-border-default space-y-3">
              <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                Evidence Links
              </p>

              {/* Hunter Evidence */}
              <div className="space-y-1">
                <p className="text-xs text-text-secondary">Hunter&apos;s Evidence:</p>
                <a
                  href={disputeRecord.hunterEvidenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-green hover:underline break-all"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  {disputeRecord.hunterEvidenceUrl}
                </a>
              </div>

              {/* Creator Evidence */}
              <div className="space-y-1">
                <p className="text-xs text-text-secondary">Creator&apos;s Counter-Evidence:</p>
                {disputeRecord.creatorEvidenceUrl ? (
                  <a
                    href={disputeRecord.creatorEvidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-blue hover:underline break-all"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    {disputeRecord.creatorEvidenceUrl}
                  </a>
                ) : (
                  <p className="text-xs text-text-tertiary italic">Not submitted yet</p>
                )}
              </div>
            </div>
          )}

          {(isCreator || isCreatorByWallet) &&
            dispute.creatorEvidence ===
            "0x0000000000000000000000000000000000000000000000000000000000000000" && (
              <Button onClick={() => setShowEvidenceModal(true)} variant="secondary" className="w-full">
                <FileText className="h-4 w-4" />
                Submit Counter-Evidence
              </Button>
            )}

          {isArbiter && !dispute.resolved && (
            <div className="space-y-3 p-4 rounded-xl bg-accent-purple/10 border border-accent-purple/30">
              <div className="flex items-center gap-2 text-accent-purple mb-2">
                <Gavel className="h-4 w-4" />
                <span className="text-sm font-medium">Arbiter Actions</span>
              </div>
              <div className="grid gap-2">
                <TransactionButton
                  onClick={() => {
                    if (contractBountyId)
                      resolveDisputeHook.resolveDispute(
                        contractBountyId,
                        DisputeResolution.HunterWins
                      );
                  }}
                  isPending={resolveDisputeHook.isPending}
                  isConfirming={resolveDisputeHook.isConfirming}
                  isSuccess={resolveDisputeHook.isSuccess}
                  error={resolveDisputeHook.error}
                  hash={resolveDisputeHook.hash}
                  onReset={resolveDisputeHook.reset}
                  successMessage="Resolved for hunter"
                  onSuccess={() => handleResolveSuccess("hunter_wins")}
                  className="w-full"
                  disabled={!contractBountyId}
                >
                  Hunter Wins
                </TransactionButton>
                <TransactionButton
                  onClick={() => {
                    if (contractBountyId)
                      resolveDisputeHook.resolveDispute(
                        contractBountyId,
                        DisputeResolution.CreatorWins
                      );
                  }}
                  isPending={resolveDisputeHook.isPending}
                  isConfirming={resolveDisputeHook.isConfirming}
                  isSuccess={resolveDisputeHook.isSuccess}
                  error={resolveDisputeHook.error}
                  hash={resolveDisputeHook.hash}
                  onReset={resolveDisputeHook.reset}
                  variant="danger"
                  successMessage="Resolved for creator"
                  onSuccess={() => handleResolveSuccess("creator_wins")}
                  className="w-full"
                  disabled={!contractBountyId}
                >
                  Creator Wins
                </TransactionButton>
                <TransactionButton
                  onClick={() => {
                    if (contractBountyId)
                      resolveDisputeHook.resolveDispute(contractBountyId, DisputeResolution.Split);
                  }}
                  isPending={resolveDisputeHook.isPending}
                  isConfirming={resolveDisputeHook.isConfirming}
                  isSuccess={resolveDisputeHook.isSuccess}
                  error={resolveDisputeHook.error}
                  hash={resolveDisputeHook.hash}
                  onReset={resolveDisputeHook.reset}
                  variant="secondary"
                  successMessage="Split resolution"
                  onSuccess={() => handleResolveSuccess("split")}
                  className="w-full"
                  disabled={!contractBountyId}
                >
                  Split 50/50
                </TransactionButton>
              </div>
            </div>
          )}

          {canAutoResolve && (
            <TransactionButton
              onClick={() => {
                if (contractBountyId) autoResolveHook.autoResolve(contractBountyId);
              }}
              isPending={autoResolveHook.isPending}
              isConfirming={autoResolveHook.isConfirming}
              isSuccess={autoResolveHook.isSuccess}
              error={autoResolveHook.error}
              hash={autoResolveHook.hash}
              onReset={autoResolveHook.reset}
              successMessage="Dispute auto-resolved"
              onSuccess={() => handleResolveSuccess("hunter_wins")}
              className="w-full"
              disabled={!contractBountyId}
            >
              Auto-Resolve (Hunter Wins)
            </TransactionButton>
          )}
        </div>
      );
    }

    // Creator actions
    if (isCreator || isCreatorByWallet) {
      return (
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-accent-blue/10 border border-accent-blue/30">
            <p className="text-xs font-medium text-accent-blue">Your Bounty</p>
          </div>

          {isOpen && (
            <div className="space-y-3">
              <p className="text-sm text-text-secondary">
                Waiting for a hunter to claim this bounty.
              </p>
              <TransactionButton
                onClick={() => {
                  if (contractBountyId) cancelHook.cancelBounty(contractBountyId);
                }}
                isPending={cancelHook.isPending}
                isConfirming={cancelHook.isConfirming}
                isSuccess={cancelHook.isSuccess}
                error={cancelHook.error}
                hash={cancelHook.hash}
                onReset={cancelHook.reset}
                variant="danger"
                successMessage="Bounty cancelled"
                onSuccess={handleCancelSuccess}
                className="w-full"
                disabled={!contractBountyId}
              >
                Cancel Bounty
              </TransactionButton>
            </div>
          )}

          {isClaimed && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center gap-2 text-amber-500 mb-1">
                <Clock className="h-4 w-4" />
                <span className="font-medium text-sm">In Progress</span>
              </div>
              <p className="text-xs text-text-secondary">A hunter is working on this bounty.</p>
            </div>
          )}

          {isSubmitted && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-accent-purple/10 border border-accent-purple/30">
                <div className="flex items-center gap-2 text-accent-purple mb-1">
                  <Target className="h-4 w-4" />
                  <span className="font-medium text-sm">Review Required</span>
                </div>
                <p className="text-xs text-text-secondary">Work has been submitted for review.</p>
              </div>
              <TransactionButton
                onClick={() => {
                  if (contractBountyId) approveHook.approveWork(contractBountyId);
                }}
                isPending={approveHook.isPending}
                isConfirming={approveHook.isConfirming}
                isSuccess={approveHook.isSuccess}
                error={approveHook.error}
                hash={approveHook.hash}
                onReset={approveHook.reset}
                successMessage="Work approved!"
                onSuccess={handleApproveSuccess}
                className="w-full"
                size="lg"
                disabled={!contractBountyId}
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve & Pay
              </TransactionButton>
              <Button variant="ghost" onClick={() => setShowRejectModal(true)} className="w-full">
                <XCircle className="h-4 w-4" />
                Request Changes
              </Button>
            </div>
          )}
        </div>
      );
    }

    // Hunter actions
    if (isHunter) {
      return (
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-accent-green/10 border border-accent-green/30">
            <p className="text-xs font-medium text-accent-green">You&apos;re working on this</p>
          </div>

          {contractBounty && contractBounty.rejectionCount > 0 && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center gap-2 text-amber-500">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs font-medium">
                  {contractBounty.rejectionCount} revision
                  {contractBounty.rejectionCount > 1 ? "s" : ""} requested
                </span>
              </div>
            </div>
          )}

          {isClaimed && (
            <div className="space-y-3">
              <Button onClick={() => setShowSubmitModal(true)} className="w-full" size="lg">
                <Zap className="h-4 w-4" />
                Submit Work
              </Button>

              {canDispute && (
                <Button onClick={() => setShowDisputeModal(true)} variant="secondary" className="w-full">
                  <Scale className="h-4 w-4" />
                  Open Dispute
                </Button>
              )}

              <TransactionButton
                onClick={() => {
                  if (contractBountyId) releaseHook.releaseClaim(contractBountyId);
                }}
                isPending={releaseHook.isPending}
                isConfirming={releaseHook.isConfirming}
                isSuccess={releaseHook.isSuccess}
                error={releaseHook.error}
                hash={releaseHook.hash}
                onReset={releaseHook.reset}
                variant="ghost"
                successMessage="Claim released"
                onSuccess={handleReleaseSuccess}
                className="w-full"
                disabled={!contractBountyId}
              >
                Release Claim
              </TransactionButton>
            </div>
          )}

          {isSubmitted && (
            <div className="p-4 rounded-xl bg-accent-green/10 border border-accent-green/30">
              <div className="flex items-center gap-2 text-accent-green mb-1">
                <Clock className="h-4 w-4" />
                <span className="font-medium text-sm">Awaiting Review</span>
              </div>
              <p className="text-xs text-text-secondary">
                Your work is being reviewed by the creator.
              </p>
            </div>
          )}
        </div>
      );
    }

    // Potential hunter - can claim
    if (isOpen) {
      if (canClaim) {
        return (
          <div className="space-y-4">
            <TransactionButton
              onClick={() => {
                if (contractBountyId) claimHook.claimBounty(contractBountyId);
              }}
              isPending={claimHook.isPending}
              isConfirming={claimHook.isConfirming}
              isSuccess={claimHook.isSuccess}
              error={claimHook.error}
              hash={claimHook.hash}
              onReset={claimHook.reset}
              successMessage="Bounty claimed!"
              onSuccess={handleClaimSuccess}
              className="w-full"
              size="lg"
              disabled={!contractBountyId}
            >
              <Zap className="h-4 w-4" />
              Claim This Bounty
            </TransactionButton>
            <p className="text-xs text-text-tertiary text-center">
              You&apos;ll have exclusive access until you submit or release
            </p>
          </div>
        );
      }

      return (
        <div className="p-4 rounded-xl bg-bg-secondary border border-border-default">
          <div className="flex items-center gap-2 text-text-tertiary mb-1">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Cannot Claim</span>
          </div>
          <p className="text-xs text-text-secondary">
            You may have an active claim on another bounty.
          </p>
        </div>
      );
    }

    // In progress by someone else
    if (isClaimed) {
      return (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-center gap-2 text-amber-500 mb-1">
            <Clock className="h-4 w-4" />
            <span className="font-medium text-sm">In Progress</span>
          </div>
          <p className="text-xs text-text-secondary">Another hunter is working on this bounty.</p>
        </div>
      );
    }

    // Under review
    if (isSubmitted) {
      return (
        <div className="p-4 rounded-xl bg-accent-purple/10 border border-accent-purple/30">
          <div className="flex items-center gap-2 text-accent-purple mb-1">
            <Target className="h-4 w-4" />
            <span className="font-medium text-sm">Under Review</span>
          </div>
          <p className="text-xs text-text-secondary">Work submitted, awaiting creator review.</p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Title & Status */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <BountyStatusBadge status={bounty.status} />
            <span className="text-xs text-text-tertiary">•</span>
            <span className="text-xs text-text-tertiary">
              Posted {formatDate(bounty.createdAt)}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary leading-tight">
            {bounty.title}
          </h1>
        </div>

        {/* Meta pills */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-secondary border border-border-default">
            <Layers className="h-4 w-4 text-accent-blue" />
            <span className="text-sm text-text-primary">
              {categoryLabels[bounty.category] || bounty.category}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-secondary border border-border-default">
            <Target className={cn("h-4 w-4", difficultyColors[bounty.difficulty] || "text-text-secondary")} />
            <span className="text-sm text-text-primary">
              {difficultyLabels[bounty.difficulty] || bounty.difficulty}
            </span>
          </div>
          {bounty.deadline && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-secondary border border-border-default">
              <Calendar className="h-4 w-4 text-accent-orange" />
              <span className="text-sm text-text-primary">Due {formatDate(bounty.deadline)}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {bounty.tags && bounty.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {bounty.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs rounded-full bg-bg-elevated text-text-secondary"
              >
                <Tag className="h-3 w-3 inline mr-1" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
            Description
          </h2>
          <div className="p-5 rounded-xl bg-white/3 border border-white/10">
            <p className="text-[16px] text-white/90 leading-[1.85] whitespace-pre-wrap wrap-break-word">
              {bounty.description}
            </p>
          </div>
        </div>

        {/* Acceptance Criteria */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
            Acceptance Criteria
          </h2>
          <div className="p-5 rounded-xl bg-[#0a0c10] border border-[#238636]/30 shadow-[inset_0_1px_0_rgba(35,134,54,0.1)]">
            <pre className="text-[15px] text-[#c9d1d9] leading-[1.9] whitespace-pre-wrap wrap-break-word font-mono">
              {bounty.acceptanceCriteria}
            </pre>
          </div>
        </div>

        {/* Submissions Section */}
        {(isCreator || isCreatorByWallet) && submissions.length > 0 && (
          <div className="p-6 rounded-xl bg-bg-secondary border border-border-default">
            <h2 className="text-sm font-semibold text-text-primary mb-4">
              Submissions ({submissions.length})
            </h2>
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="p-4 rounded-lg bg-bg-elevated border border-border-default"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <span className="text-xs text-text-tertiary">
                      {new Date(submission.createdAt).toLocaleDateString()}
                    </span>
                    <Badge
                      variant={
                        submission.status === "approved"
                          ? "completed"
                          : submission.status === "rejected"
                            ? "closed"
                            : "pending"
                      }
                    >
                      {submission.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-text-primary whitespace-pre-wrap wrap-break-word">
                    {submission.description}
                  </p>
                  {submission.proofLink && (
                    <a
                      href={submission.proofLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-accent-green hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View Proof
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-1">
        <div className="lg:sticky lg:top-24 space-y-6">
          {/* Reward Card */}
          <div className="p-6 rounded-xl bg-linear-to-br from-bg-tertiary to-bg-elevated border border-border-default">
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">
              Reward
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-accent-green">${bounty.reward}</span>
              <span className="text-sm text-text-tertiary">{bounty.rewardToken}</span>
            </div>
          </div>

          {/* Creator Info */}
          <div className="p-4 rounded-xl bg-bg-secondary border border-border-default">
            <p className="text-xs font-medium text-text-tertiary mb-3">Posted by</p>
            <Link
              href={`/profile/${bounty.creator?.walletAddress || bounty.creatorId}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 rounded-full bg-bg-elevated flex items-center justify-center">
                <User className="h-5 w-5 text-text-tertiary" />
              </div>
              <div>
                <p className="font-medium text-text-primary">
                  {bounty.creator?.username || "Anonymous"}
                </p>
                <p className="text-xs text-text-tertiary">View profile</p>
              </div>
            </Link>
          </div>

          {/* Hunter Info */}
          {bounty.hunter && (
            <div className="p-4 rounded-xl bg-bg-secondary border border-border-default">
              <p className="text-xs font-medium text-text-tertiary mb-3">Claimed by</p>
              <Link
                href={`/profile/${bounty.hunter.walletAddress}`}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 rounded-full bg-bg-elevated flex items-center justify-center">
                  <User className="h-5 w-5 text-text-tertiary" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">
                    {bounty.hunter.username ||
                      bounty.hunter.walletAddress.slice(0, 8) + "..."}
                  </p>
                  <p className="text-xs text-text-tertiary">View profile</p>
                </div>
              </Link>
            </div>
          )}

          {/* Action Card */}
          {renderActionCard()}
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Submit Your Work"
        description="Provide details and proof of your completed work"
      >
        <div className="space-y-4">
          <Textarea
            label="What did you complete?"
            placeholder="Describe what you completed..."
            value={submissionDescription}
            onChange={(e) => setSubmissionDescription(e.target.value)}
            rows={4}
          />
          <Input
            label="Proof Link"
            placeholder="https://github.com/... or https://figma.com/..."
            value={proofLink}
            onChange={(e) => setProofLink(e.target.value)}
          />
          <ModalFooter>
            <Button variant="ghost" onClick={() => setShowSubmitModal(false)}>
              Cancel
            </Button>
            <TransactionButton
              onClick={() => {
                if (contractBountyId) submitHook.submitWork(contractBountyId, proofLink);
              }}
              isPending={submitHook.isPending}
              isConfirming={submitHook.isConfirming}
              isSuccess={submitHook.isSuccess}
              error={submitHook.error}
              hash={submitHook.hash}
              onReset={submitHook.reset}
              successMessage="Work submitted!"
              onSuccess={handleSubmitSuccess}
              disabled={!proofLink.trim() || !contractBountyId}
            >
              Submit Work
            </TransactionButton>
          </ModalFooter>
        </div>
      </Modal>

      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Request Changes"
        description="Provide feedback so the hunter can improve their submission"
      >
        <div className="space-y-4">
          <Textarea
            label="What needs to be changed?"
            placeholder="Explain what needs to be improved..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
          />
          <ModalFooter>
            <Button variant="ghost" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <TransactionButton
              onClick={() => {
                if (contractBountyId) rejectHook.rejectWork(contractBountyId, rejectReason);
              }}
              isPending={rejectHook.isPending}
              isConfirming={rejectHook.isConfirming}
              isSuccess={rejectHook.isSuccess}
              error={rejectHook.error}
              hash={rejectHook.hash}
              onReset={rejectHook.reset}
              variant="secondary"
              successMessage="Changes requested"
              onSuccess={handleRejectSuccess}
              disabled={!rejectReason.trim() || !contractBountyId}
            >
              Request Changes
            </TransactionButton>
          </ModalFooter>
        </div>
      </Modal>

      <Modal
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        title="Open Dispute"
        description={`A ${formattedDisputeFee} USDC fee is required. Refunded if you win.`}
      >
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <ul className="text-xs text-text-secondary space-y-1">
              <li>• An arbiter will review the dispute</li>
              <li>• Resolution takes up to 14 days</li>
              <li>• Win: get payment + fee refund</li>
            </ul>
          </div>
          <Input
            label="Evidence Link"
            placeholder="Link to evidence supporting your case..."
            value={disputeEvidence}
            onChange={(e) => setDisputeEvidence(e.target.value)}
          />
          <ModalFooter>
            <Button variant="ghost" onClick={() => setShowDisputeModal(false)}>
              Cancel
            </Button>
            <ApprovalFlow
              requiredAmount={disputeFeeAmount}
              onAction={() => {
                if (contractBountyId)
                  openDisputeHook.openDispute(contractBountyId, disputeEvidence);
              }}
              actionLabel={`Open Dispute (${formattedDisputeFee} USDC)`}
              actionIsPending={openDisputeHook.isPending}
              actionIsConfirming={openDisputeHook.isConfirming}
              actionIsSuccess={openDisputeHook.isSuccess}
              actionError={openDisputeHook.error}
              actionHash={openDisputeHook.hash}
              actionReset={openDisputeHook.reset}
              actionOnSuccess={handleDisputeSuccess}
              actionConfirmingText="Opening dispute..."
              actionSuccessMessage="Dispute opened!"
              disabled={!disputeEvidence.trim() || !contractBountyId}
            />
          </ModalFooter>
        </div>
      </Modal>

      <Modal
        isOpen={showEvidenceModal}
        onClose={() => setShowEvidenceModal(false)}
        title="Submit Counter-Evidence"
        description="Provide evidence to support your position"
      >
        <div className="space-y-4">
          <Input
            label="Evidence Link"
            placeholder="Link to evidence supporting your case..."
            value={creatorEvidence}
            onChange={(e) => setCreatorEvidence(e.target.value)}
          />
          <ModalFooter>
            <Button variant="ghost" onClick={() => setShowEvidenceModal(false)}>
              Cancel
            </Button>
            <TransactionButton
              onClick={() => {
                if (contractBountyId)
                  submitEvidenceHook.submitEvidence(contractBountyId, creatorEvidence);
              }}
              isPending={submitEvidenceHook.isPending}
              isConfirming={submitEvidenceHook.isConfirming}
              isSuccess={submitEvidenceHook.isSuccess}
              error={submitEvidenceHook.error}
              hash={submitEvidenceHook.hash}
              onReset={submitEvidenceHook.reset}
              successMessage="Evidence submitted!"
              onSuccess={handleEvidenceSuccess}
              disabled={!creatorEvidence.trim() || !contractBountyId}
            >
              Submit Evidence
            </TransactionButton>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  );
}

export default BountyDetail;
