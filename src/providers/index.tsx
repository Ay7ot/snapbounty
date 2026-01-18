"use client";

import { type ReactNode, useEffect } from "react";
import { Web3Provider } from "./Web3Provider";
import { ToastProvider } from "@/components/ui/Toast";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Root providers wrapper
 * Combines all context providers in the correct order
 */
export function Providers({ children }: ProvidersProps) {
  // Patch BigInt serialization globally to prevent JSON.stringify errors
  useEffect(() => {
    // @ts-expect-error - Patching BigInt prototype for JSON serialization
    BigInt.prototype.toJSON = function () {
      return this.toString();
    };
  }, []);

  return (
    <Web3Provider>
      <ToastProvider>{children}</ToastProvider>
    </Web3Provider>
  );
}






