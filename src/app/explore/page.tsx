import { Suspense } from "react";
import { Header, Footer } from "@/components/layout";
import { SkeletonBountyGrid, NoBountiesFound } from "@/components/ui";
import { getBounties } from "@/lib/actions/bounties";
import { ExploreContent } from "./ExploreContent";

export const metadata = {
  title: "Explore Bounties",
  description: "Browse and discover micro-bounties that match your skills",
};

interface ExplorePageProps {
  searchParams: Promise<{
    category?: string;
    difficulty?: string;
    status?: string;
    search?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;

  // Parse search params into filters
  const filters = {
    category: params.category as any,
    difficulty: params.difficulty as any,
    status: params.status as any,
    search: params.search,
    sortBy: (params.sort || "newest") as any,
  };

  const page = parseInt(params.page || "1", 10);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 md:py-12">
        <div className="container-custom">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="heading-1 text-text-primary">Explore Bounties</h1>
            <p className="mt-2 text-text-secondary">
              Find tasks that match your skills and start earning
            </p>
          </div>

          {/* Content with Suspense */}
          <Suspense fallback={<LoadingState />}>
            <ExploreContentWrapper filters={filters} page={page} />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}

async function ExploreContentWrapper({
  filters,
  page,
}: {
  filters: any;
  page: number;
}) {
  const result = await getBounties(filters, page, 12);

  return (
    <ExploreContent
      initialBounties={result.data}
      initialPagination={result.pagination}
      initialFilters={filters}
    />
  );
}

function LoadingState() {
  return (
    <div className="space-y-8">
      {/* Filters skeleton */}
      <div className="h-12 bg-bg-secondary rounded-lg animate-pulse" />
      {/* Grid skeleton */}
      <SkeletonBountyGrid count={8} />
    </div>
  );
}


