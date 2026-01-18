export const siteConfig = {
    name: "SnapBounty",
    tagline: "Micro Bounties, Instant Rewards",
    description:
        "The decentralized marketplace for micro-tasks. Complete bounties, earn crypto, and build your on-chain reputation. Fast, secure, trustless.",
    longDescription:
        "SnapBounty is a Web3-powered micro-task marketplace where users post small tasks (bounties) and skilled hunters complete them for fast rewards in USDC. Built on Base network with secure smart contract escrow.",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://snapbounty.online",
    domain: "snapbounty.online",

    // SEO & Branding
    keywords: [
        "bounty platform",
        "micro tasks",
        "web3 freelance",
        "crypto rewards",
        "earn crypto",
        "USDC payments",
        "Base network",
        "decentralized marketplace",
        "smart contract escrow",
        "development bounties",
        "design tasks",
        "blockchain jobs",
        "freelance web3",
        "on-chain reputation",
    ],

    // Platform settings
    platformFee: 0.05, // 5% platform fee
    maxBountyReward: 1000, // Max reward in USD equivalent
    minBountyReward: 1, // Min reward in USD equivalent
    maxActiveClaims: 1, // Max active bounty claims per user

    // Categories
    categories: [
        { id: "development", label: "Development", icon: "code" },
        { id: "design", label: "Design", icon: "palette" },
        { id: "writing", label: "Writing", icon: "pen" },
        { id: "research", label: "Research", icon: "search" },
        { id: "ai-prompting", label: "AI / Prompting", icon: "sparkles" },
        { id: "other", label: "Other", icon: "more-horizontal" },
    ] as const,

    // Difficulty levels
    difficulties: [
        { id: "beginner", label: "Beginner", color: "status-open" },
        { id: "intermediate", label: "Intermediate", color: "status-active" },
        { id: "advanced", label: "Advanced", color: "status-pending" },
    ] as const,

    // Bounty statuses
    statuses: [
        { id: "open", label: "Open", color: "status-open" },
        { id: "claimed", label: "Claimed", color: "status-active" },
        { id: "submitted", label: "In Review", color: "status-pending" },
        { id: "completed", label: "Completed", color: "status-completed" },
        { id: "cancelled", label: "Cancelled", color: "status-closed" },
        { id: "disputed", label: "In Dispute", color: "status-pending" },
    ] as const,

    // Social links
    links: {
        twitter: "https://twitter.com/snapbounty",
        github: "https://github.com/snapbounty",
        discord: "https://discord.gg/snapbounty",
    },

    // Contact
    email: "hello@snapbounty.online",
} as const;

export type Category = (typeof siteConfig.categories)[number]["id"];
export type Difficulty = (typeof siteConfig.difficulties)[number]["id"];
export type BountyStatus = (typeof siteConfig.statuses)[number]["id"];






