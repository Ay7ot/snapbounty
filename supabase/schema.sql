-- SnapBounty Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  reputation INTEGER DEFAULT 0,
  completed_bounties INTEGER DEFAULT 0,
  total_earned DECIMAL(20, 8) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for wallet address lookups
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);

-- =============================================
-- BOUNTIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS bounties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_bounty_id INTEGER UNIQUE, -- Maps to smart contract bounty ID
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('development', 'design', 'writing', 'research', 'ai-prompting', 'other')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  reward DECIMAL(20, 8) NOT NULL,
  reward_token TEXT NOT NULL DEFAULT 'USDC',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'claimed', 'submitted', 'completed', 'cancelled')),
  deadline TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  acceptance_criteria TEXT NOT NULL,
  submission_count INTEGER DEFAULT 0,
  hunter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Index for contract bounty ID lookups
CREATE INDEX IF NOT EXISTS idx_bounties_contract_bounty_id ON bounties(contract_bounty_id);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bounties_status ON bounties(status);
CREATE INDEX IF NOT EXISTS idx_bounties_category ON bounties(category);
CREATE INDEX IF NOT EXISTS idx_bounties_creator_id ON bounties(creator_id);
CREATE INDEX IF NOT EXISTS idx_bounties_hunter_id ON bounties(hunter_id);
CREATE INDEX IF NOT EXISTS idx_bounties_created_at ON bounties(created_at DESC);

-- =============================================
-- SUBMISSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bounty_id UUID REFERENCES bounties(id) ON DELETE CASCADE,
  hunter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  proof_link TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_submissions_bounty_id ON submissions(bounty_id);
CREATE INDEX IF NOT EXISTS idx_submissions_hunter_id ON submissions(hunter_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

-- =============================================
-- NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bounty_claimed', 'submission_received', 'submission_approved', 'submission_rejected', 'payment_received', 'bounty_expired')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  related_bounty_id UUID REFERENCES bounties(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- =============================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bounties_updated_at
  BEFORE UPDATE ON bounties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users: Anyone can read, only owner can update
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (true);

-- Bounties: Anyone can read, creator can update/delete
CREATE POLICY "Bounties are viewable by everyone" ON bounties
  FOR SELECT USING (true);

CREATE POLICY "Users can create bounties" ON bounties
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Creators can update own bounties" ON bounties
  FOR UPDATE USING (
    creator_id IN (
      SELECT id FROM users WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    )
  );

-- Submissions: Bounty creator and hunter can view, hunter can create
CREATE POLICY "Submissions viewable by involved parties" ON submissions
  FOR SELECT USING (true);

CREATE POLICY "Users can create submissions" ON submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Hunters can update own submissions" ON submissions
  FOR UPDATE USING (
    hunter_id IN (
      SELECT id FROM users WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    )
  );

-- Notifications: Only owner can view
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM users WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    )
  );

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM users WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    )
  );

