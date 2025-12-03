# Database Migration Required for Team Invitations

## Issue
The team invitation feature requires the `invitation_token` column in the `proposal_team` table. This column may not exist in your database yet.

## Solution
Run the following SQL migration in your Supabase SQL Editor:

### Steps:
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run the following SQL:

```sql
-- Add invitation_token column to proposal_team table
ALTER TABLE public.proposal_team
ADD COLUMN IF NOT EXISTS invitation_token TEXT;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_proposal_team_invitation_token
ON public.proposal_team(invitation_token);
```

Or execute the migration file directly:
- File: `backend/supabase_add_invitation_token.sql`

## Verification
After running the migration, verify the column exists:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'proposal_team'
AND column_name = 'invitation_token';
```

You should see a row with `column_name = 'invitation_token'` and `data_type = 'text'`.

## After Migration
Once the migration is complete, the team invitation feature should work correctly. The backend code will now be able to:
- Store invitation tokens for secure email links
- Look up invitations by token
- Enable secure invitation acceptance workflow

