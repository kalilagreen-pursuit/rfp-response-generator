# Supabase Database Migration Checklist

**Date:** December 3, 2025
**Purpose:** Ensure Supabase database schema matches current application requirements

---

## 🔍 Critical Schema Differences Found

After comparing the old migration files with the new comprehensive migration, here are the key differences that **MUST** be addressed:

### 1. **Table Name Changes** ⚠️ BREAKING

| Old Name | New Name | Impact |
|----------|----------|--------|
| `rfp_uploads` | `rfps` | Backend code uses `rfps` |
| `documents.profile_id` | `documents.user_id` | Backend references `user_id` directly |

**Current Backend Code Uses:**
- `rfps` table (not `rfp_uploads`)
- `documents.user_id` (not `documents.profile_id`)

**Action Required:** Either:
- Option A: Update backend code to match old schema names
- Option B: **RECOMMENDED** - Run new migration to align database with backend

---

### 2. **Missing Columns in Current Supabase** ⚠️ CRITICAL

#### `proposal_team` table
- **Missing:** `invitation_token` (UUID) - **REQUIRED FOR EMAIL INVITATIONS**
- **Missing:** `message` (TEXT) - Nice to have
- **Missing:** `UNIQUE(proposal_id, member_email)` constraint

**Status:** `invitation_token` was added via `supabase_add_invitation_token.sql` but needs verification.

**Verification Query:**
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'proposal_team'
AND column_name IN ('invitation_token', 'message')
ORDER BY column_name;
```

#### `documents` table structure mismatch
**Old Schema:**
```sql
profile_id UUID REFERENCES company_profiles(id)
type TEXT CHECK (type IN ('capability', 'resume', 'certification', 'other'))
file_name TEXT
storage_path TEXT
```

**New Schema (Backend Expects):**
```sql
user_id UUID REFERENCES auth.users(id)
document_type TEXT (no CHECK constraint)
filename TEXT
file_path TEXT
```

**Impact:** Backend document upload may fail with old schema!

#### `rfps` vs `rfp_uploads`
**Old:** `rfp_uploads` with `extracted_data` and `confidence_score`
**New:** `rfps` with `parsed_content`, `status`, and `metadata`

**Backend expects:**
- Table name: `rfps`
- Columns: `title`, `file_path`, `parsed_content`, `status`, `metadata`

---

### 3. **company_profiles Columns** ✅ MOSTLY OK

**Additional columns in new schema:**
- `website` TEXT
- `capabilities` TEXT[] - **Important for matching**
- `is_public` BOOLEAN (vs old `visibility` TEXT)

**Old Schema:**
```sql
visibility TEXT DEFAULT 'private' CHECK (visibility IN ('public', 'private'))
```

**New Schema:**
```sql
is_public BOOLEAN DEFAULT FALSE
capabilities TEXT[] DEFAULT ARRAY[]::TEXT[]
website TEXT
```

---

### 4. **Index Differences**

#### Missing indexes in new migration:
- `idx_company_profiles_industry` (conditional index)
- `idx_company_profiles_is_public` (conditional index WHERE is_public = TRUE)

#### Old migration has that new one doesn't:
- `idx_documents_type`
- `idx_network_connections_connected_profile_id`

---

### 5. **RLS Policy Differences** 🔒

**Old migration:** More granular policies with separate SELECT/INSERT/UPDATE/DELETE
**New migration:** Combined policies using `FOR ALL`

**Example (proposal_team):**

**Old (Granular):**
```sql
CREATE POLICY "Proposal owners can manage team"
  ON public.proposal_team FOR ALL
  USING (...);

CREATE POLICY "Team members can view invitations"
  ON public.proposal_team FOR SELECT
  USING (...);

CREATE POLICY "Team members can respond to invitations"
  ON public.proposal_team FOR UPDATE
  USING (...);
```

**New (Simpler):**
```sql
CREATE POLICY "Proposal owners can manage team"
  ON proposal_team FOR ALL USING (...);

