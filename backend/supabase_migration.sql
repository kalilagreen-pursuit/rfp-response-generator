-- ============================================================================
-- RFP Proposal Generator - Database Schema
-- Created: 2025-11-16
-- Supabase PostgreSQL Migration
-- ============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. COMPANY PROFILES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.company_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  industry TEXT,
  contact_info JSONB DEFAULT '{}',
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('public', 'private')),
  profile_strength INTEGER DEFAULT 0 CHECK (profile_strength >= 0 AND profile_strength <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Index for faster lookups
CREATE INDEX idx_company_profiles_user_id ON public.company_profiles(user_id);
CREATE INDEX idx_company_profiles_visibility ON public.company_profiles(visibility);

-- ============================================================================
-- 2. DOCUMENTS (Capabilities, Resumes, Certifications)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('capability', 'resume', 'certification', 'other')),
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_documents_profile_id ON public.documents(profile_id);
CREATE INDEX idx_documents_type ON public.documents(type);

-- ============================================================================
-- 3. RFP UPLOADS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rfp_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  extracted_data JSONB DEFAULT '{}',
  confidence_score INTEGER DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_rfp_uploads_user_id ON public.rfp_uploads(user_id);

-- ============================================================================
-- 4. PROPOSALS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rfp_id UUID REFERENCES public.rfp_uploads(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'team_building', 'ready', 'submitted', 'withdrawn')),
  content JSONB DEFAULT '{}',
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  template TEXT CHECK (template IN ('standard', 'creative', 'technical')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  exported_at TIMESTAMPTZ
);

-- Index for faster lookups
CREATE INDEX idx_proposals_user_id ON public.proposals(user_id);
CREATE INDEX idx_proposals_rfp_id ON public.proposals(rfp_id);
CREATE INDEX idx_proposals_status ON public.proposals(status);

-- ============================================================================
-- 5. PROPOSAL TEAM (Team members on proposals)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.proposal_team (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  member_profile_id UUID REFERENCES public.company_profiles(id) ON DELETE SET NULL,
  member_email TEXT,
  role TEXT NOT NULL,
  rate_range JSONB,
  status TEXT DEFAULT 'invited' CHECK (status IN ('invited', 'accepted', 'declined')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- Index for faster lookups
CREATE INDEX idx_proposal_team_proposal_id ON public.proposal_team(proposal_id);
CREATE INDEX idx_proposal_team_member_profile_id ON public.proposal_team(member_profile_id);
CREATE INDEX idx_proposal_team_status ON public.proposal_team(status);

-- ============================================================================
-- 6. NETWORK CONNECTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.network_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connected_profile_id UUID REFERENCES public.company_profiles(id) ON DELETE SET NULL,
  contact_name TEXT,
  contact_email TEXT,
  capabilities TEXT[],
  notes TEXT,
  connection_method TEXT DEFAULT 'manual' CHECK (connection_method IN ('manual', 'qr', 'marketplace')),
  connected_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_network_connections_user_id ON public.network_connections(user_id);
CREATE INDEX idx_network_connections_connected_profile_id ON public.network_connections(connected_profile_id);

-- ============================================================================
-- 6.1. CONNECTION REQUESTS
-- ============================================================================
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
CREATE INDEX idx_connection_requests_requester_id ON public.connection_requests(requester_id);
CREATE INDEX idx_connection_requests_recipient_user_id ON public.connection_requests(recipient_user_id);
CREATE INDEX idx_connection_requests_status ON public.connection_requests(status);
CREATE INDEX idx_connection_requests_recipient_profile_id ON public.connection_requests(recipient_profile_id);
CREATE INDEX idx_connection_requests_requester_profile_id ON public.connection_requests(requester_profile_id);

-- ============================================================================
-- 7. PROPOSAL TIME TRACKING (Analytics)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.proposal_time_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('upload', 'parsing', 'generation', 'editing', 'export')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Index for faster lookups
CREATE INDEX idx_proposal_time_tracking_proposal_id ON public.proposal_time_tracking(proposal_id);
CREATE INDEX idx_proposal_time_tracking_stage ON public.proposal_time_tracking(stage);

-- ============================================================================
-- TRIGGERS FOR updated_at COLUMNS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for company_profiles
CREATE TRIGGER update_company_profiles_updated_at
  BEFORE UPDATE ON public.company_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for proposals
CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfp_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_time_tracking ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- COMPANY PROFILES POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.company_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view public profiles (for marketplace)
CREATE POLICY "Users can view public profiles"
  ON public.company_profiles
  FOR SELECT
  USING (visibility = 'public');

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.company_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.company_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile"
  ON public.company_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- DOCUMENTS POLICIES
-- ============================================================================

-- Users can view documents for their own profile
CREATE POLICY "Users can view own documents"
  ON public.documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.company_profiles
      WHERE company_profiles.id = documents.profile_id
      AND company_profiles.user_id = auth.uid()
    )
  );

