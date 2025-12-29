"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { BountyCard, BountyFilters } from "@/components/bounty";
import { Button } from "@/components/ui/Button";
import { NoBountiesFound, SkeletonBountyGrid } from "@/components/ui";
import type { Bounty, BountyFilters as BountyFiltersType, PaginatedResponse } from "@/types";

interface ExploreContentProps {
  initialBounties: Bounty[];
  initialPagination: PaginatedResponse<Bounty>["pagination"];
  initialFilters: BountyFiltersType;
}

export function ExploreContent({
  initialBounties,
  initialPagination,
  initialFilters,
}: ExploreContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [filters, setFilters] = useState<BountyFiltersType>(initialFilters);
  const bounties = initialBounties;
  const pagination = initialPagination;

  // Update URL when filters change
  const handleFiltersChange = useCallback(
    (newFilters: BountyFiltersType) => {
      setFilters(newFilters);

      // Build new URL
      const params = new URLSearchParams();
      if (newFilters.category) params.set("category", newFilters.category);
      if (newFilters.difficulty) params.set("difficulty", newFilters.difficulty);
      if (newFilters.status) params.set("status", newFilters.status);
      if (newFilters.search) params.set("search", newFilters.search);
      if (newFilters.sortBy && newFilters.sortBy !== "newest") params.set("sort", newFilters.sortBy);

      startTransition(() => {
        router.push(`/explore${params.toString() ? `?${params.toString()}` : ""}`);
      });
    },
    [router]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", newPage.toString());

      startTransition(() => {
        router.push(`/explore?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const clearFilters = useCallback(() => {
    setFilters({});
    startTransition(() => {
      router.push("/explore");
    });
  }, [router]);

  return (
    <div className="space-y-6">
      {/* Filters + CTA */}
      <div className="flex flex-col gap-4">
        {/* Mobile: CTA on top */}
        <div className="flex sm:hidden">
          <Link href="/create" className="w-full">
            <Button size="lg" className="w-full flex items-center justify-center gap-2">
              <Plus className="h-5 w-5" />
              Post Bounty
            </Button>
          </Link>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1 min-w-0">
          <BountyFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            compact
          />
        </div>
          
          {/* Desktop: CTA */}
          <Link href="/create" className="hidden sm:block shrink-0">
            <Button size="lg" className="flex items-center gap-2 whitespace-nowrap">
              <Plus className="h-5 w-5" />
            Post Bounty
          </Button>
        </Link>
        </div>
      </div>

      {/* Loading overlay */}
      {isPending && (
        <div className="relative">
          <div className="absolute inset-0 bg-bg-primary/50 z-10 rounded-xl" />
          <SkeletonBountyGrid count={8} />
        </div>
      )}

      {/* Bounty Grid */}
      {!isPending && bounties.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {bounties.map((bounty) => (
              <BountyCard key={bounty.id} bounty={bounty} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Previous</span>
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === pagination.totalPages ||
                      Math.abs(p - pagination.page) <= 1
                  )
                  .map((p, i, arr) => {
                    // Add ellipsis
                    const prevPage = arr[i - 1];
                    const showEllipsis = prevPage && p - prevPage > 1;

                    return (
                      <span key={p} className="flex items-center">
                        {showEllipsis && (
                          <span className="px-2 text-text-tertiary">…</span>
                        )}
                        <button
                          onClick={() => handlePageChange(p)}
                          className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all ${
                            p === pagination.page
                              ? "bg-accent-green text-bg-primary"
                              : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                          }`}
                        >
                          {p}
                        </button>
                      </span>
                    );
                  })}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasMore}
                className="gap-1"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Results count */}
          <p className="text-center text-sm text-text-tertiary">
            Showing {bounties.length} of {pagination.total} bounties
          </p>
        </>
      )}

      {/* Empty state */}
      {!isPending && bounties.length === 0 && (
        <NoBountiesFound onClearFilters={clearFilters} />
      )}
    </div>
  );
}
