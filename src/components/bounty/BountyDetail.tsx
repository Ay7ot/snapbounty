"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { TransactionButton } from "@/components/tx/TransactionButton";
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
} from "@/hooks/useContract";
import { BountyStatus } from "@/config/contracts";
import { updateBountyStatusByContractId } from "@/lib/actions/bounties";
import {
  createSubmissionByContractId,
  updateSubmissionStatusByContractId,
} from "@/lib/actions/submissions";
import type { Bounty, Submission } from "@/types";

interface BountyDetailProps {
  bounty: Bounty;
  submissions?: Submission[];
  onRefresh?: () => void;
}

// Category labels
const categoryLabels: Record<string, string> = {
  development: "Development",
  design: "Design",
  writing: "Writing",
  research: "Research",
  "ai-prompting": "AI Prompting",
  other: "Other",
};

// Difficulty labels
const difficultyLabels: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function BountyDetail({ bounty, submissions = [], onRefresh }: BountyDetailProps) {
  const { address, isConnected } = useAccount();

  // Use the contract bounty ID from the database
  const contractBountyId = bounty.contractBountyId ?? undefined;
  const hasContractId = contractBountyId !== undefined && contractBountyId > 0;

  // Contract hooks - only query if we have a valid contract ID
  const { bounty: contractBounty, refetch: refetchContract } = useBountyFromContract(hasContractId ? contractBountyId : undefined);
  const canClaim = useCanClaim(hasContractId ? contractBountyId : undefined);
  const isCreator = useIsCreator(hasContractId ? contractBountyId : undefined);
  const isHunter = useIsHunter(hasContractId ? contractBountyId : undefined);

  // Fallback to checking creator by wallet address if contract data isn't available
  const isCreatorByWallet = address && bounty.creator?.walletAddress?.toLowerCase() === address.toLowerCase();

  // Action hooks
  const claimHook = useClaimBounty();
  const submitHook = useSubmitWork();
  const approveHook = useApproveWork();
  const rejectHook = useRejectWork();
  const cancelHook = useCancelBounty();
  const releaseHook = useReleaseClaim();

  // Local state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [proofLink, setProofLink] = useState("");
  const [submissionDescription, setSubmissionDescription] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  // Get status from contract or fallback to Supabase
  const status = contractBounty?.status ?? BountyStatus.Open;
  const isOpen = status === BountyStatus.Open;
  const isClaimed = status === BountyStatus.Claimed;
  const isSubmitted = status === BountyStatus.Submitted;
  const isCompleted = status === BountyStatus.Completed;
  const isCancelled = status === BountyStatus.Cancelled;

  const handleRefresh = () => {
    refetchContract();
    onRefresh?.();
  };

  // Sync status to Supabase after successful contract actions
  const handleClaimSuccess = async () => {
    if (contractBountyId && address) {
      await updateBountyStatusByContractId(contractBountyId, "claimed", address);
    }
    handleRefresh();
  };

  const handleSubmitSuccess = async () => {
    if (contractBountyId && address) {
      // Create the submission record in the database
      await createSubmissionByContractId(
        contractBountyId,
        address,
        submissionDescription,
        proofLink || undefined
      );
      // Update bounty status
      await updateBountyStatusByContractId(contractBountyId, "submitted");
    }
    handleRefresh();
    setShowSubmitModal(false);
    setSubmissionDescription("");
    setProofLink("");
  };

  const handleApproveSuccess = async () => {
    if (contractBountyId) {
      // Update submission status to approved
      await updateSubmissionStatusByContractId(contractBountyId, "approved");
      // Update bounty status
      await updateBountyStatusByContractId(contractBountyId, "completed");
    }
    handleRefresh();
  };

  const handleRejectSuccess = async () => {
    if (contractBountyId) {
      // Update submission status to rejected with feedback
      await updateSubmissionStatusByContractId(contractBountyId, "rejected", rejectReason);
      // Update bounty status back to claimed so hunter can resubmit
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

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No deadline";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Render action buttons based on status and user role
  const renderActions = () => {
    // Not connected - show prompt
    if (!isConnected) {
      return (
        <div className="p-5 rounded-xl bg-linear-to-br from-bg-secondary to-bg-elevated border border-border-default">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-accent-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-accent-primary" />
            </div>
            <div>
              <p className="font-medium text-text-primary">Connect to Interact</p>
              <p className="text-sm text-text-secondary mt-1">
                Connect your wallet to claim this bounty or see available actions.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // No contract ID - bounty might not be on-chain yet
    if (!hasContractId) {
      return (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-center gap-2 text-amber-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">Bounty Not On-Chain</span>
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            This bounty hasn&apos;t been linked to a smart contract yet. Actions will be available once it&apos;s on-chain.
          </p>
        </div>
      );
    }

    // Completed or cancelled - show status
    if (isCompleted) {
      return (
        <div className="p-4 rounded-xl bg-accent-green/10 border border-accent-green/30">
          <div className="flex items-center gap-2 text-accent-green">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">Bounty Completed</span>
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            This bounty has been successfully completed and payment released.
          </p>
        </div>
      );
    }

    if (isCancelled) {
      return (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <div className="flex items-center gap-2 text-red-400">
            <XCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Bounty Cancelled</span>
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            This bounty has been cancelled by the creator.
          </p>
        </div>
      );
    }

    // Creator actions
    if (isCreator || isCreatorByWallet) {
      return (
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-accent-blue/10 border border-accent-blue/30">
            <p className="text-xs font-medium text-accent-blue">You created this bounty</p>
          </div>

          {isOpen && (
            <div className="space-y-3">
              <p className="text-sm text-text-secondary">
                Your bounty is open and waiting for hunters. You can cancel it if needed.
              </p>
              <TransactionButton
                onClick={() => { if (contractBountyId) cancelHook.cancelBounty(contractBountyId); }}
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
              <div className="flex items-center gap-2 text-amber-500">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Hunter Working</span>
              </div>
              <p className="mt-1 text-xs text-text-secondary">
                A hunter has claimed this bounty and is working on it.
              </p>
            </div>
          )}

          {isSubmitted && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-accent-purple/10 border border-accent-purple/30">
                <div className="flex items-center gap-2 text-accent-purple">
                  <Target className="h-4 w-4" />
                  <span className="text-sm font-medium">Work Submitted - Review Required</span>
                </div>
                <p className="mt-1 text-xs text-text-secondary">
                  The hunter has submitted their work. Review it below and approve or reject.
                </p>
              </div>
              <TransactionButton
                onClick={() => { if (contractBountyId) approveHook.approveWork(contractBountyId); }}
                isPending={approveHook.isPending}
                isConfirming={approveHook.isConfirming}
                isSuccess={approveHook.isSuccess}
                error={approveHook.error}
                hash={approveHook.hash}
                onReset={approveHook.reset}
                successMessage="Work approved! Payment released."
                onSuccess={handleApproveSuccess}
                className="w-full"
                disabled={!contractBountyId}
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve & Pay
              </TransactionButton>
              <Button
                variant="ghost"
                onClick={() => setShowRejectModal(true)}
                className="w-full"
              >
                <XCircle className="h-4 w-4" />
                Reject Submission
              </Button>
            </div>
          )}
        </div>
      );
    }

    // Hunter actions (user who claimed the bounty)
    if (isHunter) {
      return (
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-accent-green/10 border border-accent-green/30">
            <p className="text-xs font-medium text-accent-green">You&apos;re working on this bounty</p>
          </div>

          {isClaimed && (
            <div className="space-y-3">
              <p className="text-sm text-text-secondary">
                Submit your work when complete, or release your claim if you can&apos;t finish.
              </p>
              <Button onClick={() => setShowSubmitModal(true)} className="w-full" size="lg">
                Submit Work
              </Button>
              <TransactionButton
                onClick={() => { if (contractBountyId) releaseHook.releaseClaim(contractBountyId); }}
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
              <div className="flex items-center gap-2 text-accent-green">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Awaiting Review</span>
              </div>
              <p className="mt-1 text-xs text-text-secondary">
                Your submission is being reviewed by the bounty creator. You&apos;ll be notified of the result.
              </p>
            </div>
          )}
        </div>
      );
    }

    // Other users - potential hunters
    if (isOpen) {
      if (canClaim) {
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-linear-to-br from-accent-green/10 to-accent-blue/10 border border-accent-green/30">
              <div className="flex items-center gap-2 text-accent-green mb-2">
                <Target className="h-4 w-4" />
                <span className="text-sm font-medium">Ready to Work?</span>
              </div>
              <p className="text-xs text-text-secondary">
                Claim this bounty to start working on it. You&apos;ll have exclusive access until you submit or release.
              </p>
            </div>
            <TransactionButton
              onClick={() => { if (contractBountyId) claimHook.claimBounty(contractBountyId); }}
              isPending={claimHook.isPending}
              isConfirming={claimHook.isConfirming}
              isSuccess={claimHook.isSuccess}
              error={claimHook.error}
              hash={claimHook.hash}
              onReset={claimHook.reset}
              successMessage="Bounty claimed! You can now work on it."
              onSuccess={handleClaimSuccess}
              className="w-full"
              size="lg"
              disabled={!contractBountyId}
            >
              Claim Bounty
            </TransactionButton>
          </div>
        );
      } else {
        // User can't claim - show reason
        return (
          <div className="p-4 rounded-xl bg-bg-secondary border border-border-default">
            <div className="flex items-center gap-2 text-text-tertiary mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Cannot Claim</span>
            </div>
            <p className="text-xs text-text-secondary">
              You may already have an active claim on another bounty, or this bounty has expired.
            </p>
          </div>
        );
      }
    }

    if (isClaimed) {
      return (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-center gap-2 text-amber-500">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">In Progress</span>
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            This bounty is being worked on by another hunter.
          </p>
        </div>
      );
    }

    if (isSubmitted) {
      return (
        <div className="p-4 rounded-xl bg-accent-purple/10 border border-accent-purple/30">
          <div className="flex items-center gap-2 text-accent-purple">
            <Target className="h-4 w-4" />
            <span className="text-sm font-medium">Under Review</span>
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            Work has been submitted and is awaiting review by the creator.
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="mx-auto space-y-6">
      {/* Main Card */}
      <div className="overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-linear-to-r from-bg-elevated to-bg-tertiary p-6 border-b border-border-default">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-3">
              <BountyStatusBadge status={bounty.status} />
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary leading-tight">
                {bounty.title}
              </h1>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
              <p className="text-2xl sm:text-3xl font-bold text-accent-green">${bounty.reward}</p>
              <p className="text-xs text-text-tertiary">{bounty.rewardToken}</p>
            </div>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Meta info */}
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
            <div className="flex items-center gap-2 text-text-secondary">
              <User className="h-4 w-4 shrink-0 text-text-tertiary" />
              <Link
                href={`/profile/${bounty.creator?.walletAddress || bounty.creatorId}`}
                className="hover:text-accent-green transition-colors"
              >
                {bounty.creator?.username || "Anonymous"}
              </Link>
            </div>
            <div className="flex items-center gap-2 text-text-secondary">
              <Calendar className="h-4 w-4 shrink-0 text-text-tertiary" />
              <span>{formatDate(bounty.createdAt)}</span>
            </div>
            {bounty.deadline && (
              <div className="flex items-center gap-2 text-text-secondary">
                <Clock className="h-4 w-4 shrink-0 text-text-tertiary" />
                <span>Due: {formatDate(bounty.deadline)}</span>
              </div>
            )}
          </div>

          {/* Category & Difficulty chips */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-secondary border border-border-default">
              <Layers className="h-4 w-4 text-accent-blue" />
              <span className="text-sm text-text-primary">{categoryLabels[bounty.category] || bounty.category}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-secondary border border-border-default">
              <Target className="h-4 w-4 text-accent-purple" />
              <span className="text-sm text-text-primary">{difficultyLabels[bounty.difficulty] || bounty.difficulty}</span>
            </div>
          </div>

          {/* Tags */}
          {bounty.tags && bounty.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {bounty.tags.map((tag) => (
                <Badge key={tag} variant="closed" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-text-primary">Description</h3>
            <div className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap wrap-break-word">
              {bounty.description}
            </div>
          </div>

          {/* Acceptance Criteria */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-text-primary">Acceptance Criteria</h3>
            <div className="p-4 rounded-xl bg-bg-secondary border border-border-default">
              <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap wrap-break-word">
                {bounty.acceptanceCriteria}
              </p>
            </div>
          </div>

          {/* Hunter info (if claimed) */}
          {bounty.hunter && (
            <div className="p-4 rounded-xl bg-bg-secondary border border-border-default">
              <p className="text-xs text-text-tertiary mb-2">Claimed by</p>
              <Link
                href={`/profile/${bounty.hunter.walletAddress}`}
                className="text-text-primary hover:text-accent-green flex items-center gap-2 transition-colors"
              >
                <User className="h-4 w-4" />
                <span className="break-all">
                  {bounty.hunter.username || bounty.hunter.walletAddress.slice(0, 8) + "..."}
                </span>
              </Link>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-border-default">{renderActions()}</div>
        </CardContent>
      </div>

      {/* Submissions Section (for creator) */}
      {isCreator && submissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Submissions
              <span className="text-sm font-normal text-text-tertiary">({submissions.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="p-5 rounded-xl bg-bg-secondary border border-border-default"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Submission</span>
                          <span className="text-xs text-text-tertiary">• {new Date(submission.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-text-primary leading-relaxed wrap-break-word whitespace-pre-wrap">
                          {submission.description}
                        </p>
                      </div>
                      <Badge
                        variant={
                          submission.status === "approved"
                            ? "completed"
                            : submission.status === "rejected"
                              ? "closed"
                              : "pending"
                        }
                        className="shrink-0 self-start"
                      >
                        {submission.status}
                      </Badge>
                    </div>

                    {submission.proofLink && (
                      <div className="pt-3 border-t border-border-default/50">
                        <a
                          href={submission.proofLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-green hover:underline break-all"
                        >
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          {submission.proofLink}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Work Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Submit Your Work"
        description="Provide proof of your completed work"
      >
        <div className="space-y-4">
          <Textarea
            label="Description"
            placeholder="Describe what you completed..."
            value={submissionDescription}
            onChange={(e) => setSubmissionDescription(e.target.value)}
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
              onClick={() => { if (contractBountyId) submitHook.submitWork(contractBountyId, proofLink); }}
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

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Submission"
        description="Provide feedback for the hunter"
      >
        <div className="space-y-4">
          <Textarea
            label="Reason for rejection"
            placeholder="Explain what needs to be improved..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <ModalFooter>
            <Button variant="ghost" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <TransactionButton
              onClick={() => { if (contractBountyId) rejectHook.rejectWork(contractBountyId, rejectReason); }}
              isPending={rejectHook.isPending}
              isConfirming={rejectHook.isConfirming}
              isSuccess={rejectHook.isSuccess}
              error={rejectHook.error}
              hash={rejectHook.hash}
              onReset={rejectHook.reset}
              variant="danger"
              successMessage="Submission rejected"
              onSuccess={handleRejectSuccess}
              disabled={!rejectReason.trim() || !contractBountyId}
            >
              Reject
            </TransactionButton>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  );
}

export default BountyDetail;