CREATE POLICY "Team members can view their invitations"
  ON proposal_team FOR SELECT USING (...);

CREATE POLICY "Team members can update their own invitations"
  ON proposal_team FOR UPDATE USING (...);
```

**Both approaches work**, but the new one is cleaner.

---

### 6. **Missing Helper Functions** 📊

**Old migration includes:**
```sql
CREATE OR REPLACE FUNCTION calculate_profile_strength(profile_id UUID)
RETURNS INTEGER AS $$
...
$$ LANGUAGE plpgsql;
```

**New migration:** Missing this function but backend calculates profile strength in application code.

**Impact:** None if backend handles calculation (which it does).

---

## ✅ What's Already Correct

1. **Analytics endpoints exist** ✅
   - [backend/src/controllers/analytics.controller.ts](backend/src/controllers/analytics.controller.ts)
   - All 4 endpoints implemented

2. **proposal_time_tracking table** ✅
   - Both schemas have this table
   - Structure is compatible

3. **network_connections table** ✅
   - Both schemas compatible
   - Backend working correctly

4. **Row Level Security enabled** ✅
   - All tables have RLS enabled in both schemas

---

## 🚨 Critical Issues to Fix

### Issue #1: Table Name Mismatch (`rfp_uploads` vs `rfps`)

**Current Supabase:** Has `rfp_uploads` table
**Backend Expects:** `rfps` table

**Backend references `rfps` in:**
- `backend/src/controllers/rfp.controller.ts`
- `backend/src/routes/rfp.routes.ts`

**Quick Fix Options:**

**Option A - Rename table in Supabase:**
```sql
ALTER TABLE public.rfp_uploads RENAME TO rfps;
```

**Option B - Update backend to use `rfp_uploads`** (NOT RECOMMENDED - breaks convention)

---

### Issue #2: `documents` Schema Mismatch

**Current:** `documents.profile_id` → `company_profiles.id`
**Backend Expects:** `documents.user_id` → `auth.users.id`

**This is a MAJOR structural difference!**

**Backend code:**
```typescript
// backend/src/controllers/document.controller.ts
const { data, error } = await supabase
  .from('documents')
  .select('*')
  .eq('user_id', req.userId); // Expects user_id!
```

**Migration Required:**
```sql
-- Add user_id column
ALTER TABLE documents ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Populate user_id from profile_id
UPDATE documents
SET user_id = (
  SELECT user_id FROM company_profiles
  WHERE company_profiles.id = documents.profile_id
);

-- Make user_id NOT NULL
ALTER TABLE documents ALTER COLUMN user_id SET NOT NULL;

-- Drop old profile_id (optional, for cleanup)
ALTER TABLE documents DROP COLUMN profile_id;

-- Recreate indexes
DROP INDEX IF EXISTS idx_documents_profile_id;
CREATE INDEX idx_documents_user_id ON documents(user_id);
```

---

### Issue #3: `proposal_team.invitation_token` Verification

**Status:** Should exist from `supabase_add_invitation_token.sql`

**Verify it exists:**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'proposal_team'
AND column_name = 'invitation_token';
```

**If missing, add it:**
```sql
ALTER TABLE proposal_team
ADD COLUMN IF NOT EXISTS invitation_token UUID DEFAULT gen_random_uuid();

CREATE INDEX IF NOT EXISTS idx_proposal_team_invitation_token
ON proposal_team(invitation_token);
```

---

### Issue #4: `proposal_team` Missing UNIQUE Constraint

**New schema has:**
```sql
UNIQUE(proposal_id, member_email)
```

**This prevents duplicate invitations to the same person for the same proposal.**

**Add constraint:**
```sql
ALTER TABLE proposal_team
ADD CONSTRAINT unique_proposal_member
UNIQUE (proposal_id, member_email);
```

---

## 📋 Recommended Action Plan

### Option A: Fresh Migration (RECOMMENDED for new deployments)

