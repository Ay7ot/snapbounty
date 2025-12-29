# Micro Bounty Platform (SnapBounty) — Full Product Specification

> A lightweight marketplace where users post small tasks (bounties) and others complete them for fast rewards.

---

## 1. Product Vision

Build a fast, simple, and trustworthy micro‑task platform focused on **small, high-signal tasks** that can be completed in under one hour.

This is **not Upwork**.
This is **not Fiverr**.

This is a place for:

* Quick wins
* Skill proof
* Small money
* Reputation building

---

## 2. Core Principles

1. **Speed > Perfection**
2. **Small tasks only (≤ 1 hour)**
3. **Clear acceptance criteria**
4. **Low friction onboarding**
5. **Trust through visibility**

---

## 3. Target Users

### 1. Bounty Posters

* Indie hackers
* Solo founders
* Early startups
* Builders who want quick help

### 2. Bounty Hunters

* Junior developers
* Designers
* Writers
* Students
* AI prompt engineers

---

## 4. Core Use Cases

### Example Bounties

**Development**

* Fix a React bug
* Convert JS → TS
* Write a helper function

**Design**

* Improve spacing
* Create a simple UI mock
* Redesign a button

**Writing**

* Rewrite landing page copy
* Create a tweet
* Summarize content

**Research**

* Find competitors
* Analyze pricing
* Collect resources

**AI / Prompting**

* Improve an AI prompt
* Generate reusable workflows

---

## 5. MVP Feature Set

### 5.1 Authentication

* Wallet login (recommended)
* Optional email login (later)

### 5.2 User Profiles

Each user has:

* Wallet address
* Username
* Reputation score
* Completed bounties
* Earned amount

---

### 5.3 Bounty Creation

Fields:

* Title
* Description
* Category
* Reward amount
* Deadline (optional)
* Tags (e.g. beginner, urgent)

Rules:

* Fixed price only
* Clear acceptance criteria required

---

### 5.4 Bounty Discovery

Filters:

* Category
* Reward range
* Difficulty
* Newest / Oldest

Sorting:

* Most recent
* Highest reward

---

### 5.5 Bounty Claim Flow

1. User clicks “Claim”
2. Bounty becomes locked
3. User submits work
4. Poster approves or rejects
5. Payment released

---

### 5.6 Submissions

Each submission includes:

* Description
* Optional link (GitHub, Figma, Docs)
* Timestamp

---

### 5.7 Payments

**Phase 1:**

* Manual approval
* Escrow-style logic

**Phase 2:**

* Auto-release after approval window

Supported currencies:

* USDC (recommended)
* ETH (optional)

---

### 5.8 Reputation System

Reputation increases when:

* Completing bounties
* Getting positive feedback

Reputation decreases when:

* Work rejected
* Missed deadlines

---

## 6. Smart Contract Design (Simple)

### Contracts

#### `BountyFactory`

* Creates new bounties

#### `Bounty`

* Stores bounty details
* Holds escrow
* Handles submission + approval

---

### Basic Contract Structure

```
Bounty {
  id
  creator
  hunter
  reward
  status
  createdAt
}
```

States:

* OPEN
* CLAIMED
* COMPLETED
* CANCELLED

---

## 7. Tech Stack

### Frontend

* Next.js (App Router)
* Tailwind CSS
* wagmi + viem
* RainbowKit

### Backend (optional)

* Supabase (metadata, caching)
* Redis (later)

### Blockchain

* Base (recommended)
* Polygon (alternative)

### Storage

* IPFS (optional)

---

## 8. Pages Breakdown

### Public Pages

* Landing
* Explore bounties
* Bounty detail
* User profile

### Auth Pages

* Connect wallet

### Dashboard

* Create bounty
* My bounties
* Submissions

---

## 9. UX Rules

* No modals over modals
* Clear CTAs
* Minimal animations
* Mobile-friendly first

---

## 10. Anti-Abuse Rules

* Max 1 active bounty claim per user
* Rate-limit submissions
* Wallet age check (optional)

---

## 11. Growth Mechanics

### Built-in Virality

* Share completed bounty
* Public profile links

### Reputation System

* Badges
* Leaderboard

---

## 12. Monetization

### Phase 1

* 5–10% platform fee

### Phase 2

* Featured bounties
* Verified profiles

---

## 13. MVP Launch Checklist

* [ ] Create 15 fake bounties
* [ ] Seed fake completions
* [ ] Test mobile UI
* [ ] Write onboarding copy
* [ ] Add analytics

---

## 14. Future Ideas

* AI-assisted bounty matching
* Teams & organizations
* Recurring bounties
* Reputation NFTs

---

## 15. Success Metrics

* Time to first bounty completion
* Daily active users
* Completion rate
* Repeat users

---

## 16. Philosophy

> "People don’t want platforms. They want momentum."

Your job is to remove friction until momentum appears.

---

## 17. Final Notes

Build ugly.
Ship fast.
Iterate ruthlessly.

This product wins through **execution**, not features.
