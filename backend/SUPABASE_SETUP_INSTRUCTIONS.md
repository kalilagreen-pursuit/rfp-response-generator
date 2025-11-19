# 🗄️ Supabase Database Setup Instructions

## Step 1: Run the SQL Migration

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard/project/xqdpyzotshklfdgweakb/sql/new

2. **Copy the SQL Migration**
   - Open the file: `backend/supabase_migration.sql`
   - Copy ALL the contents (Cmd+A, Cmd+C)

3. **Paste and Run**
   - Paste into the SQL Editor
   - Click **"Run"** button (bottom right)
   - Wait for completion (should take ~5-10 seconds)

4. **Verify Success**
   - You should see a success message
   - The query result will show 7 tables created

---

## Step 2: Create Storage Buckets

### For File Uploads (RFPs, Documents, Exports)

1. **Go to Storage**
   - Navigate to: https://supabase.com/dashboard/project/xqdpyzotshklfdgweakb/storage/buckets

2. **Create Bucket: rfp-documents**
   - Click "New bucket"
   - Name: `rfp-documents`
   - Public: ❌ No (private)
   - Allowed MIME types: `application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/plain`
   - Max file size: `50 MB`
   - Click "Create bucket"

3. **Create Bucket: capability-statements**
   - Click "New bucket"
   - Name: `capability-statements`
   - Public: ❌ No (private)
   - Allowed MIME types: `application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document`
   - Max file size: `50 MB`
   - Click "Create bucket"

4. **Create Bucket: proposal-exports**
   - Click "New bucket"
   - Name: `proposal-exports`
   - Public: ❌ No (private)
   - Allowed MIME types: `application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document`
   - Max file size: `50 MB`
   - Click "Create bucket"

---

## Step 3: Set Storage Policies (Security)

For each bucket, you need to allow authenticated users to upload/download files.

### For `rfp-documents` bucket:

1. Go to the bucket → Policies tab
2. Click "New policy" → "Custom"
3. **Allow uploads:**
   - Policy name: `Allow authenticated uploads`
   - Policy definition:
   ```sql
   ((bucket_id = 'rfp-documents'::text) AND (auth.role() = 'authenticated'::text))
   ```
   - Allowed operations: ✅ INSERT
   - Click "Save"

4. **Allow downloads:**
   - Policy name: `Allow authenticated downloads`
   - Policy definition:
   ```sql
   ((bucket_id = 'rfp-documents'::text) AND (auth.role() = 'authenticated'::text))
   ```
   - Allowed operations: ✅ SELECT
   - Click "Save"

5. **Allow deletes:**
   - Policy name: `Allow authenticated deletes`
   - Policy definition:
   ```sql
   ((bucket_id = 'rfp-documents'::text) AND (auth.role() = 'authenticated'::text))
   ```
   - Allowed operations: ✅ DELETE
   - Click "Save"

### Repeat for `capability-statements` and `proposal-exports` buckets
(Change `'rfp-documents'` to the respective bucket name in each policy)

---

## Step 4: Enable Email Authentication

1. **Go to Authentication Settings**
   - Navigate to: https://supabase.com/dashboard/project/xqdpyzotshklfdgweakb/auth/providers

2. **Configure Email Provider**
   - Find "Email" provider
   - Enable: ✅ Enable Email provider
   - Confirm email: ✅ Confirm email (recommended for production)
   - For development, you can disable email confirmation temporarily
   - Click "Save"

---

## Step 5: Verify Everything is Set Up

### Check Tables

1. Go to: https://supabase.com/dashboard/project/xqdpyzotshklfdgweakb/editor
2. You should see these tables in the sidebar:
   - ✅ company_profiles
   - ✅ documents
   - ✅ network_connections
   - ✅ proposal_team
   - ✅ proposal_time_tracking
   - ✅ proposals
   - ✅ rfp_uploads

### Check Storage

1. Go to: https://supabase.com/dashboard/project/xqdpyzotshklfdgweakb/storage/buckets
2. You should see 3 buckets:
   - ✅ rfp-documents
   - ✅ capability-statements
   - ✅ proposal-exports

---

## What Was Created?

### 📊 **7 Database Tables:**

1. **company_profiles** - User/company information
2. **documents** - Uploaded files (resumes, certs, capabilities)
3. **rfp_uploads** - RFP documents
4. **proposals** - Generated proposals
5. **proposal_team** - Team members on proposals
6. **network_connections** - User network/contacts
7. **proposal_time_tracking** - Analytics data

### 🔒 **Row Level Security (RLS):**
- ✅ Users can only see their own data
- ✅ Public profiles visible in marketplace
- ✅ Team members can view their invitations
- ✅ Secure by default

### 🪝 **Automatic Triggers:**
- ✅ Auto-update `updated_at` timestamps
- ✅ Profile strength calculation function

### 📦 **Storage Buckets:**
- ✅ 3 buckets for file storage
- ✅ Configured for authenticated users

---

## 🧪 Test the Database

After setup, you can test if everything works by visiting:

```
http://localhost:3001/api/test/supabase
```

You should see a connection success message!

---

## 📝 Next Steps

After database setup:
1. ✅ Tables created
2. ✅ Storage configured
3. ⏭️ Build authentication endpoints (Week 1, Day 2)
4. ⏭️ Build profile creation endpoints (Week 1, Day 3-4)

---

## ❓ Troubleshooting

### If SQL migration fails:
- Check for syntax errors in the SQL editor
- Make sure you copied the ENTIRE migration file
- Try running it in sections if needed

### If storage policies fail:
- Make sure the bucket name matches exactly
- Ensure you're using the correct policy definition
- Try the pre-built policy templates first

### If you see "relation already exists":
- This means the table was already created
- Safe to ignore, or drop tables and re-run:
  ```sql
  DROP TABLE IF EXISTS public.proposal_time_tracking CASCADE;
  DROP TABLE IF EXISTS public.proposal_team CASCADE;
  DROP TABLE IF EXISTS public.network_connections CASCADE;
  DROP TABLE IF EXISTS public.proposals CASCADE;
  DROP TABLE IF EXISTS public.rfp_uploads CASCADE;
  DROP TABLE IF EXISTS public.documents CASCADE;
  DROP TABLE IF EXISTS public.company_profiles CASCADE;
  ```

---

**Questions?** Let me know and I'll help troubleshoot!
