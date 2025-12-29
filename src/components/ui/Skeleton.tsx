"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function Skeleton({
  className,
  variant = "rectangular",
  width,
  height,
  lines,
}: SkeletonProps) {
  const baseStyles = "skeleton animate-pulse";

  const variantStyles = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-md",
  };

  const style = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
  };

  // If lines prop is provided, render multiple text skeletons
  if (lines && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(baseStyles, variantStyles.text, className)}
            style={{
              ...style,
              width: i === lines - 1 ? "60%" : style.width, // Last line is shorter
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], className)}
      style={style}
    />
  );
}

// Pre-built skeleton components for common use cases
export function SkeletonCard() {
  return (
    <div className="p-6 rounded-lg border border-border-default bg-bg-tertiary space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="space-y-2 flex-1">
          <Skeleton width="40%" height={12} />
          <Skeleton width="60%" height={16} />
        </div>
      </div>
      <Skeleton lines={2} />
      <div className="flex justify-between items-center pt-2">
        <Skeleton width={80} height={24} className="rounded-full" />
        <Skeleton width={60} height={24} />
      </div>
    </div>
  );
}

export function SkeletonBountyCard() {
  return (
    <div className="p-6 rounded-lg border border-border-default bg-bg-tertiary">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton variant="rectangular" width={40} height={40} className="rounded-lg" />
        <div className="space-y-1.5 flex-1">
          <Skeleton width="30%" height={10} />
          <Skeleton width="70%" height={14} />
        </div>
      </div>
      <div className="flex justify-between items-center">
        <Skeleton width={70} height={22} className="rounded-full" />
        <Skeleton width={50} height={24} />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonBountyGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBountyCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={80} height={80} />
        <div className="space-y-2">
          <Skeleton width={150} height={24} />
          <Skeleton width={200} height={14} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Skeleton height={80} />
        <Skeleton height={80} />
        <Skeleton height={80} />
      </div>
    </div>
  );
}

// Dashboard Skeleton Components
export function SkeletonDashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-6 rounded-lg border border-border-default bg-bg-tertiary">
          <div className="flex items-center gap-4">
            <Skeleton variant="rectangular" width={48} height={48} className="rounded-lg" />
            <div className="space-y-2 flex-1">
              <Skeleton width="50%" height={12} />
              <Skeleton width="40%" height={24} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboardTabs() {
  return (
    <div className="border-b border-border-default">
      <div className="flex gap-8">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} width={100} height={20} className="mb-3" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonBountyListItem() {
  return (
    <div className="p-5 rounded-lg border border-border-default bg-bg-tertiary">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton width="70%" height={18} />
          <Skeleton width="40%" height={12} />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton width={70} height={24} className="rounded-full" />
          <Skeleton width={80} height={24} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonSubmissionItem() {
  return (
    <div className="p-5 rounded-lg border border-border-default bg-bg-tertiary">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton width="60%" height={16} />
            <Skeleton width={60} height={22} className="rounded-full sm:hidden" />
          </div>
          <Skeleton width="30%" height={12} />
        </div>
        <div className="flex items-center gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-border-default/50">
          <Skeleton width={70} height={24} className="rounded-full hidden sm:block" />
          <Skeleton width={80} height={24} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-8">
      <SkeletonDashboardStats />
      <SkeletonDashboardTabs />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <SkeletonBountyListItem key={i} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonSubmissionsList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonSubmissionItem key={i} />
      ))}
    </div>
  );
}

export default Skeleton;


