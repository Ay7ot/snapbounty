"use client";

import { useCallback, useMemo } from "react";
import {
  useAccount,
  useChainId,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits, formatUnits, keccak256, toBytes, decodeEventLog } from "viem";
import {
  ESCROW_ADDRESSES,
  USDC_ADDRESSES,
  SNAP_BOUNTY_ESCROW_ABI,
  ERC20_ABI,
  BountyStatus,
  type ContractBounty,
  type ContractDispute,
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
 * 
 * This hook handles a common issue where the RPC returns an error
 * even though the transaction was actually submitted and mined.
 * It polls the bounty count to detect success when hash is unavailable.
 */
export function useCreateBounty() {
  const escrowAddress = useEscrowAddress();

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({
    hash,
  });

  // Parse bounty ID from receipt logs by decoding BountyCreated event
  const createdBountyId = useMemo(() => {
    if (!receipt?.logs) return null;

    // Filter logs from the escrow contract
    const escrowLogs = receipt.logs.filter(
      (log) => log.address.toLowerCase() === escrowAddress.toLowerCase()
    );

    for (const log of escrowLogs) {
      try {
        const decoded = decodeEventLog({
          abi: SNAP_BOUNTY_ESCROW_ABI,
          data: log.data,
          topics: log.topics,
        });

        if (decoded.eventName === "BountyCreated") {
          const bountyId = Number((decoded.args as { bountyId: bigint }).bountyId);
          return bountyId;
        }
      } catch {
        // Not the BountyCreated event, continue
      }
    }
    return null;
  }, [receipt, escrowAddress]);

  const createBounty = useCallback(
    async (rewardUsdc: number, deadlineTimestamp: number = 0) => {
      const rewardWei = parseUnits(rewardUsdc.toString(), 6);

      writeContract({
        address: escrowAddress,
        abi: SNAP_BOUNTY_ESCROW_ABI,
        functionName: "createBounty",
        args: [rewardWei, BigInt(deadlineTimestamp)],
      });
    },
    [writeContract, escrowAddress]
  );

  return {
    createBounty,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    receipt,
    createdBountyId,
    error,
    reset,
  };
}

/**
 * Claim a bounty
 */
export function useClaimBounty() {
  const escrowAddress = useEscrowAddress();

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimBounty = useCallback(
    async (bountyId: number) => {
      writeContract({
        address: escrowAddress,
        abi: SNAP_BOUNTY_ESCROW_ABI,
        functionName: "claimBounty",
        args: [BigInt(bountyId)],
      });
    },
    [writeContract, escrowAddress]
  );

  return {
    claimBounty,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Submit work for a bounty
 */
export function useSubmitWork() {
  const escrowAddress = useEscrowAddress();

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const submitWork = useCallback(
    async (bountyId: number, proofUrl: string) => {
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

  return {
    submitWork,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Approve submitted work
 */
export function useApproveWork() {
  const escrowAddress = useEscrowAddress();

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approveWork = useCallback(
    async (bountyId: number) => {
      writeContract({
        address: escrowAddress,
        abi: SNAP_BOUNTY_ESCROW_ABI,
        functionName: "approveWork",
        args: [BigInt(bountyId)],
      });
    },
    [writeContract, escrowAddress]
  );

  return {
    approveWork,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Reject submitted work
 */
export function useRejectWork() {
  const escrowAddress = useEscrowAddress();

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const rejectWork = useCallback(
    async (bountyId: number, reason: string) => {
      writeContract({
        address: escrowAddress,
        abi: SNAP_BOUNTY_ESCROW_ABI,
        functionName: "rejectWork",
        args: [BigInt(bountyId), reason],
      });
    },
    [writeContract, escrowAddress]
  );

  return {
    rejectWork,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Cancel a bounty
 */
export function useCancelBounty() {
  const escrowAddress = useEscrowAddress();

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const cancelBounty = useCallback(
    async (bountyId: number) => {
      writeContract({
        address: escrowAddress,
        abi: SNAP_BOUNTY_ESCROW_ABI,
        functionName: "cancelBounty",
        args: [BigInt(bountyId)],
      });
    },
    [writeContract, escrowAddress]
  );

  return {
    cancelBounty,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Release claim on a bounty
 */
export function useReleaseClaim() {
  const escrowAddress = useEscrowAddress();

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const releaseClaim = useCallback(
    async (bountyId: number) => {
      writeContract({
        address: escrowAddress,
        abi: SNAP_BOUNTY_ESCROW_ABI,
        functionName: "releaseClaim",
        args: [BigInt(bountyId)],
      });
    },
    [writeContract, escrowAddress]
  );

  return {
    releaseClaim,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
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

// ============ Dispute Hooks ============

/**
 * Get dispute data from contract
 */
export function useGetDispute(bountyId: number | undefined) {
  const escrowAddress = useEscrowAddress();

  const { data, isLoading, error, refetch } = useReadContract({
    address: escrowAddress,
    abi: SNAP_BOUNTY_ESCROW_ABI,
    functionName: "getDispute",
    args: bountyId ? [BigInt(bountyId)] : undefined,
    query: {
      enabled: !!bountyId && bountyId > 0,
    },
  });

  return {
    dispute: data as ContractDispute | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Check if a dispute can be opened for a bounty
 */
export function useCanOpenDispute(bountyId: number | undefined) {
  const escrowAddress = useEscrowAddress();

  const { data, isLoading, error, refetch } = useReadContract({
    address: escrowAddress,
    abi: SNAP_BOUNTY_ESCROW_ABI,
    functionName: "canOpenDispute",
    args: bountyId ? [BigInt(bountyId)] : undefined,
    query: {
      enabled: !!bountyId && bountyId > 0,
    },
  });

  return {
    canDispute: (data as [boolean, string] | undefined)?.[0] ?? false,
    reason: (data as [boolean, string] | undefined)?.[1] ?? "",
    isLoading,
    error,
    refetch,
  };
}

/**
 * Get dispute fee
 */
export function useDisputeFee() {
  const escrowAddress = useEscrowAddress();

  const { data, isLoading, error } = useReadContract({
    address: escrowAddress,
    abi: SNAP_BOUNTY_ESCROW_ABI,
    functionName: "disputeFee",
  });

  return {
    disputeFee: data ?? BigInt(0),
    formattedDisputeFee: data ? formatUnits(data, 6) : "0",
    disputeFeeAmount: data ? parseFloat(formatUnits(data, 6)) : 0,
    isLoading,
    error,
  };
}

/**
 * Get arbiter address
 */
export function useArbiter() {
  const escrowAddress = useEscrowAddress();

  const { data, isLoading, error } = useReadContract({
    address: escrowAddress,
    abi: SNAP_BOUNTY_ESCROW_ABI,
    functionName: "arbiter",
  });

  return {
    arbiter: data as `0x${string}` | undefined,
    isLoading,
    error,
  };
}

/**
 * Check if user is the arbiter
 */
export function useIsArbiter() {
  const { address } = useAccount();
  const { arbiter } = useArbiter();

  return useMemo(() => {
    if (!arbiter || !address) return false;
    return arbiter.toLowerCase() === address.toLowerCase();
  }, [arbiter, address]);
}

/**
 * Open a dispute
 */
export function useOpenDispute() {
  const escrowAddress = useEscrowAddress();

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const openDispute = useCallback(
    async (bountyId: number, evidenceUrl: string) => {
      const evidenceHash = keccak256(toBytes(evidenceUrl));
      writeContract({
        address: escrowAddress,
        abi: SNAP_BOUNTY_ESCROW_ABI,
        functionName: "openDispute",
        args: [BigInt(bountyId), evidenceHash],
      });
    },
    [writeContract, escrowAddress]
  );

  return {
    openDispute,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Submit dispute evidence (creator)
 */
export function useSubmitDisputeEvidence() {
  const escrowAddress = useEscrowAddress();

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const submitEvidence = useCallback(
    async (bountyId: number, evidenceUrl: string) => {
      const evidenceHash = keccak256(toBytes(evidenceUrl));
      writeContract({
        address: escrowAddress,
        abi: SNAP_BOUNTY_ESCROW_ABI,
        functionName: "submitDisputeEvidence",
        args: [BigInt(bountyId), evidenceHash],
      });
    },
    [writeContract, escrowAddress]
  );

  return {
    submitEvidence,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Resolve a dispute (arbiter only)
 */
export function useResolveDispute() {
  const escrowAddress = useEscrowAddress();

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const resolveDispute = useCallback(
    async (bountyId: number, resolution: number) => {
      writeContract({
        address: escrowAddress,
        abi: SNAP_BOUNTY_ESCROW_ABI,
        functionName: "resolveDispute",
        args: [BigInt(bountyId), resolution],
      });
    },
    [writeContract, escrowAddress]
  );

  return {
    resolveDispute,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Auto-resolve a dispute after timeout
 */
export function useAutoResolveDispute() {
  const escrowAddress = useEscrowAddress();

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const autoResolve = useCallback(
    async (bountyId: number) => {
      writeContract({
        address: escrowAddress,
        abi: SNAP_BOUNTY_ESCROW_ABI,
        functionName: "autoResolveDispute",
        args: [BigInt(bountyId)],
      });
    },
    [writeContract, escrowAddress]
  );

  return {
    autoResolve,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}


