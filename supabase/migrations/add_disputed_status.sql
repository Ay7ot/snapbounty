-- Add 'disputed' status to bounties table
-- Run this migration in your Supabase SQL Editor

-- Drop the existing constraint
ALTER TABLE bounties DROP CONSTRAINT IF EXISTS bounties_status_check;

-- Add the new constraint with 'disputed' status
ALTER TABLE bounties ADD CONSTRAINT bounties_status_check 
  CHECK (status IN ('open', 'claimed', 'submitted', 'completed', 'cancelled', 'disputed'));
