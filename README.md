# SnapBounty

> A lightweight marketplace where users post small tasks (bounties) and others complete them for fast rewards.

![SnapBounty](https://img.shields.io/badge/Status-Development-yellow)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Base](https://img.shields.io/badge/Chain-Base-blue)

## 🎯 Vision

Build a fast, simple, and trustworthy micro-task platform focused on **small, high-signal tasks** that can be completed in under one hour.

This is **not Upwork**. This is **not Fiverr**.

This is a place for:

- ⚡ Quick wins
- 🏆 Skill proof
- 💰 Small money
- ⭐ Reputation building

## 🛠 Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Web3:** wagmi, viem, RainbowKit
- **Backend:** Supabase (PostgreSQL + Auth)
- **Blockchain:** Base (L2)
- **Styling:** Custom design system (HackenProof-inspired dark theme)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── globals.css         # Global styles + design system
│   ├── layout.tsx          # Root layout with providers
│   └── page.tsx            # Landing page
├── components/
│   ├── ui/                 # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   └── Input.tsx
│   ├── layout/             # Layout components
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── bounty/             # Bounty-specific components
│   └── wallet/             # Wallet-specific components
├── config/
│   ├── site.ts             # Site configuration
│   └── wagmi.ts            # Web3 configuration
├── hooks/                  # Custom React hooks
│   └── useUser.ts
├── lib/
│   ├── supabase/           # Supabase client setup
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   └── utils.ts            # Utility functions
├── providers/              # React context providers
│   ├── Web3Provider.tsx
│   └── index.tsx
└── types/                  # TypeScript types
    └── index.ts
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Supabase project
- WalletConnect Project ID

### Installation

1. **Clone the repository**

   ```bash
   cd snapbounty
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Then fill in your values:

   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - Get from [WalletConnect Cloud](https://cloud.walletconnect.com/)

4. **Set up the database**

   Run the SQL in `supabase/schema.sql` in your Supabase SQL Editor.

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## 🎨 Design System

The design follows a professional security-first aesthetic with web3 sophistication:

### Colors

- **Primary Background:** `#0A0E27` (deep blue-gray)
- **Accent Green:** `#00FFA3` (electric cyan-green)
- **Accent Purple:** `#7B3FF2` (secondary actions)
- **Text Primary:** `#E2E8F0` (high contrast)

### Typography

- **Primary Font:** Inter
- **Monospace:** JetBrains Mono (for addresses, code)

### Key Components

- `Button` - Primary, secondary, ghost variants
- `Card` - Default, elevated, outline variants
- `Badge` - Status indicators (open, active, pending, completed, closed)
- `Input` - Text input with focus states

## 📋 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 🗺 Roadmap

### Phase 1: MVP

- [ ] Landing page
- [ ] Wallet connection
- [ ] Bounty creation
- [ ] Bounty discovery
- [ ] Basic claim flow
- [ ] Submission handling

### Phase 2: Core Features

- [ ] User profiles
- [ ] Reputation system
- [ ] Payment integration (USDC)
- [ ] Notifications

### Phase 3: Growth

- [ ] Leaderboard
- [ ] Featured bounties
- [ ] Categories & tags
- [ ] Search & filters

## 📄 License

MIT

---

Built with 💚 for the micro-task economy.
