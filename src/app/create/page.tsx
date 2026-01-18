import { Header, Footer } from "@/components/layout";
import { BountyForm } from "@/components/bounty";
import { ArrowLeft, Lightbulb } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Create Bounty",
  description: "Post a new bounty and get help from skilled hunters",
};

export default function CreateBountyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 md:py-12">
        <div className="container-custom">
          {/* Back link */}
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent-green transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to bounties
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Main Form Area */}
            <div className="lg:col-span-2">
              {/* Page header */}
              <div className="mb-8">
                <h1 className="heading-1 text-text-primary">Post a Bounty</h1>
                <p className="mt-3 text-text-secondary max-w-xl">
                  Describe your task, set a reward, and let skilled hunters compete to help you.
                  Funds are held securely in escrow.
                </p>
              </div>

              {/* Form */}
              <div className="p-6 md:p-8 rounded-2xl bg-bg-secondary/50 border border-border-default">
                <BountyForm />
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24 space-y-6">
                {/* Tips Card */}
                <div className="p-6 rounded-xl bg-linear-to-br from-accent-green/5 to-accent-purple/5 border border-border-default">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-accent-green/10 flex items-center justify-center">
                      <Lightbulb className="h-4 w-4 text-accent-green" />
                    </div>
                    <h3 className="font-semibold text-text-primary">Tips for Success</h3>
                  </div>
                  <ul className="space-y-3 text-sm text-text-secondary">
                    <li className="flex items-start gap-2">
                      <span className="text-accent-green shrink-0 mt-1">•</span>
                      <span>Be specific about deliverables — vague requests lead to mismatched results</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-green shrink-0 mt-1">•</span>
                      <span>Set clear acceptance criteria so hunters know exactly what &quot;done&quot; looks like</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-green shrink-0 mt-1">•</span>
                      <span>Higher rewards attract more skilled hunters and faster responses</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-green shrink-0 mt-1">•</span>
                      <span>Add a deadline if timing matters for your project</span>
                    </li>
                  </ul>
                </div>

                {/* How it works */}
                <div className="p-6 rounded-xl bg-bg-secondary border border-border-default">
                  <h3 className="font-semibold text-text-primary mb-4">How It Works</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-accent-green/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-accent-green">1</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">Post your bounty</p>
                        <p className="text-xs text-text-tertiary mt-0.5">Funds locked in escrow</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-accent-blue/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-accent-blue">2</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">Hunter claims & works</p>
                        <p className="text-xs text-text-tertiary mt-0.5">Exclusive access to complete</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-accent-purple/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-accent-purple">3</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">Review & approve</p>
                        <p className="text-xs text-text-tertiary mt-0.5">Payment released on approval</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Escrow Badge */}
                <div className="p-4 rounded-xl bg-bg-elevated border border-accent-green/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent-green/10 flex items-center justify-center">
                      <svg
                        className="h-5 w-5 text-accent-green"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">Secure Escrow</p>
                      <p className="text-xs text-text-tertiary">Funds protected by smart contract</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
