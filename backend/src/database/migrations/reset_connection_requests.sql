-- ============================================================================
-- RESET CONNECTION REQUESTS
-- ============================================================================
-- This script deletes all connection requests from the database
-- Use this to reset the data for demos or testing
--
-- WARNING: This will permanently delete all connection requests!
-- Make sure you want to do this before running.

-- Delete all connection requests
DELETE FROM public.connection_requests;

-- Verify deletion (should return 0)
SELECT COUNT(*) as remaining_requests FROM public.connection_requests;

-- Optional: Also reset related network connections created from accepted requests
-- Uncomment the following if you also want to remove connections created from accepted requests:
-- DELETE FROM public.network_connections WHERE connection_method = 'marketplace' AND notes LIKE '%Accepted connection request%';



