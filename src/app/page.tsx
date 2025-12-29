"use client";

import { Header, Footer } from "@/components/layout";
import { Button, Badge, Card, CardContent } from "@/components/ui";
import {
  ArrowRight,
  Zap,
  Shield,
  Clock,
  Users,
  Code,
  Palette,
  FileText,
  Search,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Star,
  Trophy,
} from "lucide-react";
import Link from "next/link";

// Platform statistics
const stats = [
  { label: "Protocol Fee", value: "5%", prefix: "Low " },
  { label: "Security", value: "100%", prefix: "" },
  { label: "Network", value: "Base", prefix: "On " },
];

// Example bounties
const exampleBounties = [
  {
    id: "1",
    title: "Review Smart Contract Logic",
    company: "DeFi Protocol",
    reward: 150,
    category: "Development",
    difficulty: "Intermediate",
    featured: true,
  },
  {
    id: "2",
    title: "Design New Landing Page",
    company: "NFT Marketplace",
    reward: 300,
    category: "Design",
    difficulty: "Advanced",
    featured: true,
  },
  {
    id: "3",
    title: "Write Technical Documentation",
    company: "Web3 Startup",
    reward: 100,
    category: "Writing",
    difficulty: "Beginner",
    featured: false,
  },
  {
    id: "4",
    title: "Create Marketing Assets",
    company: "DAO",
    reward: 500,
    category: "Design",
    difficulty: "Intermediate",
    featured: true,
  },
];

// Features list
const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Complete tasks in under an hour. Get paid immediately after approval.",
  },
  {
    icon: Shield,
    title: "Secure Escrow",
    description: "Funds are locked in smart contracts until work is approved.",
  },
  {
    icon: Clock,
    title: "Quick Turnaround",
    description: "No long proposals or negotiations. Claim, complete, get paid.",
  },
  {
    icon: Trophy,
    title: "Build Reputation",
    description: "Earn badges, climb leaderboards, and unlock premium bounties.",
  },
];

// Categories
const categories = [
  { name: "Development", icon: Code, count: 45, color: "text-accent-green" },
  { name: "Design", icon: Palette, count: 28, color: "text-accent-purple" },
  { name: "Writing", icon: FileText, count: 19, color: "text-accent-blue" },
  { name: "Research", icon: Search, count: 12, color: "text-accent-orange" },
  { name: "AI / Prompting", icon: Sparkles, count: 23, color: "text-accent-green" },
];

