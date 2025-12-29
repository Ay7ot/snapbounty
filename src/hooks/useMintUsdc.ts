"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useWatchContractEvent } from "wagmi";
import { parseUnits } from "viem";
import { USDC_ADDRESSES, ERC20_ABI } from "@/config/contracts";

// MockUSDC ABI - includes mint function and Transfer event for event listening
const MOCK_USDC_ABI = [
    ...ERC20_ABI,
    {
        inputs: [
            { name: "to", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        name: "mint",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    // Transfer event - needed for event listening
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: "from", type: "address" },
            { indexed: true, name: "to", type: "address" },
            { indexed: false, name: "value", type: "uint256" },
        ],
        name: "Transfer",
        type: "event",
    },
] as const;

export function useMintUsdc() {
    const { address } = useAccount();
    const chainId = useChainId();
    const usdcAddress = USDC_ADDRESSES[chainId] || USDC_ADDRESSES[84532]; // Default to Base Sepolia

    const { writeContract, data: hash, isPending, error: writeError, reset: resetWrite } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isReceiptSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    // Event tracking state for robust success detection
    const [isEventSuccess, setIsEventSuccess] = useState(false);
    const [isWaitingForEvent, setIsWaitingForEvent] = useState(false);
    const [shouldShowError, setShouldShowError] = useState(false);
    const startTimeRef = useRef<number>(0);
    const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Watch for Transfer events to detect mint success (mint creates a Transfer from address(0) to recipient)
    useWatchContractEvent({
        address: usdcAddress,
        abi: MOCK_USDC_ABI, // Use the ABI that includes the Transfer event
        eventName: "Transfer",
        args: { to: address }, // Only filter by recipient - mint transfers from address(0) but we check that in onLogs
        onLogs(logs) {
            console.log("Transfer event received:", logs);
            for (const log of logs) {
                // @ts-ignore - args are typed but wagmi types can be complex
                const from = log.args?.from;
                // Check if this is a mint (from address(0))
                if (from === "0x0000000000000000000000000000000000000000" && startTimeRef.current > 0) {
                    console.log("Found Transfer (mint) event via listener:", log);
                    setIsEventSuccess(true);
                    setIsWaitingForEvent(false);
                    setShouldShowError(false);
                    // Clear any pending error timeout
                    if (errorTimeoutRef.current) {
                        clearTimeout(errorTimeoutRef.current);
                        errorTimeoutRef.current = null;
                    }
                    break;
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

            // Wait 60 seconds for event listener to potentially detect success
            errorTimeoutRef.current = setTimeout(() => {
                if (!isEventSuccess) {
                    console.log("Event timeout reached, showing error");
                    setIsWaitingForEvent(false);
                    setShouldShowError(true);
                }
            }, 60000);
        }

        return () => {
            if (errorTimeoutRef.current) {
                clearTimeout(errorTimeoutRef.current);
            }
        };
    }, [writeError, hash, isEventSuccess, isPending]);

    const mint = useCallback(
        async (amount: number = 10000) => {
            if (!address) {
                throw new Error("Please connect your wallet first");
            }

            startTimeRef.current = Date.now();
            setIsEventSuccess(false);
            setIsWaitingForEvent(false);
            setShouldShowError(false);

            // Convert amount to 6 decimals (USDC uses 6 decimals)
            const amountWei = parseUnits(amount.toString(), 6);

            writeContract({
                address: usdcAddress,
                abi: MOCK_USDC_ABI,
                functionName: "mint",
                args: [address, amountWei],
            });
        },
        [writeContract, usdcAddress, address]
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

    // Determine what error to expose
    // - Hide error if event success detected
    // - Hide error if we're still waiting for event listener
    // - Only show error after timeout if no event detected
    const exposedError = isEventSuccess ? null : (shouldShowError ? writeError : null);

    return {
        mint,
        hash,
        isPending: isPending || isWaitingForEvent, // Show as pending while waiting for event
        isConfirming,
        isSuccess: isReceiptSuccess || isEventSuccess,
        error: exposedError,
        reset,
    };
}