1. **Backup current Supabase data** (if any real data exists)
2. **Drop all tables** (use rollback script from migration README)
3. **Run new migration:** `backend/src/database/migrations/001_initial_schema.sql`
4. **Verify all tables and indexes**

**Pros:**
- Clean slate
- Matches backend code exactly
- No migration headaches

**Cons:**
- Loses existing data (only OK if in development)

---

### Option B: Incremental Migration (SAFER for production with data)

**Step 1: Rename tables**
```sql
ALTER TABLE rfp_uploads RENAME TO rfps;
```

**Step 2: Fix documents table**
```sql
-- See full migration script in Issue #2 above
ALTER TABLE documents ADD COLUMN user_id UUID REFERENCES auth.users(id);
-- ... (rest of migration)
```

**Step 3: Add missing columns**
```sql
-- proposal_team
ALTER TABLE proposal_team ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE proposal_team ADD CONSTRAINT unique_proposal_member UNIQUE (proposal_id, member_email);

-- company_profiles
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS capabilities TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
```

**Step 4: Migrate visibility to is_public**
```sql
UPDATE company_profiles
SET is_public = (visibility = 'public');

-- Optional: drop old visibility column
ALTER TABLE company_profiles DROP COLUMN visibility;
```

**Step 5: Update column names**
```sql
-- rfps table
ALTER TABLE rfps RENAME COLUMN extracted_data TO parsed_content;
ALTER TABLE rfps ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE rfps ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- documents table
ALTER TABLE documents RENAME COLUMN file_name TO filename;
ALTER TABLE documents RENAME COLUMN storage_path TO file_path;
ALTER TABLE documents RENAME COLUMN type TO document_type;
```

---

## 🔍 Verification Queries

Run these in Supabase SQL Editor to verify everything is correct:

### 1. Check all tables exist
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'company_profiles',
  'documents',
  'rfps',
  'proposals',
  'proposal_team',
  'proposal_time_tracking',
  'network_connections'
)
ORDER BY table_name;
```

### 2. Check RLS is enabled
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'company_profiles',
  'documents',
  'rfps',
  'proposals',
  'proposal_team',
  'proposal_time_tracking',
  'network_connections'
);
```

### 3. Check critical columns exist
```sql
-- invitation_token in proposal_team
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'proposal_team'
AND column_name = 'invitation_token';

-- user_id in documents
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'documents'
AND column_name = 'user_id';

-- capabilities in company_profiles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'company_profiles'
AND column_name = 'capabilities';
```

### 4. Check indexes exist
```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
  'company_profiles',
  'documents',
  'rfps',
  'proposals',
  'proposal_team',
  'proposal_time_tracking',
  'network_connections'
)
ORDER BY tablename, indexname;
```

---

## 🎯 Summary

### Critical (Must Fix):
1. ⚠️ **Table name:** `rfp_uploads` → `rfps`
2. ⚠️ **documents.profile_id** → `documents.user_id`
3. ⚠️ **Verify `proposal_team.invitation_token` exists**
4. ⚠️ **Add UNIQUE constraint to proposal_team**

### Important (Should Fix):
5. 📋 Add `capabilities` column to `company_profiles`
6. 📋 Add `website` column to `company_profiles`
7. 📋 Migrate `visibility` → `is_public`
8. 📋 Rename rfps columns to match backend

### Nice to Have:
9. ✨ Add `message` column to `proposal_team`
10. ✨ Add conditional indexes for performance

---

## 🚀 Next Steps

**Before Production Deployment:**

1. **Choose migration strategy** (A or B above)
2. **Backup Supabase database**
3. **Run migration scripts**
4. **Run verification queries**
5. **Test all API endpoints**
6. **Verify team invitations work**
7. **Test document uploads**
8. **Test RFP parsing**

**If everything passes:** ✅ Ready for production!

---

**Document Updated:** December 3, 2025
**Review Required:** Before production deployment
**Owner:** Development Team
