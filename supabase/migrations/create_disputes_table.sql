-- Create disputes table for storing evidence URLs
-- Run this migration in your Supabase SQL Editor

-- =============================================
-- DISPUTES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bounty_id UUID REFERENCES bounties(id) ON DELETE CASCADE,
  contract_bounty_id INTEGER NOT NULL,
  hunter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  hunter_evidence_url TEXT NOT NULL,
  creator_evidence_url TEXT,
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  resolution TEXT CHECK (resolution IN ('pending', 'hunter_wins', 'creator_wins', 'split')),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_disputes_bounty_id ON disputes(bounty_id);
CREATE INDEX IF NOT EXISTS idx_disputes_contract_bounty_id ON disputes(contract_bounty_id);
CREATE INDEX IF NOT EXISTS idx_disputes_hunter_id ON disputes(hunter_id);
CREATE INDEX IF NOT EXISTS idx_disputes_creator_id ON disputes(creator_id);
CREATE INDEX IF NOT EXISTS idx_disputes_resolved ON disputes(resolved);

-- Apply updated_at trigger
CREATE TRIGGER update_disputes_updated_at
  BEFORE UPDATE ON disputes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Anyone can view disputes (arbiter needs to see all)
CREATE POLICY "Disputes are viewable by everyone" ON disputes
  FOR SELECT USING (true);

-- System can create disputes (via admin client)
CREATE POLICY "System can create disputes" ON disputes
  FOR INSERT WITH CHECK (true);

-- System can update disputes (via admin client)
CREATE POLICY "System can update disputes" ON disputes
  FOR UPDATE USING (true);
