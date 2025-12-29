"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { Check, ChevronRight, Loader2 } from "lucide-react";
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

  const [currentStep, setCurrentStep] = useState<Step>(hasEnoughAllowance ? "action" : "approve");

  // Update step when allowance changes
  useEffect(() => {
    if (hasEnoughAllowance) {
      setCurrentStep("action");
    }
  }, [hasEnoughAllowance]);

  // Handle approval success
  useEffect(() => {
    if (approveIsSuccess) {
      // Refetch allowance after approval
      const timer = setTimeout(() => {
        refetchAllowance();
        onApprovalComplete?.();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [approveIsSuccess, refetchAllowance, onApprovalComplete]);

  // If user doesn't have enough balance, show error state
  if (!hasEnoughBalance) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-accent-red/10 border border-accent-red/30">
          <p className="text-sm text-accent-red font-medium">Insufficient USDC Balance</p>
          <p className="text-xs text-text-secondary mt-1">
            You need ${requiredAmount.toFixed(2)} USDC but only have ${formattedBalance} USDC.
          </p>
        </div>
        <Button disabled className="w-full">
          Insufficient Balance
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Step Indicator */}
      {!hasEnoughAllowance && (
        <div className="flex items-center gap-2 text-sm">
          <StepIndicator
            step={1}
            label="Approve USDC"
            isActive={currentStep === "approve"}
            isComplete={hasEnoughAllowance}
          />
          <ChevronRight className="h-4 w-4 text-text-tertiary" />
          <StepIndicator
            step={2}
            label={actionLabel}
            isActive={currentStep === "action"}
            isComplete={actionIsSuccess}
          />
        </div>
      )}

      {/* Approval Step */}
      {currentStep === "approve" && !hasEnoughAllowance && (
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">
            Allow SnapBounty to use your USDC for creating bounties.
          </p>
          <TransactionButton
            onClick={approveMax}
            isPending={approveIsPending}
            isConfirming={approveIsConfirming}
            isSuccess={approveIsSuccess}
            error={approveError}
            hash={approveHash}
            onReset={resetApprove}
            pendingText="Approve in wallet..."
            confirmingText="Approving USDC..."
            successMessage="USDC spending approved!"
            className="w-full"
            disabled={disabled}
          >
            Approve USDC
          </TransactionButton>
        </div>
      )}

      {/* Action Step */}
      {(currentStep === "action" || hasEnoughAllowance) && (
        <TransactionButton
          onClick={onAction}
          isPending={actionIsPending}
          isConfirming={actionIsConfirming}
          isSuccess={actionIsSuccess}
          error={actionError}
          hash={actionHash}
          onReset={actionReset}
          pendingText="Confirm in wallet..."
          confirmingText="Processing..."
          successMessage="Transaction successful!"
          className="w-full"
          disabled={disabled || !hasEnoughAllowance}
        >
          {actionLabel}
        </TransactionButton>
      )}

      {/* Balance & Allowance Info */}
      <div className="text-xs text-text-tertiary text-center space-y-1">
        <p>Balance: ${formattedBalance} USDC</p>
        <p>
          Allowance: {allowance > 0n ? `$${formatUnits(allowance, 6)}` : "Not approved"} USDC
          {hasEnoughAllowance && <span className="text-accent-green ml-1">✓</span>}
        </p>
      </div>
    </div>
  );
}

function StepIndicator({
  step,
  label,
  isActive,
  isComplete,
}: {
  step: number;
  label: string;
  isActive: boolean;
  isComplete: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
          isComplete
            ? "bg-accent-green text-bg-primary"
            : isActive
            ? "bg-accent-green/20 text-accent-green border border-accent-green"
            : "bg-bg-elevated text-text-tertiary"
        )}
      >
        {isComplete ? <Check className="h-3 w-3" /> : step}
      </div>
      <span
        className={cn(
          "text-sm",
          isActive ? "text-text-primary" : isComplete ? "text-accent-green" : "text-text-tertiary"
        )}
      >
        {label}
      </span>
    </div>
  );
}

export default ApprovalFlow;


