# Reset Connection Requests

## Quick Reset Script

To reset all connection requests for a demo:

### Option 1: Run SQL in Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Copy and paste this SQL:

```sql
-- Delete all connection requests
DELETE FROM public.connection_requests;

-- Verify deletion (should return 0)
SELECT COUNT(*) as remaining_requests FROM public.connection_requests;
```

5. Click **Run**
6. Confirm the count is 0

### Option 2: Use the Migration File

The SQL script is also available at:
`backend/src/database/migrations/reset_connection_requests.sql`

## What This Does

- ✅ Deletes all connection requests (pending, accepted, declined)
- ✅ Keeps the table structure intact
- ✅ Keeps network connections (if you want to reset those too, see below)

## Optional: Reset Related Network Connections

If you also want to remove network connections that were created from accepted connection requests, add this:

```sql
DELETE FROM public.network_connections 
WHERE connection_method = 'marketplace' 
AND notes LIKE '%Accepted connection request%';
```

## After Reset

Once reset, you can:
1. Send new connection requests from marketplace
2. See them appear in the invitations page
3. Accept/decline them
4. Demo the full flow



