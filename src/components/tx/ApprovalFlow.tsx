"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { parseUnits } from "viem";
import { Check, AlertCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TransactionButton } from "./TransactionButton";
import { useUsdcAllowance, useUsdcBalance, useApproveUsdc } from "@/hooks/useContract";
import { cn } from "@/lib/utils";

interface ApprovalFlowProps {
  requiredAmount: number; // Amount in USDC (human readable, e.g., 100 for $100)
  onApprovalComplete?: () => void;
  onAction: () => void;
  actionLabel: string;
  actionIsPending?: boolean;
  actionIsConfirming?: boolean;
  actionIsSuccess?: boolean;
  actionError?: Error | null;
  actionHash?: `0x${string}`;
  actionReset?: () => void;
  actionOnSuccess?: () => void | Promise<void>;
  actionConfirmingText?: string;
  actionSuccessMessage?: string;
  disabled?: boolean;
}

type Step = "approve" | "action";

export function ApprovalFlow({
  requiredAmount,
  onApprovalComplete,
  onAction,
  actionLabel,
  actionIsPending = false,
  actionIsConfirming = false,
  actionIsSuccess = false,
  actionError = null,
  actionHash,
  actionReset,
  actionOnSuccess,
  actionConfirmingText = "Processing...",
  actionSuccessMessage = "Transaction successful!",
  disabled = false,
}: ApprovalFlowProps) {
  const { address } = useAccount();
  const { balance, formattedBalance } = useUsdcBalance(address);
  const { allowance, refetch: refetchAllowance } = useUsdcAllowance(address);
  const {
    approveMax,
    isPending: approveIsPending,
    isConfirming: approveIsConfirming,
    isSuccess: approveIsSuccess,
    error: approveError,
    hash: approveHash,
    reset: resetApprove,
  } = useApproveUsdc();

  const requiredAmountWei = parseUnits(requiredAmount.toString(), 6);
  const hasEnoughBalance = balance >= requiredAmountWei;
  const hasEnoughAllowance = allowance >= requiredAmountWei;

  const [currentStep, setCurrentStep] = useState<Step>("approve");

  // Force refetch allowance on mount to avoid stale cache
  useEffect(() => {
    refetchAllowance();
  }, [refetchAllowance]);

  // Update step when allowance changes
  useEffect(() => {
    if (hasEnoughAllowance) {
      setCurrentStep("action");
    } else {
      setCurrentStep("approve");
    }
  }, [hasEnoughAllowance]);

  // Handle approval success
  useEffect(() => {
    if (approveIsSuccess) {
      const timer = setTimeout(() => {
        refetchAllowance();
        onApprovalComplete?.();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [approveIsSuccess, refetchAllowance, onApprovalComplete]);

  // Insufficient balance state
  if (!hasEnoughBalance) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-accent-red/10 border border-accent-red/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-accent-red shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-accent-red">Insufficient USDC Balance</p>
              <p className="text-xs text-text-secondary mt-1">
                You need ${requiredAmount.toFixed(2)} USDC but only have ${formattedBalance}.
              </p>
            </div>
          </div>
        </div>
        <Button disabled className="w-full">
          Insufficient Balance
        </Button>
      </div>
    );
  }

  // Already approved - show single action button
  if (hasEnoughAllowance) {
    return (
      <TransactionButton
        onClick={onAction}
        isPending={actionIsPending}
        isConfirming={actionIsConfirming}
        isSuccess={actionIsSuccess}
        error={actionError}
        hash={actionHash}
        onReset={actionReset}
        onSuccess={actionOnSuccess}
        pendingText="Confirm in wallet..."
        confirmingText={actionConfirmingText}
        successMessage={actionSuccessMessage}
        className="w-full"
        size="lg"
        disabled={disabled}
      >
        {actionLabel}
      </TransactionButton>
    );
  }

  // Need approval flow
  return (
    <div className="space-y-4">
      {/* Compact two-step indicator */}
      <div className="flex items-center justify-center gap-2">
        {/* Step 1 */}
        <div className="flex flex-col items-center gap-1">
          <div
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
              currentStep === "approve"
                ? "bg-accent-green text-bg-primary ring-2 ring-accent-green/30 ring-offset-2 ring-offset-bg-primary"
                : "bg-accent-green text-bg-primary"
            )}
          >
            {hasEnoughAllowance ? <Check className="h-4 w-4" /> : "1"}
          </div>
          <span className="text-[11px] font-medium text-text-secondary">Approve</span>
        </div>

        {/* Connector line */}
        <div className="w-12 sm:w-16 h-0.5 bg-border-default rounded-full overflow-hidden mb-5">
          <div
            className={cn(
              "h-full bg-accent-green transition-all duration-500",
              hasEnoughAllowance ? "w-full" : "w-0"
            )}
          />
        </div>

        {/* Step 2 */}
        <div className="flex flex-col items-center gap-1">
          <div
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
              currentStep === "action"
                ? "bg-accent-green/20 text-accent-green border-2 border-accent-green"
                : "bg-bg-elevated text-text-tertiary border border-border-default"
            )}
          >
            2
          </div>
          <span className="text-[11px] font-medium text-text-secondary">Confirm</span>
        </div>
      </div>

      {/* Approval explanation - more compact */}
      <div className="p-3 rounded-xl bg-accent-blue/5 border border-accent-blue/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center shrink-0">
            <Shield className="h-4 w-4 text-accent-blue" />
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Approve SnapBounty to access your USDC. This is a one-time setup.
          </p>
        </div>
      </div>

      {/* Approval button */}
      <TransactionButton
        onClick={approveMax}
        isPending={approveIsPending}
        isConfirming={approveIsConfirming}
        isSuccess={approveIsSuccess}
        error={approveError}
        hash={approveHash}
        onReset={resetApprove}
        pendingText="Confirm in wallet..."
        confirmingText="Approving..."
        successMessage="Approved!"
        className="w-full"
        size="lg"
        disabled={disabled}
      >
        Approve USDC
      </TransactionButton>
    </div>
  );
}

export default ApprovalFlow;
