-- ============================================================================
-- Supabase Database Verification Queries
-- Run these in Supabase SQL Editor to verify your database schema
-- ============================================================================

-- ============================================================================
-- 1. CHECK ALL TABLES EXIST
-- ============================================================================
SELECT
  table_name,
  CASE
    WHEN table_name IN ('company_profiles', 'documents', 'rfp_uploads', 'proposals',
                        'proposal_team', 'proposal_time_tracking', 'network_connections')
    THEN '✅ Expected'
    ELSE '⚠️ Unexpected'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Expected output:
-- company_profiles ✅
-- documents ✅
-- rfp_uploads ✅ (NOT 'rfps' - backend uses 'rfp_uploads')
-- proposals ✅
-- proposal_team ✅
-- proposal_time_tracking ✅
-- network_connections ✅

-- ============================================================================
-- 2. CHECK DOCUMENTS TABLE STRUCTURE (CRITICAL!)
-- ============================================================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'documents'
  AND column_name IN ('user_id', 'profile_id', 'filename', 'file_name',
                      'document_type', 'type', 'file_path', 'storage_path')
ORDER BY column_name;

-- Expected: Either user_id OR profile_id (need to verify which one backend uses)
-- Expected: Either filename OR file_name
-- Expected: Either document_type OR type
-- Expected: Either file_path OR storage_path

-- ============================================================================
-- 3. CHECK PROPOSAL_TEAM CRITICAL COLUMNS
-- ============================================================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'proposal_team'
  AND column_name IN ('invitation_token', 'member_email', 'member_profile_id', 'message')
ORDER BY column_name;

-- Expected:
-- invitation_token (uuid) ✅ - You confirmed this exists!
-- member_email (text) ✅
-- member_profile_id (uuid) - optional, nullable
-- message (text) - nice to have

-- ============================================================================
-- 4. CHECK COMPANY_PROFILES STRUCTURE
-- ============================================================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'company_profiles'
  AND column_name IN ('user_id', 'company_name', 'industry', 'website',
                      'capabilities', 'is_public', 'visibility', 'profile_strength')
ORDER BY column_name;

-- Expected:
-- user_id ✅
-- company_name ✅
-- industry ✅
-- website (nice to have)
-- capabilities (text[] - important for matching)
-- is_public OR visibility (one of these)
-- profile_strength ✅

-- ============================================================================
-- 5. CHECK RFP_UPLOADS STRUCTURE
-- ============================================================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'rfp_uploads'
  AND column_name IN ('id', 'user_id', 'file_name', 'storage_path',
                      'extracted_data', 'confidence_score', 'uploaded_at')
ORDER BY column_name;

-- Expected:
-- All columns above should exist
-- Backend uses rfp_uploads, not rfps!

-- ============================================================================
-- 6. CHECK ALL INDEXES EXIST
-- ============================================================================
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('company_profiles', 'documents', 'rfp_uploads', 'proposals',
                    'proposal_team', 'proposal_time_tracking', 'network_connections')
ORDER BY tablename, indexname;

-- Critical indexes to verify:
-- idx_proposal_team_invitation_token ✅ (for email invitation links)
-- idx_documents_user_id OR idx_documents_profile_id
-- idx_company_profiles_user_id
-- idx_proposals_user_id

-- ============================================================================
-- 7. CHECK ROW LEVEL SECURITY (RLS) IS ENABLED
-- ============================================================================
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE
    WHEN rowsecurity THEN '✅ RLS Enabled'
    ELSE '⚠️ RLS DISABLED - SECURITY RISK!'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('company_profiles', 'documents', 'rfp_uploads', 'proposals',
                    'proposal_team', 'proposal_time_tracking', 'network_connections')
ORDER BY tablename;

-- Expected: All tables should have RLS enabled = true

-- ============================================================================
-- 8. CHECK RLS POLICIES EXIST
-- ============================================================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation,
  qual as using_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('company_profiles', 'documents', 'rfp_uploads', 'proposals',
                    'proposal_team', 'proposal_time_tracking', 'network_connections')
ORDER BY tablename, policyname;

-- Should see policies like:
-- "Users can view own profile"
-- "Users can manage own proposals"
-- "Team members can view invitations"
-- etc.

-- ============================================================================
-- 9. CHECK CRITICAL CONSTRAINTS
-- ============================================================================
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('company_profiles', 'documents', 'rfp_uploads', 'proposals',
                        'proposal_team', 'proposal_time_tracking', 'network_connections')
  AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY', 'FOREIGN KEY')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- Important constraints to verify:
-- company_profiles.user_id UNIQUE
-- proposal_team(proposal_id, member_email) UNIQUE (prevents duplicate invitations)

-- ============================================================================
-- 10. CHECK FOREIGN KEY RELATIONSHIPS
-- ============================================================================
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('company_profiles', 'documents', 'rfp_uploads', 'proposals',
                        'proposal_team', 'proposal_time_tracking', 'network_connections')
