# Database Migrations

This directory contains SQL migration scripts for the RFP Response Generator database.

## Database Provider

**Supabase PostgreSQL** - All migrations are designed for Supabase's PostgreSQL database with Row Level Security (RLS) enabled.

## Running Migrations

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `001_initial_schema.sql`
4. Paste and run in the SQL editor
5. Verify all tables and policies were created successfully

### Option 2: Supabase CLI
```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migration
supabase db push
```

### Option 3: Direct SQL Connection
```bash
# Using psql (requires connection string from Supabase)
psql "postgresql://postgres:[PASSWORD]@[PROJECT_ID].supabase.co:5432/postgres" \
  -f src/database/migrations/001_initial_schema.sql
```

## Migration Files

### 001_initial_schema.sql
**Created:** December 1, 2025  
**Purpose:** Initial database schema setup

**Creates:**
- 7 core tables (company_profiles, documents, rfps, proposals, proposal_team, proposal_time_tracking, network_connections)
- Performance indexes
- Row Level Security (RLS) policies
- Triggers for automatic updated_at timestamps

**Tables:**
1. `company_profiles` - Company information for marketplace
2. `documents` - User-uploaded documents
3. `rfps` - RFP documents and parsed content
4. `proposals` - Generated proposals
5. `proposal_team` - Team member invitations
6. `proposal_time_tracking` - Analytics time tracking
7. `network_connections` - Professional network

## Verification

After running migrations, verify with:

```sql
-- List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Verify indexes
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

## Security Notes

- **Row Level Security (RLS)** is enabled on all tables
- Users can only access their own data
- Public profiles are visible to all (when `is_public = true`)
- Team members can view proposals they're invited to
- All policies enforce proper authorization

## Rollback

To rollback the initial migration:

```sql
-- Drop all tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS network_connections CASCADE;
DROP TABLE IF EXISTS proposal_time_tracking CASCADE;
DROP TABLE IF EXISTS proposal_team CASCADE;
DROP TABLE IF EXISTS proposals CASCADE;
DROP TABLE IF EXISTS rfps CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF NOT EXISTS company_profiles CASCADE;

-- Drop the trigger function
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

⚠️ **WARNING:** This will delete all data!

## Schema Diagram

```
┌──────────────────┐
│  auth.users      │ (Supabase managed)
└─────────┬────────┘
          │
    ┌─────┴──────┬──────────┬──────────┬────────────┐
    │            │          │          │            │
┌───▼────┐  ┌───▼────┐  ┌──▼──┐  ┌───▼────┐  ┌────▼────────┐
│company │  │documents│  │rfps │  │proposals│  │network_conn │
│profiles│  └─────────┘  └──┬──┘  └────┬────┘  └─────────────┘
└────────┘                  │          │
                            │     ┌────┴──────┬──────────────┐
                            └────►│proposal   │ proposal_time│
                                  │team       │ _tracking    │
                                  └───────────┴──────────────┘
```

## Support

For issues or questions about migrations:
1. Check Supabase documentation: https://supabase.com/docs/guides/database
2. Review RLS policies: https://supabase.com/docs/guides/auth/row-level-security
3. Contact the development team
