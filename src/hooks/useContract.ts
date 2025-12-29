"use client";

import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import {
  useAccount,
  useChainId,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useWatchContractEvent,
} from "wagmi";
import { parseUnits, formatUnits, keccak256, toBytes } from "viem";
import {
  ESCROW_ADDRESSES,
  USDC_ADDRESSES,
  SNAP_BOUNTY_ESCROW_ABI,
  ERC20_ABI,
  BountyStatus,
  type ContractBounty,
} from "@/config/contracts";

// ============ Contract Address Hooks ============

export function useEscrowAddress() {
  const chainId = useChainId();
  return ESCROW_ADDRESSES[chainId] || ESCROW_ADDRESSES[84532]; // Default to Base Sepolia
}

export function useUsdcAddress() {
  const chainId = useChainId();
  return USDC_ADDRESSES[chainId] || USDC_ADDRESSES[84532];
}

// ============ Read Hooks ============

/**
 * Get bounty data from contract
 */
export function useBountyFromContract(bountyId: number | undefined) {
  const escrowAddress = useEscrowAddress();

  const { data, isLoading, error, refetch } = useReadContract({
    address: escrowAddress,
    abi: SNAP_BOUNTY_ESCROW_ABI,
    functionName: "getBounty",
    args: bountyId ? [BigInt(bountyId)] : undefined,
    query: {
      enabled: !!bountyId && bountyId > 0,
    },
  });

  return {
    bounty: data as ContractBounty | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Get total bounty count
 */
export function useBountyCount() {
  const escrowAddress = useEscrowAddress();

  const { data, isLoading, error, refetch } = useReadContract({
    address: escrowAddress,
    abi: SNAP_BOUNTY_ESCROW_ABI,
    functionName: "bountyCount",
  });

  return {
    count: data ? Number(data) : 0,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Get user's active claim
 */
export function useActiveClaim(address?: `0x${string}`) {
  const escrowAddress = useEscrowAddress();

  const { data, isLoading, error, refetch } = useReadContract({
    address: escrowAddress,
    abi: SNAP_BOUNTY_ESCROW_ABI,
    functionName: "activeClaim",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    activeClaimId: data ? Number(data) : 0,
    hasActiveClaim: data ? Number(data) > 0 : false,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Check if bounty is expired
 */
export function useIsExpired(bountyId: number | undefined) {
  const escrowAddress = useEscrowAddress();

  const { data, isLoading, error } = useReadContract({
    address: escrowAddress,
    abi: SNAP_BOUNTY_ESCROW_ABI,
    functionName: "isExpired",
    args: bountyId ? [BigInt(bountyId)] : undefined,
    query: {
      enabled: !!bountyId && bountyId > 0,
    },
  });

  return {
    isExpired: data ?? false,
    isLoading,
    error,
  };
}

/**
 * Get USDC balance for an address
 */
export function useUsdcBalance(address?: `0x${string}`) {
  const usdcAddress = useUsdcAddress();

  const { data, isLoading, error, refetch } = useReadContract({
    address: usdcAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    balance: data ?? BigInt(0),
    formattedBalance: data ? formatUnits(data, 6) : "0",
    isLoading,
    error,
    refetch,
  };
}

/**
 * Get USDC allowance for escrow contract
 */
export function useUsdcAllowance(address?: `0x${string}`) {
  const usdcAddress = useUsdcAddress();
  const escrowAddress = useEscrowAddress();

  const { data, isLoading, error, refetch } = useReadContract({
    address: usdcAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, escrowAddress] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    allowance: data ?? BigInt(0),
    isLoading,
    error,
    refetch,
  };
}

// ============ Write Hooks ============

/**
 * Approve USDC spending
 */
export function useApproveUsdc() {
  const usdcAddress = useUsdcAddress();
  const escrowAddress = useEscrowAddress();

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = useCallback(
    async (amount: bigint) => {
      writeContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [escrowAddress, amount],
      });
    },
    [writeContract, usdcAddress, escrowAddress]
  );

  const approveMax = useCallback(async () => {
    const maxAmount = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
    writeContract({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [escrowAddress, maxAmount],
    });
  }, [writeContract, usdcAddress, escrowAddress]);

  return {
    approve,
    approveMax,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Create a bounty on the contract
 */
export function useCreateBounty() {
  const escrowAddress = useEscrowAddress();
  const { address } = useAccount();

  const { writeContract, data: hash, isPending, error: writeError, reset: resetWrite } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isReceiptSuccess, data: receipt } = useWaitForTransactionReceipt({
    hash,
  });

  // Event tracking state for robust success detection
  const [eventBountyId, setEventBountyId] = useState<number | null>(null);
  const [isEventSuccess, setIsEventSuccess] = useState(false);
  const [isWaitingForEvent, setIsWaitingForEvent] = useState(false);
  const [shouldShowError, setShouldShowError] = useState(false);
  const startTimeRef = useRef<number>(0);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Watch for BountyCreated events to detect success even if transaction hash is missing
  useWatchContractEvent({
    address: escrowAddress,
    abi: SNAP_BOUNTY_ESCROW_ABI,
    eventName: "BountyCreated",
    args: { creator: address },
    onLogs(logs) {
      const log = logs[0];
      // Only accept events that happened after we started the process
      if (log && startTimeRef.current > 0 && Date.now() > startTimeRef.current) {
        console.log("Found BountyCreated event via listener:", log);
        // @ts-ignore - Args are typed but sometimes complex in wagmi
        const id = Number(log.args.bountyId);
        setEventBountyId(id);
        setIsEventSuccess(true);
        setIsWaitingForEvent(false);
        setShouldShowError(false);
        // Clear any pending error timeout
        if (errorTimeoutRef.current) {
          clearTimeout(errorTimeoutRef.current);
          errorTimeoutRef.current = null;
        }
      }
    },
    enabled: !!address && startTimeRef.current > 0,
  });

  // Handle error display with delay to allow event listener to catch success
  useEffect(() => {
    // If we have an error but no hash, wait for event listener before showing error
    if (writeError && !hash && !isEventSuccess && !isPending) {
      setIsWaitingForEvent(true);
      setShouldShowError(false);

      // Wait 15 seconds for event listener to potentially detect success
      errorTimeoutRef.current = setTimeout(() => {
        if (!isEventSuccess) {
          console.log("Event timeout reached, showing error");
          setIsWaitingForEvent(false);
          setShouldShowError(true);
        }
      }, 15000);
    }

    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, [writeError, hash, isEventSuccess, isPending]);

  const createBounty = useCallback(
    async (rewardUsdc: number, deadlineTimestamp: number = 0) => {
      startTimeRef.current = Date.now();
      setEventBountyId(null);
      setIsEventSuccess(false);
      setIsWaitingForEvent(false);
      setShouldShowError(false);

      const rewardWei = parseUnits(rewardUsdc.toString(), 6);

      // Debug logging
      console.log("=== CREATE BOUNTY DEBUG ===");
      console.log("Reward (USDC):", rewardUsdc);
      console.log("Reward (Wei):", rewardWei.toString());
      console.log("Deadline:", deadlineTimestamp);
      console.log("Escrow Address:", escrowAddress);
      console.log("===========================");

      writeContract({
        address: escrowAddress,
        abi: SNAP_BOUNTY_ESCROW_ABI,
        functionName: "createBounty",
        args: [rewardWei, BigInt(deadlineTimestamp)],
      });
    },
    [writeContract, escrowAddress]
  );

  const reset = useCallback(() => {
    resetWrite();
    setEventBountyId(null);
    setIsEventSuccess(false);
    setIsWaitingForEvent(false);
    setShouldShowError(false);
    startTimeRef.current = 0;
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
  }, [resetWrite]);

  // Determine what error to expose
  // - Hide error if event success detected
  // - Hide error if we're still waiting for event listener
  // - Only show error after timeout if no event detected
  const exposedError = isEventSuccess ? null : (shouldShowError ? writeError : null);

  return {
    createBounty,
    hash,
    isPending: isPending || isWaitingForEvent, // Show as pending while waiting for event
    isConfirming,
    isSuccess: isReceiptSuccess || isEventSuccess,
    receipt,
    createdBountyId: eventBountyId,
    error: exposedError,
    reset,
  };
}

/**
 * Claim a bounty
 */
export function useClaimBounty() {
  const escrowAddress = useEscrowAddress();
  const { address } = useAccount();

  const { writeContract, data: hash, isPending, error: writeError, reset: resetWrite } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isReceiptSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Event tracking state
  const [isEventSuccess, setIsEventSuccess] = useState(false);
  const [isWaitingForEvent, setIsWaitingForEvent] = useState(false);
  const [shouldShowError, setShouldShowError] = useState(false);
  const startTimeRef = useRef<number>(0);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Watch for BountyClaimed events
  useWatchContractEvent({
    address: escrowAddress,
    abi: SNAP_BOUNTY_ESCROW_ABI,
    eventName: "BountyClaimed",
    args: { hunter: address },
    onLogs(logs) {
      const log = logs[0];
      if (log && startTimeRef.current > 0 && Date.now() > startTimeRef.current) {
        console.log("Found BountyClaimed event via listener:", log);
        setIsEventSuccess(true);
        setIsWaitingForEvent(false);
        setShouldShowError(false);
        if (errorTimeoutRef.current) {
          clearTimeout(errorTimeoutRef.current);
          errorTimeoutRef.current = null;
        }
      }
    },
    enabled: !!address && startTimeRef.current > 0,
  });

  // Handle error display with delay
  useEffect(() => {
    if (writeError && !hash && !isEventSuccess && !isPending) {
      setIsWaitingForEvent(true);
      setShouldShowError(false);
      errorTimeoutRef.current = setTimeout(() => {
        if (!isEventSuccess) {
          setIsWaitingForEvent(false);
          setShouldShowError(true);
        }
      }, 15000);
    }
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, [writeError, hash, isEventSuccess, isPending]);

  const claimBounty = useCallback(
    async (bountyId: number) => {
      startTimeRef.current = Date.now();
      setIsEventSuccess(false);
      setIsWaitingForEvent(false);
      setShouldShowError(false);

      writeContract({
        address: escrowAddress,
        abi: SNAP_BOUNTY_ESCROW_ABI,
        functionName: "claimBounty",
        args: [BigInt(bountyId)],
      });
    },
    [writeContract, escrowAddress]
  );

  const reset = useCallback(() => {
    resetWrite();
    setIsEventSuccess(false);
    setIsWaitingForEvent(false);
    setShouldShowError(false);
    startTimeRef.current = 0;
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
  }, [resetWrite]);

  const exposedError = isEventSuccess ? null : (shouldShowError ? writeError : null);

  return {
    claimBounty,
    hash,
    isPending: isPending || isWaitingForEvent,
    isConfirming,
    isSuccess: isReceiptSuccess || isEventSuccess,
    error: exposedError,
    reset,
  };
}

/**
 * Submit work for a bounty
 */
export function useSubmitWork() {
  const escrowAddress = useEscrowAddress();
  const { address } = useAccount();

  const { writeContract, data: hash, isPending, error: writeError, reset: resetWrite } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isReceiptSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Event tracking state
  const [isEventSuccess, setIsEventSuccess] = useState(false);
  const [isWaitingForEvent, setIsWaitingForEvent] = useState(false);
  const [shouldShowError, setShouldShowError] = useState(false);
  const startTimeRef = useRef<number>(0);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Watch for WorkSubmitted events
  useWatchContractEvent({
    address: escrowAddress,
    abi: SNAP_BOUNTY_ESCROW_ABI,
    eventName: "WorkSubmitted",
    args: { hunter: address },
    onLogs(logs) {
      const log = logs[0];
      if (log && startTimeRef.current > 0 && Date.now() > startTimeRef.current) {
        console.log("Found WorkSubmitted event via listener:", log);
        setIsEventSuccess(true);
        setIsWaitingForEvent(false);
        setShouldShowError(false);
        if (errorTimeoutRef.current) {
          clearTimeout(errorTimeoutRef.current);
          errorTimeoutRef.current = null;
        }
      }
    },
    enabled: !!address && startTimeRef.current > 0,
  });

  // Handle error display with delay
  useEffect(() => {
    if (writeError && !hash && !isEventSuccess && !isPending) {
      setIsWaitingForEvent(true);
      setShouldShowError(false);
      errorTimeoutRef.current = setTimeout(() => {
        if (!isEventSuccess) {
          setIsWaitingForEvent(false);
          setShouldShowError(true);
        }
      }, 15000);
    }
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, [writeError, hash, isEventSuccess, isPending]);

  const submitWork = useCallback(
    async (bountyId: number, proofUrl: string) => {
      startTimeRef.current = Date.now();
      setIsEventSuccess(false);
      setIsWaitingForEvent(false);
      setShouldShowError(false);

      // Hash the proof URL to create a bytes32 value
      const proofHash = keccak256(toBytes(proofUrl));
      writeContract({
        address: escrowAddress,
        abi: SNAP_BOUNTY_ESCROW_ABI,
        functionName: "submitWork",
        args: [BigInt(bountyId), proofHash],
      });
    },
    [writeContract, escrowAddress]
  );

  const reset = useCallback(() => {
    resetWrite();
    setIsEventSuccess(false);
    setIsWaitingForEvent(false);
    setShouldShowError(false);
    startTimeRef.current = 0;
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
  }, [resetWrite]);

  const exposedError = isEventSuccess ? null : (shouldShowError ? writeError : null);

  return {
    submitWork,
    hash,
    isPending: isPending || isWaitingForEvent,
    isConfirming,
    isSuccess: isReceiptSuccess || isEventSuccess,
    error: exposedError,
    reset,
  };
}

/**
 * Approve submitted work
 */
export function useApproveWork() {
  const escrowAddress = useEscrowAddress();

  const { writeContract, data: hash, isPending, error: writeError, reset: resetWrite } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isReceiptSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Event tracking state
  const [isEventSuccess, setIsEventSuccess] = useState(false);
  const [isWaitingForEvent, setIsWaitingForEvent] = useState(false);
  const [shouldShowError, setShouldShowError] = useState(false);
  const [targetBountyId, setTargetBountyId] = useState<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Watch for WorkApproved events
  useWatchContractEvent({
    address: escrowAddress,
    abi: SNAP_BOUNTY_ESCROW_ABI,
    eventName: "WorkApproved",
    onLogs(logs) {
      const log = logs[0];
      if (log && startTimeRef.current > 0 && Date.now() > startTimeRef.current) {
        // @ts-ignore
        const eventBountyId = Number(log.args.bountyId);
        if (targetBountyId === null || eventBountyId === targetBountyId) {
          console.log("Found WorkApproved event via listener:", log);
          setIsEventSuccess(true);
          setIsWaitingForEvent(false);
          setShouldShowError(false);
          if (errorTimeoutRef.current) {
            clearTimeout(errorTimeoutRef.current);
            errorTimeoutRef.current = null;
          }
        }
      }
    },
    enabled: startTimeRef.current > 0,
  });

  // Handle error display with delay
  useEffect(() => {
    if (writeError && !hash && !isEventSuccess && !isPending) {
      setIsWaitingForEvent(true);
      setShouldShowError(false);
      errorTimeoutRef.current = setTimeout(() => {
        if (!isEventSuccess) {
          setIsWaitingForEvent(false);
          setShouldShowError(true);
        }
      }, 15000);
    }
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, [writeError, hash, isEventSuccess, isPending]);

  const approveWork = useCallback(
    async (bountyId: number) => {
      startTimeRef.current = Date.now();
      setTargetBountyId(bountyId);
      setIsEventSuccess(false);
      setIsWaitingForEvent(false);
      setShouldShowError(false);

      writeContract({
        address: escrowAddress,
        abi: SNAP_BOUNTY_ESCROW_ABI,
        functionName: "approveWork",
        args: [BigInt(bountyId)],
      });
    },
    [writeContract, escrowAddress]
  );

  const reset = useCallback(() => {
    resetWrite();
    setIsEventSuccess(false);
    setIsWaitingForEvent(false);
    setShouldShowError(false);
    setTargetBountyId(null);
    startTimeRef.current = 0;
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
  }, [resetWrite]);

  const exposedError = isEventSuccess ? null : (shouldShowError ? writeError : null);

  return {
    approveWork,
    hash,
    isPending: isPending || isWaitingForEvent,
    isConfirming,
    isSuccess: isReceiptSuccess || isEventSuccess,
    error: exposedError,
    reset,
  };
}

/**
 * Reject submitted work
 */
export function useRejectWork() {
  const escrowAddress = useEscrowAddress();

  const { writeContract, data: hash, isPending, error: writeError, reset: resetWrite } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isReceiptSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Event tracking state
  const [isEventSuccess, setIsEventSuccess] = useState(false);
  const [isWaitingForEvent, setIsWaitingForEvent] = useState(false);
  const [shouldShowError, setShouldShowError] = useState(false);
  const [targetBountyId, setTargetBountyId] = useState<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Watch for WorkRejected events
  useWatchContractEvent({
    address: escrowAddress,
    abi: SNAP_BOUNTY_ESCROW_ABI,
    eventName: "WorkRejected",
    onLogs(logs) {
      const log = logs[0];
      if (log && startTimeRef.current > 0 && Date.now() > startTimeRef.current) {
        // @ts-ignore
        const eventBountyId = Number(log.args.bountyId);
        if (targetBountyId === null || eventBountyId === targetBountyId) {
          console.log("Found WorkRejected event via listener:", log);
          setIsEventSuccess(true);
          setIsWaitingForEvent(false);
          setShouldShowError(false);
          if (errorTimeoutRef.current) {
            clearTimeout(errorTimeoutRef.current);
            errorTimeoutRef.current = null;
          }
        }
      }
    },
    enabled: startTimeRef.current > 0,
  });

  // Handle error display with delay
  useEffect(() => {
    if (writeError && !hash && !isEventSuccess && !isPending) {
      setIsWaitingForEvent(true);
      setShouldShowError(false);
      errorTimeoutRef.current = setTimeout(() => {
        if (!isEventSuccess) {
          setIsWaitingForEvent(false);
          setShouldShowError(true);
        }
      }, 15000);
    }
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, [writeError, hash, isEventSuccess, isPending]);

  const rejectWork = useCallback(
    async (bountyId: number, reason: string) => {
      startTimeRef.current = Date.now();
      setTargetBountyId(bountyId);
      setIsEventSuccess(false);
      setIsWaitingForEvent(false);
      setShouldShowError(false);

      writeContract({
        address: escrowAddress,
        abi: SNAP_BOUNTY_ESCROW_ABI,
        functionName: "rejectWork",
        args: [BigInt(bountyId), reason],
      });
    },
    [writeContract, escrowAddress]
  );

  const reset = useCallback(() => {
    resetWrite();
    setIsEventSuccess(false);
    setIsWaitingForEvent(false);
    setShouldShowError(false);
    setTargetBountyId(null);
    startTimeRef.current = 0;
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
  }, [resetWrite]);

  const exposedError = isEventSuccess ? null : (shouldShowError ? writeError : null);

  return {
    rejectWork,
    hash,
    isPending: isPending || isWaitingForEvent,
    isConfirming,
    isSuccess: isReceiptSuccess || isEventSuccess,
    error: exposedError,
    reset,
  };
}

/**
 * Cancel a bounty
 */
export function useCancelBounty() {
  const escrowAddress = useEscrowAddress();
  const { address } = useAccount();

  const { writeContract, data: hash, isPending, error: writeError, reset: resetWrite } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isReceiptSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Event tracking state
  const [isEventSuccess, setIsEventSuccess] = useState(false);
  const [isWaitingForEvent, setIsWaitingForEvent] = useState(false);
  const [shouldShowError, setShouldShowError] = useState(false);
  const startTimeRef = useRef<number>(0);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Watch for BountyCancelled events
  useWatchContractEvent({
    address: escrowAddress,
    abi: SNAP_BOUNTY_ESCROW_ABI,
    eventName: "BountyCancelled",
    args: { creator: address },
    onLogs(logs) {
      const log = logs[0];
      if (log && startTimeRef.current > 0 && Date.now() > startTimeRef.current) {
        console.log("Found BountyCancelled event via listener:", log);
        setIsEventSuccess(true);
        setIsWaitingForEvent(false);
        setShouldShowError(false);
        if (errorTimeoutRef.current) {
          clearTimeout(errorTimeoutRef.current);
          errorTimeoutRef.current = null;
        }
      }
    },
    enabled: !!address && startTimeRef.current > 0,
  });

  // Handle error display with delay
  useEffect(() => {
    if (writeError && !hash && !isEventSuccess && !isPending) {
      setIsWaitingForEvent(true);
      setShouldShowError(false);
      errorTimeoutRef.current = setTimeout(() => {
        if (!isEventSuccess) {
          setIsWaitingForEvent(false);
          setShouldShowError(true);
        }
      }, 15000);
    }
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, [writeError, hash, isEventSuccess, isPending]);

  const cancelBounty = useCallback(
    async (bountyId: number) => {
      startTimeRef.current = Date.now();
      setIsEventSuccess(false);
      setIsWaitingForEvent(false);
      setShouldShowError(false);

      writeContract({
        address: escrowAddress,
        abi: SNAP_BOUNTY_ESCROW_ABI,
        functionName: "cancelBounty",
        args: [BigInt(bountyId)],
      });
    },
    [writeContract, escrowAddress]
  );

  const reset = useCallback(() => {
    resetWrite();
    setIsEventSuccess(false);
    setIsWaitingForEvent(false);
    setShouldShowError(false);
    startTimeRef.current = 0;
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
  }, [resetWrite]);

  const exposedError = isEventSuccess ? null : (shouldShowError ? writeError : null);

  return {
    cancelBounty,
    hash,
    isPending: isPending || isWaitingForEvent,
    isConfirming,
    isSuccess: isReceiptSuccess || isEventSuccess,
    error: exposedError,
    reset,
  };
}

/**
 * Release claim on a bounty
 */
export function useReleaseClaim() {
  const escrowAddress = useEscrowAddress();

  const { writeContract, data: hash, isPending, error: writeError, reset: resetWrite } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isReceiptSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Error delay state (no specific event for release claim)
  const [isWaitingForEvent, setIsWaitingForEvent] = useState(false);
  const [shouldShowError, setShouldShowError] = useState(false);
  const startTimeRef = useRef<number>(0);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle error display with delay
  useEffect(() => {
    if (writeError && !hash && !isReceiptSuccess && !isPending) {
      setIsWaitingForEvent(true);
      setShouldShowError(false);
      errorTimeoutRef.current = setTimeout(() => {
        setIsWaitingForEvent(false);
        setShouldShowError(true);
      }, 15000);
    }
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, [writeError, hash, isReceiptSuccess, isPending]);

  const releaseClaim = useCallback(
    async (bountyId: number) => {
      startTimeRef.current = Date.now();
      setIsWaitingForEvent(false);
      setShouldShowError(false);

      writeContract({
        address: escrowAddress,
        abi: SNAP_BOUNTY_ESCROW_ABI,
        functionName: "releaseClaim",
        args: [BigInt(bountyId)],
      });
    },
    [writeContract, escrowAddress]
  );

  const reset = useCallback(() => {
    resetWrite();
    setIsWaitingForEvent(false);
    setShouldShowError(false);
    startTimeRef.current = 0;
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
  }, [resetWrite]);

  const exposedError = shouldShowError ? writeError : null;

  return {
    releaseClaim,
    hash,
    isPending: isPending || isWaitingForEvent,
    isConfirming,
    isSuccess: isReceiptSuccess,
    error: exposedError,
    reset,
  };
}

// ============ Utility Hooks ============

/**
 * Check if user can claim a bounty
 */
export function useCanClaim(bountyId: number | undefined) {
  const { address } = useAccount();
  const { bounty } = useBountyFromContract(bountyId);
  const { hasActiveClaim } = useActiveClaim(address);
  const { isExpired } = useIsExpired(bountyId);

  const canClaim = useMemo(() => {
    if (!bounty || !address) return false;
    if (bounty.status !== BountyStatus.Open) return false;
    if (bounty.creator.toLowerCase() === address.toLowerCase()) return false;
    if (hasActiveClaim) return false;
    if (isExpired) return false;
    return true;
  }, [bounty, address, hasActiveClaim, isExpired]);

  return canClaim;
}

/**
 * Check if user is the creator of a bounty
 */
export function useIsCreator(bountyId: number | undefined) {
  const { address } = useAccount();
  const { bounty } = useBountyFromContract(bountyId);

  return useMemo(() => {
    if (!bounty || !address) return false;
    return bounty.creator.toLowerCase() === address.toLowerCase();
  }, [bounty, address]);
}

/**
 * Check if user is the hunter of a bounty
 */
export function useIsHunter(bountyId: number | undefined) {
  const { address } = useAccount();
  const { bounty } = useBountyFromContract(bountyId);

  return useMemo(() => {
    if (!bounty || !address) return false;
    return bounty.hunter.toLowerCase() === address.toLowerCase();
  }, [bounty, address]);
}


