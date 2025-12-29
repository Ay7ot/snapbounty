"use client";

import Link from "next/link";
import { Code, Palette, FileText, Search, Sparkles, MoreHorizontal, Star, Clock, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { BountyStatusBadge } from "./BountyStatusBadge";
import { cn } from "@/lib/utils";
import type { Bounty } from "@/types";
import type { Category } from "@/config/site";

// Category icons map
const categoryIcons: Record<Category, typeof Code> = {
  development: Code,
  design: Palette,
  writing: FileText,
  research: Search,
  "ai-prompting": Sparkles,
  other: MoreHorizontal,
};

// Category colors
const categoryColors: Record<Category, { bg: string; text: string; border: string }> = {
  development: { bg: "bg-accent-green/10", text: "text-accent-green", border: "border-accent-green/20" },
  design: { bg: "bg-accent-purple/10", text: "text-accent-purple", border: "border-accent-purple/20" },
  writing: { bg: "bg-accent-blue/10", text: "text-accent-blue", border: "border-accent-blue/20" },
  research: { bg: "bg-accent-orange/10", text: "text-accent-orange", border: "border-accent-orange/20" },
  "ai-prompting": { bg: "bg-accent-green/10", text: "text-accent-green", border: "border-accent-green/20" },
  other: { bg: "bg-text-tertiary/10", text: "text-text-secondary", border: "border-text-tertiary/20" },
};

// Category labels
const categoryLabels: Record<Category, string> = {
  development: "Development",
  design: "Design",
  writing: "Writing",
  research: "Research",
  "ai-prompting": "AI Prompting",
  other: "Other",
};

interface BountyCardProps {
  bounty: Bounty;
  featured?: boolean;
  showStatus?: boolean;
  className?: string;
}

export function BountyCard({
  bounty,
  featured = false,
  showStatus = true,
  className,
}: BountyCardProps) {
  const CategoryIcon = categoryIcons[bounty.category] || MoreHorizontal;
  const categoryStyle = categoryColors[bounty.category] || categoryColors.other;
  const categoryLabel = categoryLabels[bounty.category] || "Other";

  // Format reward display
  const formatReward = (reward: number) => {
    if (reward >= 1000) {
      return `$${(reward / 1000).toFixed(1)}k`;
    }
    return `$${reward}`;
  };

  // Check if deadline is approaching (within 3 days)
  const isDeadlineSoon = bounty.deadline &&
    new Date(bounty.deadline) > new Date() &&
    new Date(bounty.deadline).getTime() - new Date().getTime() < 3 * 24 * 60 * 60 * 1000;

  return (
    <Link href={`/bounty/${bounty.id}`} className="block h-full">
      <article
        className={cn(
          "group relative h-full flex flex-col",
          "bg-bg-tertiary border border-border-default rounded-xl",
          "hover:border-accent-green/40 hover:bg-bg-elevated/50",
          "transition-all duration-300 ease-out",
          "overflow-hidden",
          className
        )}
      >
        {/* Featured indicator */}
        {featured && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-accent-green via-accent-blue to-accent-purple" />
        )}

        {/* Card Content */}
        <div className="flex flex-col h-full p-5">
          {/* Top Row: Category + Status */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className={cn(
              "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border",
              categoryStyle.bg,
              categoryStyle.border
            )}>
              <CategoryIcon className={cn("h-3.5 w-3.5 shrink-0", categoryStyle.text)} />
              <span className={cn("text-xs font-medium", categoryStyle.text)}>
                {categoryLabel}
              </span>
            </div>

            {showStatus && (
              <BountyStatusBadge status={bounty.status} className="text-xs shrink-0" />
            )}
          </div>

          {/* Title */}
          <h3 className="text-base font-semibold text-text-primary leading-snug mb-2 group-hover:text-accent-green transition-colors">
            {bounty.title}
          </h3>

          {/* Creator */}
          <p className="text-xs text-text-tertiary mb-4">
            by <span className="text-text-secondary">{bounty.creator?.username || "Anonymous"}</span>
          </p>

          {/* Spacer */}
          <div className="flex-1 min-h-4" />

          {/* Bottom Row: Reward + Deadline */}
          <div className="flex items-end justify-between gap-4 pt-4 border-t border-border-default">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1">Reward</p>
              <p className="text-xl font-bold text-accent-green">
                {formatReward(bounty.reward)}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1">
              {bounty.deadline && new Date(bounty.deadline) > new Date() && (
                <div className={cn(
                  "flex items-center gap-1.5 text-xs",
                  isDeadlineSoon ? "text-accent-orange" : "text-text-tertiary"
                )}>
                  <Clock className="h-3 w-3" />
                  <span>{new Date(bounty.deadline).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-xs text-text-tertiary group-hover:text-accent-green transition-colors">
                <span>View</span>
                <ArrowUpRight className="h-3 w-3" />
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

// Compact variant for lists
export function BountyCardCompact({ bounty }: { bounty: Bounty }) {
  const CategoryIcon = categoryIcons[bounty.category] || MoreHorizontal;
  const categoryStyle = categoryColors[bounty.category] || categoryColors.other;

  return (
    <Link href={`/bounty/${bounty.id}`} className="block">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-border-default bg-bg-tertiary hover:border-accent-green/40 hover:bg-bg-elevated/50 transition-all group relative overflow-hidden">
        {/* Mobile: Status badge on top right */}
        <div className="absolute top-4 right-4 sm:hidden">
          <BountyStatusBadge status={bounty.status} className="text-[10px]" />
        </div>

        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border mt-0.5 sm:mt-0",
            categoryStyle.bg,
            categoryStyle.border
          )}>
            <CategoryIcon className={cn("h-5 w-5", categoryStyle.text)} />
          </div>

          <div className="min-w-0 flex-1 pr-12 sm:pr-0">
            <h3 className="font-medium text-text-primary group-hover:text-accent-green transition-colors line-clamp-2 sm:line-clamp-1 leading-snug">
              {bounty.title}
            </h3>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-text-tertiary">
              <span className="text-text-secondary font-medium">
                {bounty.creator?.username || "Anonymous"}
              </span>
              <span>•</span>
              <span>{categoryLabels[bounty.category] || "Other"}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pl-14 sm:pl-0 mt-2 sm:mt-0 border-t sm:border-t-0 border-border-default/50 pt-3 sm:pt-0">
          <BountyStatusBadge status={bounty.status} className="text-xs hidden sm:flex" />
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-text-tertiary sm:hidden">Reward</p>
            <p className="text-lg font-bold text-accent-green">${bounty.reward}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default BountyCard;
