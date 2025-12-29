"use client";

import { useEffect, useState, useRef, type ReactNode } from "react";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/Button";
import { useToastActions } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

interface TransactionButtonProps extends Omit<ButtonProps, "onClick"> {
  onClick: () => void | Promise<void>;
  isPending?: boolean;
  isConfirming?: boolean;
  isSuccess?: boolean;
  error?: Error | null;
  hash?: `0x${string}`;
  onSuccess?: () => void | Promise<void>;
  onReset?: () => void;
  successMessage?: string;
  errorMessage?: string;
  pendingText?: string;
  confirmingText?: string;
  children: ReactNode;
  showToasts?: boolean;
}

export function TransactionButton({
  onClick,
  isPending = false,
  isConfirming = false,
  isSuccess = false,
  error = null,
  hash,
  onSuccess,
  onReset,
  successMessage = "Transaction successful!",
  errorMessage,
  pendingText = "Confirm in wallet...",
  confirmingText = "Confirming...",
  children,
  showToasts = true,
  disabled,
  className,
  ...props
}: TransactionButtonProps) {
  const toast = useToastActions();
  const [localError, setLocalError] = useState<string | null>(null);
  const lastErrorRef = useRef<Error | null>(null);
  const hasShownSuccessRef = useRef(false);

  // Handle external error changes
  useEffect(() => {

    // New error appeared
    if (error && error !== lastErrorRef.current) {
      const message = errorMessage || getErrorMessage(error);
      const isUserRejection = message === "Transaction cancelled";

      // CRITICAL: If we have a hash, the transaction was submitted!
      // Only show error if:
      // 1. User explicitly rejected (no hash will exist)
      // 2. There's no hash (transaction never submitted)
      // If we have a hash, the tx was submitted - wait for receipt instead
      if (!hash || isUserRejection) {
        console.log("Showing error (no hash or user rejected):", message);
        setLocalError(message);
        lastErrorRef.current = error;

        if (showToasts) {
          toast.error("Transaction failed", message);
        }
      } else {
        // We have a hash but also an error - this means the tx was submitted
        // but there was an RPC error. Don't show error, wait for receipt.
        console.log("IGNORING error because we have hash:", hash);
      }
    }

    // Error was cleared externally (e.g., by reset)
    if (!error && lastErrorRef.current) {
      setLocalError(null);
      lastErrorRef.current = null;
    }
  }, [error, errorMessage, showToasts, toast, hash, isPending, isConfirming, isSuccess]);

  // Handle success
  useEffect(() => {
    const handleSuccess = async () => {
      if (isSuccess && !hasShownSuccessRef.current) {
        hasShownSuccessRef.current = true;
        setLocalError(null);
        lastErrorRef.current = null;

        if (showToasts) {
          toast.success(successMessage, undefined, hash);
        }

        // Await the onSuccess callback to ensure server actions complete
        if (onSuccess) {
          try {
            await onSuccess();
          } catch (err) {
            console.error("onSuccess callback error:", err);
          }
        }
      }
    };

    handleSuccess();

    // Reset success tracking when not successful
    if (!isSuccess) {
      hasShownSuccessRef.current = false;
    }
  }, [isSuccess, showToasts, successMessage, hash, onSuccess, toast]);

  const isLoading = isPending || isConfirming;

  const handleClick = async () => {
    // Don't allow clicking while loading
    if (isLoading) return;

    // Clear error state immediately when user clicks
    setLocalError(null);
    lastErrorRef.current = null;

    // Reset wagmi state if provided
    onReset?.();

    try {
      await onClick();
    } catch (err) {
      console.error("Transaction error:", err instanceof Error ? err.message : String(err));
    }
  };

  const getButtonContent = () => {
    if (isPending) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {pendingText}
        </>
      );
    }
    if (isConfirming) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {confirmingText}
        </>
      );
    }
    if (isSuccess) {
      return (
        <>
          <Check className="h-4 w-4" />
          Success!
        </>
      );
    }
    return children;
  };

  return (
    <div className="space-y-2">
      <Button
        {...props}
        variant={isSuccess ? "primary" : props.variant || "primary"}
        disabled={disabled || isLoading}
        onClick={handleClick}
        className={cn(
          isSuccess && "bg-accent-green text-bg-primary hover:bg-accent-green/90",
          className
        )}
      >
        {getButtonContent()}
      </Button>

      {/* Error message below button - only show if not confirming/success */}
      {localError && !isConfirming && !isSuccess && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-accent-red/10 border border-accent-red/30">
          <AlertCircle className="h-4 w-4 text-accent-red shrink-0 mt-0.5" />
          <p className="text-sm text-accent-red">{localError}</p>
        </div>
      )}
    </div>
  );
}

// Helper to safely stringify errors that may contain BigInt
function safeStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    );
  } catch {
    return String(obj);
  }
}

// Helper to extract meaningful error messages
function getErrorMessage(error: Error): string {
  let message: string;

  try {
    // Try to get the raw message
    message = error.message || "";

    // Try to parse nested JSON-RPC errors
    if (message.includes("Internal JSON-RPC error")) {
      // Try to extract more details from the error
      const errorObj = error as unknown as { data?: { message?: string }; cause?: { message?: string } };

      if (errorObj.data?.message) {
        message = errorObj.data.message;
      } else if (errorObj.cause?.message) {
        message = errorObj.cause.message;
      }
    }
  } catch {
    message = safeStringify(error);
  }

  const lowerMessage = message.toLowerCase();

  // User rejection
  if (lowerMessage.includes("user rejected") || lowerMessage.includes("user denied")) {
    return "Transaction cancelled";
  }

  // Gas/balance issues
  if (lowerMessage.includes("insufficient funds")) {
    return "Insufficient ETH for gas fees";
  }

  // Allowance issues
  if (lowerMessage.includes("insufficient allowance") || lowerMessage.includes("erc20: insufficient allowance")) {
    return "Please approve USDC spending first";
  }

  // Transfer failed (likely insufficient USDC balance or no allowance)
  if (lowerMessage.includes("transferfailed") || lowerMessage.includes("transfer failed")) {
    return "Transfer failed - check your USDC balance and approval";
  }

  // Contract-specific errors
  if (lowerMessage.includes("alreadyhasactiveclaim")) {
    return "You already have an active bounty claim";
  }
  if (lowerMessage.includes("invalidstatus")) {
    return "Bounty is not in the correct status for this action";
  }
  if (lowerMessage.includes("notbountycreator")) {
    return "Only the bounty creator can perform this action";
  }
  if (lowerMessage.includes("notbountyhunter")) {
    return "Only the assigned hunter can perform this action";
  }
  if (lowerMessage.includes("bountyexpired")) {
    return "This bounty has expired";
  }
  if (lowerMessage.includes("invalidamount")) {
    return "Invalid amount specified";
  }

  // Generic RPC error - could be timeout or actual failure
  if (lowerMessage.includes("internal json-rpc error")) {
    return "Transaction may have failed or timed out. Check your wallet for the actual status.";
  }

  if (lowerMessage.includes("execution reverted")) {
    return "Transaction reverted - check your USDC balance and approval";
  }

  // Truncate and return original message
  const cleanMessage = message.replace(/Error:|error:/gi, "").trim();
  return cleanMessage.slice(0, 100) || "Transaction failed";
}

export default TransactionButton;
