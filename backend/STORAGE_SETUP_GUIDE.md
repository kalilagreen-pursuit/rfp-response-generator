# Storage Buckets Setup Guide

## Quick Access Links

- **Storage Buckets**: https://supabase.com/dashboard/project/xqdpyzotshklfdgweakb/storage/buckets
- **Storage Policies**: https://supabase.com/dashboard/project/xqdpyzotshklfdgweakb/storage/policies

---

## Create 3 Storage Buckets

### Bucket 1: rfp-documents

Click **"New bucket"** and configure:

- **Bucket name**: `rfp-documents`
- **Public bucket**: ❌ **No** (private)
- **File size limit**: 50000000 (50 MB)
- **Allowed MIME types**:
  ```
  application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain
  ```

### Bucket 2: capability-statements

- **Bucket name**: `capability-statements`
- **Public bucket**: ❌ **No** (private)
- **File size limit**: 50000000 (50 MB)
- **Allowed MIME types**:
  ```
  application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document
  ```

### Bucket 3: proposal-exports

- **Bucket name**: `proposal-exports`
- **Public bucket**: ❌ **No** (private)
- **File size limit**: 50000000 (50 MB)
- **Allowed MIME types**:
  ```
  application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document
  ```

---

## Storage Policies (Security Rules)

For **EACH** of the 3 buckets, you need to create 3 policies (9 total).

### For bucket: `rfp-documents`

#### Policy 1: Allow authenticated uploads

1. Go to bucket → **Policies** tab
2. Click **"New policy"** → **"For full customization"**
3. Fill in:
   - **Policy name**: `Allow authenticated uploads`
   - **Policy definition (USING expression)**:
     ```sql
     ((bucket_id = 'rfp-documents'::text) AND (auth.role() = 'authenticated'::text))
     ```
   - **Allowed operations**: ✅ **INSERT**
4. Click **"Review"** → **"Save policy"**

#### Policy 2: Allow authenticated downloads

1. Click **"New policy"** → **"For full customization"**
2. Fill in:
   - **Policy name**: `Allow authenticated downloads`
   - **Policy definition (USING expression)**:
     ```sql
     ((bucket_id = 'rfp-documents'::text) AND (auth.role() = 'authenticated'::text))
     ```
   - **Allowed operations**: ✅ **SELECT**
3. Click **"Review"** → **"Save policy"**

#### Policy 3: Allow authenticated deletes

1. Click **"New policy"** → **"For full customization"**
2. Fill in:
   - **Policy name**: `Allow authenticated deletes`
   - **Policy definition (USING expression)**:
     ```sql
     ((bucket_id = 'rfp-documents'::text) AND (auth.role() = 'authenticated'::text))
     ```
   - **Allowed operations**: ✅ **DELETE**
3. Click **"Review"** → **"Save policy"**

---

### For bucket: `capability-statements`

Repeat the same 3 policies, but change the bucket_id:

```sql
((bucket_id = 'capability-statements'::text) AND (auth.role() = 'authenticated'::text))
```

---

### For bucket: `proposal-exports`

Repeat the same 3 policies, but change the bucket_id:

```sql
((bucket_id = 'proposal-exports'::text) AND (auth.role() = 'authenticated'::text))
```

---

## Verification Checklist

After setup, verify you have:

### Buckets Created
- ✅ `rfp-documents` bucket (private)
- ✅ `capability-statements` bucket (private)
- ✅ `proposal-exports` bucket (private)

### Policies Created (9 total)

**rfp-documents bucket:**
- ✅ Allow authenticated uploads (INSERT)
- ✅ Allow authenticated downloads (SELECT)
- ✅ Allow authenticated deletes (DELETE)

**capability-statements bucket:**
- ✅ Allow authenticated uploads (INSERT)
- ✅ Allow authenticated downloads (SELECT)
- ✅ Allow authenticated deletes (DELETE)

**proposal-exports bucket:**
- ✅ Allow authenticated uploads (INSERT)
- ✅ Allow authenticated downloads (SELECT)
- ✅ Allow authenticated deletes (DELETE)

---

## What These Policies Do

These policies ensure that:

1. **Only authenticated users** can upload, download, or delete files
2. **Anonymous users** cannot access storage
3. **Each user's files are private** (when combined with path-based access)
4. **Security is enforced at the database level** (not just in your app code)

Later, we can add more granular policies like:
- Users can only delete their own files
- Users can only access files in their own folders
- Admin users can access all files

---

## Troubleshooting

### If you can't find the "New policy" button:
- Make sure you're on the **Policies** tab of the bucket
- Try clicking "Create a policy" instead

### If the policy editor looks different:
- Look for "Custom" or "For full customization"
- You need to paste the SQL in the "USING expression" or "Policy definition" field

### If you get "permission denied" errors later:
- Make sure all 3 policies exist for each bucket
- Verify the bucket_id matches exactly (case-sensitive)
- Check that `auth.role() = 'authenticated'` is in all policies

---

## Next Steps After Storage Setup

Once storage is configured, we'll create:
1. File upload endpoints (`POST /api/documents/upload`)
2. File download endpoints (`GET /api/documents/:id`)
3. File deletion endpoints (`DELETE /api/documents/:id`)
4. RFP parsing service (extract data from uploaded RFPs)

---

**Need help?** Let me know if you encounter any errors during setup!
