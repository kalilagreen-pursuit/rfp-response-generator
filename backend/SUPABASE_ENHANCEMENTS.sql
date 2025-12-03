-- ============================================================================
-- Supabase Database Enhancements
-- Safe to run - these are non-breaking additions to existing schema
-- ============================================================================

-- ============================================================================
-- 1. ADD UNIQUE CONSTRAINT TO PREVENT DUPLICATE INVITATIONS
-- ============================================================================

-- This prevents the same person from being invited multiple times to the same proposal
ALTER TABLE proposal_team
ADD CONSTRAINT unique_proposal_member
UNIQUE (proposal_id, member_email);

-- Verify it was added
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'proposal_team'
  AND constraint_type = 'UNIQUE';

-- Expected: Should see 'unique_proposal_member' constraint

-- ============================================================================
-- 2. ADD CAPABILITIES COLUMN FOR MARKETPLACE MATCHING
-- ============================================================================

-- Add capabilities array for skill-based matching
ALTER TABLE company_profiles
ADD COLUMN IF NOT EXISTS capabilities TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add GIN index for fast array searching
CREATE INDEX IF NOT EXISTS idx_company_profiles_capabilities
ON company_profiles USING GIN(capabilities);

-- Verify column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'company_profiles'
  AND column_name = 'capabilities';

-- Expected: Should see capabilities with type ARRAY

-- ============================================================================
-- 3. ADD WEBSITE COLUMN (Optional but nice to have)
-- ============================================================================

ALTER TABLE company_profiles
ADD COLUMN IF NOT EXISTS website TEXT;

-- ============================================================================
-- 4. ADD MESSAGE COLUMN TO INVITATIONS (Optional)
-- ============================================================================

-- Allows inviter to include a custom message with the invitation
ALTER TABLE proposal_team
ADD COLUMN IF NOT EXISTS message TEXT;

-- ============================================================================
-- 5. ADD CONDITIONAL INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for public profiles (marketplace queries)
CREATE INDEX IF NOT EXISTS idx_company_profiles_visibility_public
ON company_profiles(visibility)
WHERE visibility = 'public';

-- Index for public profiles by industry
CREATE INDEX IF NOT EXISTS idx_company_profiles_industry
ON company_profiles(industry)
WHERE industry IS NOT NULL AND visibility = 'public';

-- Index for invitation token lookups (already exists, but verify)
CREATE INDEX IF NOT EXISTS idx_proposal_team_invitation_token
ON proposal_team(invitation_token)
WHERE invitation_token IS NOT NULL;

-- ============================================================================
-- 6. VERIFY ALL ENHANCEMENTS
-- ============================================================================

-- Check all columns were added
SELECT
  table_name,
  column_name,
  data_type,
  CASE
    WHEN column_name IN ('capabilities', 'website', 'message') THEN '✅ Added'
    ELSE '📋 Existing'
  END as status
FROM information_schema.columns
WHERE table_name IN ('company_profiles', 'proposal_team')
  AND column_name IN ('capabilities', 'website', 'message', 'user_id', 'invitation_token')
ORDER BY table_name, column_name;

-- Check constraint was added
SELECT
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints
WHERE table_name = 'proposal_team'
  AND constraint_name = 'unique_proposal_member';

-- Check indexes were added
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_company_profiles_capabilities',
    'idx_company_profiles_visibility_public',
    'idx_company_profiles_industry',
    'idx_proposal_team_invitation_token'
  )
ORDER BY indexname;

-- ============================================================================
-- SUMMARY
-- ============================================================================

-- After running this script, your database will have:
-- ✅ UNIQUE constraint preventing duplicate invitations
-- ✅ capabilities column for marketplace matching
-- ✅ website column for profile completeness
-- ✅ message column for custom invitation messages
-- ✅ Performance indexes for common queries
-- ✅ All existing data preserved (non-breaking changes)

-- ============================================================================
-- COMPLETE
-- ============================================================================
