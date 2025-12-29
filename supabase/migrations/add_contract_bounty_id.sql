-- Migration: Add contract_bounty_id to bounties table
-- This column links Supabase bounties to on-chain smart contract bounties

-- Add the column (nullable to allow existing bounties without contract IDs)
ALTER TABLE bounties 
ADD COLUMN IF NOT EXISTS contract_bounty_id INTEGER UNIQUE;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_bounties_contract_bounty_id 
ON bounties(contract_bounty_id);

-- Add comment explaining the column
COMMENT ON COLUMN bounties.contract_bounty_id IS 
'Maps to the smart contract bounty ID. Null if bounty was created before this migration or if contract creation failed.';

