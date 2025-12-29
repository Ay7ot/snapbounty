import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/layout";
import { BountyDetail } from "@/components/bounty";
import { getBountyById } from "@/lib/actions/bounties";
import { getSubmissionsByBounty } from "@/lib/actions/submissions";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface BountyPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: BountyPageProps) {
  const { id } = await params;
  const bounty = await getBountyById(id);

  if (!bounty) {
    return {
      title: "Bounty Not Found",
    };
  }

  return {
    title: bounty.title,
    description: bounty.description.slice(0, 160),
  };
}

export default async function BountyPage({ params }: BountyPageProps) {
  const { id } = await params;
  const bounty = await getBountyById(id);

  if (!bounty) {
    notFound();
  }

  // Get submissions for this bounty
  const submissions = await getSubmissionsByBounty(id);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-6 md:py-12">
        <div className="container-custom">
          {/* Back link */}
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent-green transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to bounties
          </Link>

          {/* Bounty Detail */}
          <BountyDetail bounty={bounty} submissions={submissions} />
        </div>
      </main>

      <Footer />
    </div>
  );
}


