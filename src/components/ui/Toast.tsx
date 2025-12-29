"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { X, CheckCircle2, AlertCircle, Info, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

// Toast types
type ToastType = "success" | "error" | "info" | "loading";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  txHash?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, updates: Partial<Omit<Toast, "id">>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// Convenience functions
export function useToastActions() {
  const { addToast, removeToast, updateToast } = useToast();

  const success = useCallback(
    (title: string, description?: string, txHash?: string) => {
      return addToast({ type: "success", title, description, txHash, duration: 5000 });
    },
    [addToast]
  );

  const error = useCallback(
    (title: string, description?: string) => {
      return addToast({ type: "error", title, description, duration: 7000 });
    },
    [addToast]
  );

  const info = useCallback(
    (title: string, description?: string) => {
      return addToast({ type: "info", title, description, duration: 4000 });
    },
    [addToast]
  );

  const loading = useCallback(
    (title: string, description?: string) => {
      return addToast({ type: "loading", title, description, duration: 0 }); // No auto-dismiss
    },
    [addToast]
  );

  const dismiss = useCallback(
    (id: string) => {
      removeToast(id);
    },
    [removeToast]
  );

  return { success, error, info, loading, dismiss, updateToast };
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    const newToast = { ...toast, id };

    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss if duration is set
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, toast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateToast = useCallback((id: string, updates: Partial<Omit<Toast, "id">>) => {
    setToasts((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updated = { ...t, ...updates };
          // If updating to a non-loading type, set auto-dismiss
          if (updates.type && updates.type !== "loading" && !updates.duration) {
            const defaultDuration = updates.type === "error" ? 7000 : 5000;
            setTimeout(() => {
              setToasts((current) => current.filter((toast) => toast.id !== id));
            }, defaultDuration);
          }
          return updated;
        }
        return t;
      })
    );
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, updateToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-accent-green" />,
    error: <AlertCircle className="h-5 w-5 text-accent-red" />,
    info: <Info className="h-5 w-5 text-accent-blue" />,
    loading: <Loader2 className="h-5 w-5 text-accent-green animate-spin" />,
  };

  const borderColors = {
    success: "border-accent-green/30",
    error: "border-accent-red/30",
    info: "border-accent-blue/30",
    loading: "border-accent-green/30",
  };

  // Get BaseScan URL for transaction
  const getTxUrl = (hash: string) => {
    // Default to Base Sepolia, can be made dynamic based on chain
    return `https://sepolia.basescan.org/tx/${hash}`;
  };

  return (
    <div
      className={cn(
        "animate-slide-up bg-bg-tertiary border rounded-lg p-4 shadow-lg",
        "flex items-start gap-3 min-w-[300px]",
        borderColors[toast.type]
      )}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-text-primary text-sm">{toast.title}</p>
        {toast.description && (
          <p className="mt-1 text-xs text-text-secondary line-clamp-2">{toast.description}</p>
        )}
        {toast.txHash && (
          <a
            href={getTxUrl(toast.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs text-accent-green hover:underline"
          >
            View transaction
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {toast.type !== "loading" && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-text-tertiary hover:text-text-primary transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export { ToastContext };


