-- QR Code System Migration
-- Creates tables for QR code generation and lead capture

-- Table: qr_codes
-- Stores generated QR codes with tracking information
CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  unique_code VARCHAR(50) UNIQUE NOT NULL,
  label VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  scan_count INTEGER DEFAULT 0,
  last_scanned_at TIMESTAMPTZ
);

-- Table: qr_leads
-- Stores lead information captured through QR codes
CREATE TABLE IF NOT EXISTS qr_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qr_code_id UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
  company_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  industry VARCHAR(100),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  invited_at TIMESTAMPTZ,
  converted_to_user BOOLEAN DEFAULT FALSE,
  converted_user_id UUID REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_qr_codes_user_id ON qr_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_unique_code ON qr_codes(unique_code);
CREATE INDEX IF NOT EXISTS idx_qr_codes_profile_id ON qr_codes(profile_id);
CREATE INDEX IF NOT EXISTS idx_qr_leads_qr_code_id ON qr_leads(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_qr_leads_company_owner_id ON qr_leads(company_owner_id);
CREATE INDEX IF NOT EXISTS idx_qr_leads_email ON qr_leads(email);
CREATE INDEX IF NOT EXISTS idx_qr_leads_created_at ON qr_leads(created_at DESC);

-- RLS Policies for qr_codes
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own QR codes" ON qr_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own QR codes" ON qr_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own QR codes" ON qr_codes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own QR codes" ON qr_codes
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for qr_leads
ALTER TABLE qr_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view leads from their QR codes" ON qr_leads
  FOR SELECT USING (auth.uid() = company_owner_id);

CREATE POLICY "Anyone can insert leads" ON qr_leads
  FOR INSERT WITH CHECK (true);

-- Updated_at trigger for qr_codes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_qr_codes_updated_at
  BEFORE UPDATE ON qr_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
