-- ============================================================================
-- TEST QUERIES FOR CONNECTION REQUESTS
-- ============================================================================
-- Run these in Supabase SQL Editor to diagnose issues

-- 1. Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'connection_requests'
) as table_exists;

-- 2. Try a simple query (bypasses RLS - run as service role)
SELECT COUNT(*) as total_requests FROM public.connection_requests;

-- 3. Check RLS policies
SELECT 
  policyname,
  cmd as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'connection_requests';

-- 4. Test query with a sample user_id (replace with actual user_id)
-- This will show if RLS is working correctly
-- SELECT * FROM public.connection_requests 
-- WHERE recipient_user_id = 'YOUR_USER_ID_HERE' 
--    OR requester_id = 'YOUR_USER_ID_HERE';

-- 5. Check if foreign key relationships work
SELECT 
  cr.id,
  cr.requester_id,
  cr.recipient_user_id,
  cr.status,
  rp.company_name as requester_company,
  rcp.company_name as recipient_company
FROM public.connection_requests cr
LEFT JOIN public.company_profiles rp ON rp.id = cr.requester_profile_id
LEFT JOIN public.company_profiles rcp ON rcp.id = cr.recipient_profile_id
LIMIT 5;



