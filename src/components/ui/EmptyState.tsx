"use client";

import type { ReactNode } from "react";
import { FileX2, Search, Inbox, type LucideIcon } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "ghost";
  };
  className?: string;
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-bg-elevated flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-text-tertiary" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-text-secondary max-w-sm">{description}</p>
      )}
      {action && (
        <Button
          variant={action.variant || "primary"}
          onClick={action.onClick}
          className="mt-6"
        >
          {action.label}
        </Button>
      )}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}

// Pre-built empty states for common scenarios
export function NoBountiesFound({ onClearFilters }: { onClearFilters?: () => void }) {
  return (
    <EmptyState
      icon={Search}
      title="No bounties found"
      description="Try adjusting your filters or search terms to find more bounties."
      action={
        onClearFilters
          ? {
              label: "Clear filters",
              onClick: onClearFilters,
              variant: "secondary",
            }
          : undefined
      }
    />
  );
}

export function NoSubmissions() {
  return (
    <EmptyState
      icon={FileX2}
      title="No submissions yet"
      description="When hunters submit work for this bounty, their submissions will appear here."
    />
  );
}

export function NoBountiesCreated({ onCreateBounty }: { onCreateBounty: () => void }) {
  return (
    <EmptyState
      icon={Inbox}
      title="No bounties created"
      description="Start by creating your first bounty and let hunters help you with your tasks."
      action={{
        label: "Create Bounty",
        onClick: onCreateBounty,
      }}
    />
  );
}

export function NoActiveClaims() {
  return (
    <EmptyState
      icon={Inbox}
      title="No active claims"
      description="You haven't claimed any bounties yet. Browse available bounties and claim one to start earning."
    />
  );
}

export default EmptyState;


