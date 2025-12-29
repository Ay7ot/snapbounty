"use client";

import { useState, useCallback } from "react";
import { Search, X, SlidersHorizontal, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { siteConfig } from "@/config/site";
import type { BountyFilters as BountyFiltersType } from "@/types";
import { cn } from "@/lib/utils";

interface BountyFiltersProps {
  filters: BountyFiltersType;
  onFiltersChange: (filters: BountyFiltersType) => void;
  className?: string;
  showSearch?: boolean;
  showSort?: boolean;
  compact?: boolean;
}

const categoryOptions = [
  { value: "", label: "All Categories" },
  ...siteConfig.categories.map((cat) => ({
    value: cat.id,
    label: cat.label,
  })),
];

const difficultyOptions = [
  { value: "", label: "All Difficulties" },
  ...siteConfig.difficulties.map((diff) => ({
    value: diff.id,
    label: diff.label,
  })),
];

const statusOptions = [
  { value: "", label: "All Statuses" },
  ...siteConfig.statuses
    .filter((s) => s.id !== "cancelled") // Don't show cancelled in filter
    .map((status) => ({
      value: status.id,
      label: status.label,
    })),
];

const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "reward_high", label: "Highest Reward" },
  { value: "reward_low", label: "Lowest Reward" },
];

