import { Header, Footer } from "@/components/layout";
import { BountyForm } from "@/components/bounty";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Create Bounty",
  description: "Post a new bounty and get help from skilled hunters",
};

export default function CreateBountyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-6 md:py-12">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto">
          {/* Back link */}
          <Link
            href="/explore"
              className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent-green transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to bounties
          </Link>

          {/* Page header */}
          <div className="mb-8">
            <h1 className="heading-1 text-text-primary">Create a Bounty</h1>
            <p className="mt-2 text-text-secondary">
              Post a task and get help from skilled hunters. Funds are locked in escrow until you
              approve the completed work.
            </p>
          </div>

          {/* Bounty Form */}
          <BountyForm />

          {/* Tips */}
            <div className="mt-8 p-5 rounded-xl bg-bg-secondary/50 border border-border-default">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Tips for a great bounty</h3>
              <ul className="space-y-2.5 text-sm text-text-secondary">
              <li className="flex items-start gap-2">
                  <span className="text-accent-green shrink-0">•</span>
                  <span>Be specific about what you need - vague descriptions lead to mismatched expectations</span>
              </li>
              <li className="flex items-start gap-2">
                  <span className="text-accent-green shrink-0">•</span>
                  <span>Set clear acceptance criteria so hunters know exactly what to deliver</span>
              </li>
              <li className="flex items-start gap-2">
                  <span className="text-accent-green shrink-0">•</span>
                  <span>Choose an appropriate reward - higher rewards attract more skilled hunters</span>
              </li>
              <li className="flex items-start gap-2">
                  <span className="text-accent-green shrink-0">•</span>
                  <span>Add a deadline if timing is important for your project</span>
              </li>
            </ul>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}