ORDER BY tc.table_name, kcu.column_name;

-- Expected foreign keys:
-- documents -> auth.users (if user_id) OR -> company_profiles (if profile_id)
-- rfp_uploads -> auth.users
-- proposals -> auth.users
-- proposal_team -> proposals
-- etc.

-- ============================================================================
-- 11. QUICK DATA CHECK (How many records exist)
-- ============================================================================
SELECT 'company_profiles' as table_name, COUNT(*) as row_count FROM company_profiles
UNION ALL
SELECT 'documents', COUNT(*) FROM documents
UNION ALL
SELECT 'rfp_uploads', COUNT(*) FROM rfp_uploads
UNION ALL
SELECT 'proposals', COUNT(*) FROM proposals
UNION ALL
SELECT 'proposal_team', COUNT(*) FROM proposal_team
UNION ALL
SELECT 'proposal_time_tracking', COUNT(*) FROM proposal_time_tracking
UNION ALL
SELECT 'network_connections', COUNT(*) FROM network_connections
ORDER BY table_name;

-- This shows if you have any actual data that needs to be preserved

-- ============================================================================
-- 12. CHECK IF ANY PROPOSALS HAVE TEAM INVITATIONS
-- ============================================================================
SELECT
  p.id,
  p.title,
  p.status,
  COUNT(pt.id) as team_member_count,
  ARRAY_AGG(pt.status) as invitation_statuses
FROM proposals p
LEFT JOIN proposal_team pt ON p.id = pt.proposal_id
GROUP BY p.id, p.title, p.status
HAVING COUNT(pt.id) > 0
ORDER BY p.created_at DESC
LIMIT 10;

-- Shows which proposals have team members and their status

-- ============================================================================
-- 13. TEST INVITATION TOKEN UNIQUENESS
-- ============================================================================
SELECT
  invitation_token,
  COUNT(*) as duplicate_count
FROM proposal_team
WHERE invitation_token IS NOT NULL
GROUP BY invitation_token
HAVING COUNT(*) > 1;

-- Should return 0 rows (no duplicate tokens!)

-- ============================================================================
-- SUMMARY REPORT
-- ============================================================================

-- Run this to get a quick health check:
WITH table_status AS (
  SELECT
    'company_profiles' as table_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'company_profiles') as exists,
    (SELECT rowsecurity FROM pg_tables WHERE tablename = 'company_profiles') as rls_enabled,
    (SELECT COUNT(*) FROM company_profiles) as record_count
  UNION ALL
  SELECT
    'documents',
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'documents'),
    (SELECT rowsecurity FROM pg_tables WHERE tablename = 'documents'),
    (SELECT COUNT(*) FROM documents)
  UNION ALL
  SELECT
    'rfp_uploads',
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'rfp_uploads'),
    (SELECT rowsecurity FROM pg_tables WHERE tablename = 'rfp_uploads'),
    (SELECT COUNT(*) FROM rfp_uploads)
  UNION ALL
  SELECT
    'proposals',
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'proposals'),
    (SELECT rowsecurity FROM pg_tables WHERE tablename = 'proposals'),
    (SELECT COUNT(*) FROM proposals)
  UNION ALL
  SELECT
    'proposal_team',
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'proposal_team'),
    (SELECT rowsecurity FROM pg_tables WHERE tablename = 'proposal_team'),
    (SELECT COUNT(*) FROM proposal_team)
  UNION ALL
  SELECT
    'proposal_time_tracking',
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'proposal_time_tracking'),
    (SELECT rowsecurity FROM pg_tables WHERE tablename = 'proposal_time_tracking'),
    (SELECT COUNT(*) FROM proposal_time_tracking)
  UNION ALL
  SELECT
    'network_connections',
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'network_connections'),
    (SELECT rowsecurity FROM pg_tables WHERE tablename = 'network_connections'),
    (SELECT COUNT(*) FROM network_connections)
)
SELECT
  table_name,
  CASE WHEN exists THEN '✅' ELSE '❌' END as table_exists,
  CASE WHEN rls_enabled THEN '✅' ELSE '⚠️' END as rls_status,
  record_count
FROM table_status
ORDER BY table_name;

-- ============================================================================
-- END OF VERIFICATION QUERIES
-- ============================================================================

-- Summary of what to look for:
-- ✅ All 7 tables exist
-- ✅ RLS enabled on all tables
-- ✅ invitation_token exists in proposal_team (YOU CONFIRMED THIS!)
-- ❓ documents table: user_id vs profile_id (NEED TO VERIFY)
-- ❓ company_profiles: has capabilities column? (NEED TO VERIFY)
-- ❓ Unique constraint on proposal_team(proposal_id, member_email) (NEED TO VERIFY)