// How it works steps
const steps = [
  {
    step: "01",
    title: "Connect Wallet",
    description: "Link your wallet to get started. No email required.",
  },
  {
    step: "02",
    title: "Find a Bounty",
    description: "Browse tasks that match your skills and interests.",
  },
  {
    step: "03",
    title: "Claim & Complete",
    description: "Lock in the bounty and submit your work.",
  },
  {
    step: "04",
    title: "Get Paid",
    description: "Receive USDC instantly after approval.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 overflow-hidden">
          {/* Background Ambient Glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-accent-purple/20 rounded-full blur-[120px] opacity-30 pointer-events-none" />
          <div className="absolute top-[20%] right-0 w-[800px] h-[800px] bg-accent-green/10 rounded-full blur-[100px] opacity-20 pointer-events-none" />

          <div className="container-custom relative z-10">
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
              <Badge variant="open" className="mb-8 px-4 py-1.5 text-sm backdrop-blur-md border border-accent-green/20">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-green"></span>
                </span>
                Live on Base Network
              </Badge>

              <h1 className="heading-display text-text-primary mb-6">
                Micro Bounties, <br />
                <span className="text-gradient-green">Instant Rewards</span>
              </h1>

              <p className="text-xl text-text-secondary max-w-2xl mb-10 leading-relaxed">
                The decentralized marketplace for micro-tasks.
                Complete bounties, earn crypto, and build your on-chain reputation.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Link href="/explore" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto min-w-[160px] h-12 text-base">
                    Explore Bounties
                  </Button>
                </Link>
                <Link href="/create" className="w-full sm:w-auto">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto min-w-[160px] h-12 text-base">
                    Post a Bounty
                  </Button>
                </Link>
              </div>

              {/* Stats Strip */}
              <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl">
                {stats.map((stat) => (
                  <div key={stat.label} className="glass-panel rounded-lg p-6 text-center hover:bg-bg-elevated/50 transition-colors">
                    <p className="text-3xl font-bold text-white mb-1">{stat.prefix}{stat.value}</p>
                    <p className="text-sm text-text-tertiary uppercase tracking-wider font-semibold">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Bounties Section */}
        <section className="py-24 bg-bg-secondary/50 border-y border-border-default">
          <div className="container-custom">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <h2 className="heading-2 text-text-primary mb-2 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-accent-purple" />
                  Explore Possibilities
                </h2>
                <p className="text-text-secondary">See examples of what you can get done on SnapBounty.</p>
              </div>
              <Link href="/create" className="text-accent-green hover:text-accent-green-hover font-medium flex items-center gap-1 transition-colors">
                Post your own <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {exampleBounties.map((bounty) => (
                <Link key={bounty.id} href="/create" className="group">
                  <article className="glass-card h-full rounded-lg p-6 relative overflow-hidden group-hover:-translate-y-1 transition-transform duration-300">
                    <div className="absolute inset-0 bg-linear-to-br from-accent-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="absolute top-4 right-4">
                      <Badge variant="default" className="text-[10px] px-2 py-0.5 uppercase tracking-wide bg-white/5 text-text-tertiary">Example</Badge>
                    </div>

                    <div className="relative z-10">
                      <div className="w-12 h-12 rounded-md bg-bg-elevated border border-border-default flex items-center justify-center mb-6 group-hover:border-accent-green/30 transition-colors">
                        <Code className="h-6 w-6 text-text-secondary group-hover:text-accent-green transition-colors" />
                      </div>

                      <p className="text-xs font-medium text-text-tertiary mb-2">Category: {bounty.category}</p>
                      <h3 className="text-lg font-semibold text-text-primary mb-4 line-clamp-2 min-h-14 wrap-break-word">
                        {bounty.title}
                      </h3>

                      <div className="flex items-center justify-between pt-4 border-t border-border-default">
                        <Badge variant="default" className="bg-bg-primary/50 text-xs border-transparent">
                          {bounty.difficulty}
                        </Badge>
                        <span className="text-sm font-medium text-accent-green flex items-center gap-1">
                          Post Similar <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-32 relative">
          <div className="container-custom">
            <div className="text-center mb-20">
              <h2 className="heading-1 text-text-primary mb-6">How It Works</h2>
              <p className="text-lg text-text-secondary max-w-xl mx-auto">
                Start earning in minutes. No complex sign-up flows.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 relative">
              {/* Connecting Line (Desktop) */}
              <div className="hidden lg:block absolute top-8 left-0 w-full h-1 bg-linear-to-r from-transparent via-border-default to-transparent z-0" />

              {steps.map((item, index) => (
                <div key={item.step} className="relative z-10 group">
                  <div className="w-16 h-16 rounded-lg bg-bg-tertiary border border-border-default flex items-center justify-center mb-6 mx-auto group-hover:border-accent-green/50 group-hover:shadow-[0_0_20px_rgba(0,255,163,0.15)] transition-all duration-300">
                    <span className="text-xl font-bold text-text-secondary group-hover:text-accent-green">{item.step}</span>
                  </div>
                  <div className="text-center px-4">
                    <h3 className="text-lg font-bold text-text-primary mb-3">{item.title}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="py-24 bg-bg-elevated/30">
          <div className="container-custom">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="heading-2 text-text-primary mb-2">Explore Categories</h2>
                <p className="text-text-secondary">Find work that matches your expertise.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {categories.map((category) => (
                <Link
                  key={category.name}
                  href={`/explore?category=${category.name.toLowerCase()}`}
                  className="group"
                >
                  <div className="h-full p-6 rounded-lg bg-bg-tertiary border border-border-default hover:border-accent-green/30 hover:bg-bg-tertiary/80 transition-all duration-300 flex flex-col items-center text-center">
                    <div className={`p-3 rounded-full bg-bg-primary mb-4 ${category.color} bg-opacity-10`}>
                      <category.icon className={`h-6 w-6 ${category.color}`} />
                    </div>
                    <h3 className="font-medium text-text-primary mb-1 group-hover:text-accent-green transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-xs text-text-tertiary">{category.count} active</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Why SnapBounty */}
        <section className="py-32">
          <div className="container-custom">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="heading-1 text-text-primary mb-6">
                  Why SnapBounty?
                </h2>
                <p className="text-lg text-text-secondary mb-8 leading-relaxed">
                  Traditional freelancing platforms are slow, expensive, and centralized.
                  We built SnapBounty to be the opposite.
                </p>

                <div className="space-y-6">
                  {features.map((feature) => (
                    <div key={feature.title} className="flex gap-4">
                      <div className="shrink-0 w-12 h-12 rounded-md bg-accent-green/10 flex items-center justify-center">
                        <feature.icon className="h-5 w-5 text-accent-green" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-text-primary mb-1">{feature.title}</h3>
                        <p className="text-text-secondary text-sm leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-accent-purple/20 blur-[100px] rounded-full opacity-20" />
                <div className="relative glass-panel rounded-lg p-8 border border-border-default">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-full bg-accent-green/20 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-accent-green" />
                    </div>
                    <div>
                      <p className="text-sm text-text-secondary">Protocol Status</p>
                      <p className="text-2xl font-bold text-text-primary">Live Beta</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-md bg-bg-primary/50 border border-border-default">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <Shield className="h-4 w-4 text-blue-500" />
                        </div>
                        <span className="text-sm font-medium">Smart Contracts</span>
                      </div>
                      <span className="font-bold text-text-primary text-sm">Audited</span>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-md bg-bg-primary/50 border border-border-default">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent-orange/20 flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4 text-accent-orange" />
                        </div>
                        <span className="text-sm font-medium">Network</span>
                      </div>
                      <span className="font-bold text-text-primary text-sm">Base Sepolia</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container-custom">
            <div className="relative rounded-lg overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-r from-accent-purple/20 to-accent-green/20 opacity-30" />
              <div className="absolute inset-0 bg-bg-elevated/40 backdrop-blur-sm" />

              <div className="relative z-10 px-6 py-20 text-center">
                <h2 className="heading-1 text-white mb-6">Ready to Start Earning?</h2>
                <p className="text-lg text-gray-300 max-w-xl mx-auto mb-10">
                  Connect your wallet and browse hundreds of active bounties.
                  The future of work is decentralized.
                </p>
                <Link href="/explore">
                  <Button size="lg" className="min-w-[200px] h-14 text-lg shadow-[0_0_30px_rgba(0,255,163,0.3)]">
                    Start Hunting Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