-- Users can insert documents for their own profile
CREATE POLICY "Users can insert own documents"
  ON public.documents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_profiles
      WHERE company_profiles.id = profile_id
      AND company_profiles.user_id = auth.uid()
    )
  );

-- Users can delete their own documents
CREATE POLICY "Users can delete own documents"
  ON public.documents
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.company_profiles
      WHERE company_profiles.id = documents.profile_id
      AND company_profiles.user_id = auth.uid()
    )
  );

-- ============================================================================
-- RFP UPLOADS POLICIES
-- ============================================================================

CREATE POLICY "Users can manage own RFPs"
  ON public.rfp_uploads
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- PROPOSALS POLICIES
-- ============================================================================

CREATE POLICY "Users can manage own proposals"
  ON public.proposals
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- PROPOSAL TEAM POLICIES
-- ============================================================================

-- Proposal owners can manage team
CREATE POLICY "Proposal owners can manage team"
  ON public.proposal_team
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.proposals
      WHERE proposals.id = proposal_team.proposal_id
      AND proposals.user_id = auth.uid()
    )
  );

-- Team members can view their invitations
CREATE POLICY "Team members can view invitations"
  ON public.proposal_team
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.company_profiles
      WHERE company_profiles.id = proposal_team.member_profile_id
      AND company_profiles.user_id = auth.uid()
    )
  );

-- Team members can update their invitation status
CREATE POLICY "Team members can respond to invitations"
  ON public.proposal_team
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.company_profiles
      WHERE company_profiles.id = proposal_team.member_profile_id
      AND company_profiles.user_id = auth.uid()
    )
  );

-- ============================================================================
-- NETWORK CONNECTIONS POLICIES
-- ============================================================================

CREATE POLICY "Users can manage own connections"
  ON public.network_connections
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- CONNECTION REQUESTS POLICIES
-- ============================================================================

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
-- PROPOSAL TIME TRACKING POLICIES
-- ============================================================================

-- Users can view tracking for their own proposals
CREATE POLICY "Users can view own proposal tracking"
  ON public.proposal_time_tracking
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.proposals
      WHERE proposals.id = proposal_time_tracking.proposal_id
      AND proposals.user_id = auth.uid()
    )
  );

-- Users can insert tracking for their own proposals
CREATE POLICY "Users can insert own proposal tracking"
  ON public.proposal_time_tracking
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.proposals
      WHERE proposals.id = proposal_id
      AND proposals.user_id = auth.uid()
    )
  );

-- ============================================================================
-- STORAGE BUCKET SETUP (Run in Supabase Storage, not SQL Editor)
-- ============================================================================

-- Note: Create these buckets in Supabase Dashboard > Storage
-- 1. Create bucket: 'rfp-documents'
-- 2. Create bucket: 'capability-statements'
-- 3. Create bucket: 'proposal-exports'

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate profile strength
CREATE OR REPLACE FUNCTION calculate_profile_strength(profile_id UUID)
RETURNS INTEGER AS $$
DECLARE
  strength INTEGER := 0;
  doc_count INTEGER;
BEGIN
  -- Get profile info
  SELECT
    CASE WHEN company_name IS NOT NULL AND company_name != '' THEN 20 ELSE 0 END +
    CASE WHEN industry IS NOT NULL AND industry != '' THEN 10 ELSE 0 END +
    CASE WHEN contact_info::TEXT != '{}' THEN 20 ELSE 0 END
  INTO strength
  FROM public.company_profiles
  WHERE id = profile_id;

  -- Add points for documents
  SELECT COUNT(*) INTO doc_count
  FROM public.documents
  WHERE documents.profile_id = calculate_profile_strength.profile_id;

  strength := strength + LEAST(doc_count * 10, 50);

  RETURN LEAST(strength, 100);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA / SEED (Optional)
-- ============================================================================

-- No seed data needed - users will create their own profiles

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify tables were created
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'company_profiles',
  'documents',
  'rfp_uploads',
  'proposals',
  'proposal_team',
  'network_connections',
  'proposal_time_tracking'
)
ORDER BY table_name;
