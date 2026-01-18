export { useUser } from "./useUser";

// Contract hooks
export {
  // Address hooks
  useEscrowAddress,
  useUsdcAddress,
  // Read hooks
  useBountyFromContract,
  useBountyCount,
  useActiveClaim,
  useIsExpired,
  useUsdcBalance,
  useUsdcAllowance,
  // Write hooks
  useApproveUsdc,
  useCreateBounty,
  useClaimBounty,
  useSubmitWork,
  useApproveWork,
  useRejectWork,
  useCancelBounty,
  useReleaseClaim,
  // Utility hooks
  useCanClaim,
  useIsCreator,
  useIsHunter,
  // Dispute hooks
  useGetDispute,
  useCanOpenDispute,
  useDisputeFee,
  useArbiter,
  useIsArbiter,
  useOpenDispute,
  useSubmitDisputeEvidence,
  useResolveDispute,
  useAutoResolveDispute,
} from "./useContract";

// Mint hook
export { useMintUsdc } from "./useMintUsdc";