export function BountyFilters({
  filters,
  onFiltersChange,
  className,
  showSearch = true,
  showSort = true,
  compact = false,
}: BountyFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search || "");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value);
      // Debounce search
      const timeoutId = setTimeout(() => {
        onFiltersChange({ ...filters, search: value || undefined });
      }, 300);
      return () => clearTimeout(timeoutId);
    },
    [filters, onFiltersChange]
  );

  const handleFilterChange = useCallback(
    (key: keyof BountyFiltersType, value: string | undefined) => {
      onFiltersChange({
        ...filters,
        [key]: value || undefined,
      });
    },
    [filters, onFiltersChange]
  );

  const clearFilters = useCallback(() => {
    setSearchValue("");
    onFiltersChange({});
  }, [onFiltersChange]);

  const hasActiveFilters =
    filters.category ||
    filters.difficulty ||
    filters.status ||
    filters.search ||
    filters.minReward ||
    filters.maxReward;

  // Count active filters
  const activeFilterCount = [
    filters.category,
    filters.difficulty,
    filters.status,
    filters.minReward,
    filters.maxReward,
  ].filter(Boolean).length;

  if (compact) {
    return (
      <div className={cn("space-y-3", className)}>
        {/* Search + Toggle */}
        <div className="flex gap-3">
          {showSearch && (
            <div className="flex-1 min-w-0 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
              <input
                type="text"
                placeholder="Search bounties..."
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                className={cn(
                  "w-full h-11 pl-10 pr-4 rounded-lg",
                  "bg-bg-secondary/60 border border-border-default",
                  "text-sm text-text-primary placeholder:text-text-tertiary",
                  "focus:outline-none focus:ring-2 focus:ring-accent-green/20 focus:border-accent-green/50",
                  "transition-all duration-200"
                )}
              />
            </div>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "flex items-center justify-center gap-2 h-11 px-4 rounded-lg shrink-0",
              "border transition-all duration-200",
              isExpanded
                ? "bg-accent-green/10 border-accent-green/30 text-accent-green"
                : "bg-bg-secondary/60 border-border-default text-text-secondary hover:border-border-hover hover:text-text-primary"
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-accent-green text-bg-primary text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform duration-200",
              isExpanded && "rotate-180"
            )} />
          </button>
        </div>

        {/* Expandable filters */}
        {isExpanded && (
          <div className="p-4 rounded-xl bg-bg-secondary/50 border border-border-default space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select
              options={categoryOptions}
              value={filters.category || ""}
                onChange={(value) => handleFilterChange("category", value)}
              placeholder="Category"
            />
            <Select
              options={difficultyOptions}
              value={filters.difficulty || ""}
                onChange={(value) => handleFilterChange("difficulty", value)}
              placeholder="Difficulty"
            />
            <Select
              options={statusOptions}
              value={filters.status || ""}
                onChange={(value) => handleFilterChange("status", value)}
              placeholder="Status"
            />
            {showSort && (
              <Select
                options={sortOptions}
                value={filters.sortBy || "newest"}
                  onChange={(value) => handleFilterChange("sortBy", value)}
              />
            )}
            </div>
            
            {hasActiveFilters && (
              <div className="flex items-center justify-between pt-3 border-t border-border-default">
                <div className="flex flex-wrap items-center gap-2">
                  {filters.category && (
                    <Badge
                      variant="active"
                      className="cursor-pointer text-xs"
                      onClick={() => handleFilterChange("category", undefined)}
                    >
                      {categoryOptions.find((c) => c.value === filters.category)?.label}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  )}
                  {filters.difficulty && (
                    <Badge
                      variant="active"
                      className="cursor-pointer text-xs"
                      onClick={() => handleFilterChange("difficulty", undefined)}
                    >
                      {difficultyOptions.find((d) => d.value === filters.difficulty)?.label}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  )}
                  {filters.status && (
                    <Badge
                      variant="active"
                      className="cursor-pointer text-xs"
                      onClick={() => handleFilterChange("status", undefined)}
                    >
                      {statusOptions.find((s) => s.value === filters.status)?.label}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  )}
                </div>
                <button
                  onClick={clearFilters}
                  className="text-xs text-accent-green hover:underline shrink-0"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Non-compact version
  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Bar */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
          <input
            type="text"
            placeholder="Search bounties..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className={cn(
              "w-full h-11 pl-10 pr-4 rounded-lg",
              "bg-bg-secondary/60 border border-border-default",
              "text-sm text-text-primary placeholder:text-text-tertiary",
              "focus:outline-none focus:ring-2 focus:ring-accent-green/20 focus:border-accent-green/50",
              "transition-all duration-200"
            )}
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Select
          options={categoryOptions}
          value={filters.category || ""}
          onChange={(value) => handleFilterChange("category", value)}
          placeholder="Category"
        />
        <Select
          options={difficultyOptions}
          value={filters.difficulty || ""}
          onChange={(value) => handleFilterChange("difficulty", value)}
          placeholder="Difficulty"
        />
        <Select
          options={statusOptions}
          value={filters.status || ""}
          onChange={(value) => handleFilterChange("status", value)}
          placeholder="Status"
        />
        {showSort && (
          <Select
            options={sortOptions}
            value={filters.sortBy || "newest"}
            onChange={(value) => handleFilterChange("sortBy", value)}
          />
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-text-tertiary">Active:</span>
          {filters.category && (
            <Badge
              variant="active"
              className="cursor-pointer"
              onClick={() => handleFilterChange("category", undefined)}
            >
              {categoryOptions.find((c) => c.value === filters.category)?.label}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
          {filters.difficulty && (
            <Badge
              variant="active"
              className="cursor-pointer"
              onClick={() => handleFilterChange("difficulty", undefined)}
            >
              {difficultyOptions.find((d) => d.value === filters.difficulty)?.label}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
          {filters.status && (
            <Badge
              variant="active"
              className="cursor-pointer"
              onClick={() => handleFilterChange("status", undefined)}
            >
              {statusOptions.find((s) => s.value === filters.status)?.label}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
          {filters.search && (
            <Badge
              variant="active"
              className="cursor-pointer"
              onClick={() => {
                setSearchValue("");
                handleFilterChange("search", undefined);
              }}
            >
              &ldquo;{filters.search}&rdquo;
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
          <button
            onClick={clearFilters}
            className="text-xs text-accent-green hover:underline ml-2"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

export default BountyFilters;
