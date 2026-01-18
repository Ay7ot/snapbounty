import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "open" | "active" | "pending" | "completed" | "closed" | "default";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full";

  const variants = {
    open: "bg-status-open/15 text-status-open",
    active: "bg-status-active/15 text-status-active",
    pending: "bg-status-pending/15 text-status-pending",
    completed: "bg-status-completed/15 text-status-completed",
    closed: "bg-status-closed/15 text-status-closed",
    default: "bg-white/10 text-text-secondary",
  };

  return (
    <span className={cn(baseStyles, variants[variant], className)} {...props} />
  );
}






