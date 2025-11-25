-- ============================================================================
-- Add invitation_token column to proposal_team table
-- This allows secure invitation links via email
-- ============================================================================

-- Add invitation_token column
ALTER TABLE public.proposal_team
ADD COLUMN IF NOT EXISTS invitation_token TEXT;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_proposal_team_invitation_token
ON public.proposal_team(invitation_token);

-- Verify the column was added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'proposal_team'
AND column_name = 'invitation_token';
