-- RFP Response Generator Database Schema
-- Supabase PostgreSQL Migration Script
-- Created: December 1, 2025

-- =====================================================
-- USERS & PROFILES
-- =====================================================

-- Users table (managed by Supabase Auth)
-- This is automatically created by Supabase, but we reference it

-- Company Profiles
CREATE TABLE IF NOT EXISTS company_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  contact_info JSONB DEFAULT '{}'::jsonb,
  capabilities TEXT[] DEFAULT ARRAY[]::TEXT[],
  profile_strength INTEGER DEFAULT 0 CHECK (profile_strength >= 0 AND profile_strength <= 100),
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DOCUMENTS
-- =====================================================

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  document_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- RFPs
-- =====================================================

-- RFPs table
CREATE TABLE IF NOT EXISTS rfps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_path TEXT,
  parsed_content JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'parsed', 'validated', 'failed')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PROPOSALS
-- =====================================================

-- Proposals table
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rfp_id UUID REFERENCES rfps(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'submitted', 'won', 'lost')),
  template TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TEAM COLLABORATION
-- =====================================================

-- Proposal Team Members
CREATE TABLE IF NOT EXISTS proposal_team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  member_email TEXT NOT NULL,
  role TEXT NOT NULL,
  rate_range JSONB,
  status TEXT DEFAULT 'invited' CHECK (status IN ('invited', 'accepted', 'declined')),
  invitation_token UUID DEFAULT gen_random_uuid(),
  message TEXT,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(proposal_id, member_email)
);

-- =====================================================
-- ANALYTICS
-- =====================================================

-- Proposal Time Tracking
CREATE TABLE IF NOT EXISTS proposal_time_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- NETWORK CONNECTIONS
-- =====================================================

-- Network Connections
CREATE TABLE IF NOT EXISTS network_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  capabilities TEXT[] DEFAULT ARRAY[]::TEXT[],
  notes TEXT,
  relationship_status TEXT DEFAULT 'prospect',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_company_profiles_user_id ON company_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_company_profiles_is_public ON company_profiles(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_company_profiles_industry ON company_profiles(industry) WHERE industry IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);

CREATE INDEX IF NOT EXISTS idx_rfps_user_id ON rfps(user_id);
CREATE INDEX IF NOT EXISTS idx_rfps_status ON rfps(status);

CREATE INDEX IF NOT EXISTS idx_proposals_user_id ON proposals(user_id);
CREATE INDEX IF NOT EXISTS idx_proposals_rfp_id ON proposals(rfp_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);

CREATE INDEX IF NOT EXISTS idx_proposal_team_proposal_id ON proposal_team(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_team_member_email ON proposal_team(member_email);
CREATE INDEX IF NOT EXISTS idx_proposal_team_status ON proposal_team(status);
CREATE INDEX IF NOT EXISTS idx_proposal_team_invitation_token ON proposal_team(invitation_token);

CREATE INDEX IF NOT EXISTS idx_proposal_time_tracking_proposal_id ON proposal_time_tracking(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_time_tracking_stage ON proposal_time_tracking(stage);

CREATE INDEX IF NOT EXISTS idx_network_connections_user_id ON network_connections(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfps ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_time_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_connections ENABLE ROW LEVEL SECURITY;

-- Company Profiles Policies
CREATE POLICY "Users can view their own profile" ON company_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON company_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON company_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public profiles" ON company_profiles
  FOR SELECT USING (is_public = TRUE);

-- Documents Policies
CREATE POLICY "Users can view their own documents" ON documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" ON documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" ON documents
  FOR DELETE USING (auth.uid() = user_id);

-- RFPs Policies
CREATE POLICY "Users can view their own RFPs" ON rfps
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own RFPs" ON rfps
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own RFPs" ON rfps
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own RFPs" ON rfps
  FOR DELETE USING (auth.uid() = user_id);

-- Proposals Policies
CREATE POLICY "Users can view their own proposals" ON proposals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own proposals" ON proposals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own proposals" ON proposals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own proposals" ON proposals
  FOR DELETE USING (auth.uid() = user_id);

-- Team members can view proposals they're invited to
CREATE POLICY "Team members can view invited proposals" ON proposals
  FOR SELECT USING (
    id IN (
      SELECT proposal_id FROM proposal_team
      WHERE member_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND status IN ('invited', 'accepted')
    )
  );

-- Proposal Team Policies
CREATE POLICY "Proposal owners can manage team" ON proposal_team
  FOR ALL USING (
    proposal_id IN (SELECT id FROM proposals WHERE user_id = auth.uid())
  );

CREATE POLICY "Team members can view their invitations" ON proposal_team
  FOR SELECT USING (
    member_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Team members can update their own invitations" ON proposal_team
  FOR UPDATE USING (
    member_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Analytics Policies
CREATE POLICY "Users can view analytics for their proposals" ON proposal_time_tracking
  FOR SELECT USING (
    proposal_id IN (SELECT id FROM proposals WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert analytics for their proposals" ON proposal_time_tracking
  FOR INSERT WITH CHECK (
    proposal_id IN (SELECT id FROM proposals WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update analytics for their proposals" ON proposal_time_tracking
  FOR UPDATE USING (
    proposal_id IN (SELECT id FROM proposals WHERE user_id = auth.uid())
  );

-- Network Connections Policies
CREATE POLICY "Users can manage their own connections" ON network_connections
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Updated timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_company_profiles_updated_at
  BEFORE UPDATE ON company_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rfps_updated_at
  BEFORE UPDATE ON rfps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposal_team_updated_at
  BEFORE UPDATE ON proposal_team
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_network_connections_updated_at
  BEFORE UPDATE ON network_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMPLETE
-- =====================================================

COMMENT ON TABLE company_profiles IS 'Company profile information for marketplace';
COMMENT ON TABLE documents IS 'User uploaded documents';
COMMENT ON TABLE rfps IS 'Request for Proposal documents';
COMMENT ON TABLE proposals IS 'Generated proposals';
COMMENT ON TABLE proposal_team IS 'Team member invitations for proposals';
COMMENT ON TABLE proposal_time_tracking IS 'Time tracking analytics for proposals';
COMMENT ON TABLE network_connections IS 'Professional network connections';
