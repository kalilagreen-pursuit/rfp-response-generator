-- ============================================================================
-- CONNECTION REQUESTS TABLE
-- ============================================================================
-- This table stores bidirectional connection requests between users
-- When a user sends a connection request from the marketplace, it creates
-- a pending request that the recipient can accept or decline.

CREATE TABLE IF NOT EXISTS public.connection_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_profile_id UUID REFERENCES public.company_profiles(id) ON DELETE SET NULL,
  recipient_profile_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  recipient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_connection_requests_requester_id ON public.connection_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_recipient_user_id ON public.connection_requests(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_status ON public.connection_requests(status);
CREATE INDEX IF NOT EXISTS idx_connection_requests_recipient_profile_id ON public.connection_requests(recipient_profile_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_requester_profile_id ON public.connection_requests(requester_profile_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotent migration)
DROP POLICY IF EXISTS "Requester can view own sent requests" ON public.connection_requests;
DROP POLICY IF EXISTS "Recipient can view own received requests" ON public.connection_requests;
DROP POLICY IF EXISTS "Requester can create requests" ON public.connection_requests;
DROP POLICY IF EXISTS "Recipient can respond to requests" ON public.connection_requests;

-- Requester can view their own sent requests
CREATE POLICY "Requester can view own sent requests"
  ON public.connection_requests
  FOR SELECT
  USING (auth.uid() = requester_id);

-- Recipient can view requests sent to them
CREATE POLICY "Recipient can view own received requests"
  ON public.connection_requests
  FOR SELECT
  USING (auth.uid() = recipient_user_id);

-- Requester can create requests
CREATE POLICY "Requester can create requests"
  ON public.connection_requests
  FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Recipient can update (accept/decline) requests sent to them
CREATE POLICY "Recipient can respond to requests"
  ON public.connection_requests
  FOR UPDATE
  USING (auth.uid() = recipient_user_id)
  WITH CHECK (auth.uid() = recipient_user_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.connection_requests IS 'Bidirectional connection requests between users from marketplace';
COMMENT ON COLUMN public.connection_requests.requester_id IS 'User who sent the connection request';
COMMENT ON COLUMN public.connection_requests.requester_profile_id IS 'Company profile of the requester';
COMMENT ON COLUMN public.connection_requests.recipient_profile_id IS 'Company profile that received the request';
COMMENT ON COLUMN public.connection_requests.recipient_user_id IS 'User who received the connection request';
COMMENT ON COLUMN public.connection_requests.status IS 'Request status: pending, accepted, or declined';

