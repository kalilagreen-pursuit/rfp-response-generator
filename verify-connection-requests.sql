-- ============================================================================
-- VERIFICATION QUERIES FOR CONNECTION REQUESTS
-- ============================================================================
-- Run these queries in Supabase SQL Editor to verify the migration was successful

-- 1. Check if table exists
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'connection_requests';

-- 2. Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'connection_requests'
ORDER BY ordinal_position;

-- 3. Check if indexes exist
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'connection_requests';

-- 4. Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'connection_requests';

-- 5. Check if policies exist
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'connection_requests'
ORDER BY policyname;

-- 6. Count existing connection requests (if any)
SELECT COUNT(*) as total_requests FROM public.connection_requests;

-- Expected Results:
-- 1. Should return 1 row with table_name = 'connection_requests'
-- 2. Should show all columns: id, requester_id, requester_profile_id, recipient_profile_id, recipient_user_id, message, status, requested_at, responded_at, created_at
-- 3. Should show 5 indexes
-- 4. Should show rowsecurity = true
-- 5. Should show 4 policies:
--    - "Requester can view own sent requests"
--    - "Recipient can view own received requests"
--    - "Requester can create requests"
--    - "Recipient can respond to requests"
-- 6. Should return 0 or more (depending on if you've sent any requests)

