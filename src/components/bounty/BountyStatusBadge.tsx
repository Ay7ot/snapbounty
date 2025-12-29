"use client";

import { Badge } from "@/components/ui/Badge";
import { BountyStatus, BOUNTY_STATUS_LABELS } from "@/config/contracts";
import type { BountyStatus as BountyStatusType } from "@/config/site";

interface BountyStatusBadgeProps {
  status: number | BountyStatusType;
  className?: string;
}

// Map contract status numbers to badge variants
const statusToVariant: Record<number, "open" | "active" | "pending" | "completed" | "closed"> = {
  [BountyStatus.Open]: "open",
  [BountyStatus.Claimed]: "active",
  [BountyStatus.Submitted]: "pending",
  [BountyStatus.Completed]: "completed",
  [BountyStatus.Cancelled]: "closed",
};

// Map string status from Supabase to badge variants
const stringStatusToVariant: Record<string, "open" | "active" | "pending" | "completed" | "closed"> = {
  open: "open",
  claimed: "active",
  submitted: "pending",
  completed: "completed",
  cancelled: "closed",
};

export function BountyStatusBadge({ status, className }: BountyStatusBadgeProps) {
  const isNumber = typeof status === "number";
  const variant = isNumber ? statusToVariant[status] : stringStatusToVariant[status];
  const label = isNumber ? BOUNTY_STATUS_LABELS[status as BountyStatus] : status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <Badge variant={variant || "closed"} className={className}>
      {label}
    </Badge>
  );
}

export default BountyStatusBadge;


