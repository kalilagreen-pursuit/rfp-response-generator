# QR Code 404 Error - Fix & Deployment Guide

## ✅ Changes Made

### 1. Fixed Vercel Routing (`vercel.json`)
- **Problem**: Using deprecated `routes` configuration was causing 404 errors
- **Solution**: Switched to `rewrites` (modern Vercel approach for SPAs)
- **Result**: All `/lead-capture/*` routes now properly serve `index.html` for client-side routing

### 2. Improved Route Matching (`index.tsx`)
- Added null check for regex match result
- Ensures robust handling of lead capture URLs

## 🔍 API Endpoint Verification

### Backend Route Configuration ✅
The backend API is correctly configured:
- **Route**: `GET /api/lead-capture/:uniqueCode`
- **Controller**: `backend/src/controllers/lead-capture.controller.ts`
- **Status**: Public endpoint (no authentication required)
- **Registered**: `backend/src/routes/qr.routes.ts` → `backend/src/index.ts`

### API Endpoint Flow
```
Frontend Request: GET /api/lead-capture/h2MKbXct
  ↓
Backend Route: /api/lead-capture/:uniqueCode
  ↓
Controller: getLeadCaptureInfo()
  ↓
Response: { companyName: "...", companyLogo: null }
```

## 🚀 Deployment Steps

### Step 1: Commit and Push Changes
```bash
git add vercel.json index.tsx
git commit -m "Fix QR code 404 error - update Vercel routing configuration"
git push origin main
```

### Step 2: Verify Vercel Deployment
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Check your project: `rfp-response-generator`
3. Wait for automatic deployment (or trigger manually)
4. Verify deployment succeeds

### Step 3: Verify Environment Variables
Ensure these are set in **Vercel** → **Settings** → **Environment Variables**:

#### Required Variables:
```bash
VITE_API_URL=https://rfp-response-generator-h3w2.onrender.com/api
```

**Important**: 
- Must include `/api` suffix
- No trailing slash
- Use your actual Render backend URL

#### Optional (for client-side features):
```bash
VITE_GEMINI_API_KEY=your_gemini_key_here
GEMINI_API_KEY=your_gemini_key_here
```

### Step 4: Verify Backend Configuration
Ensure these are set in **Render** → **Environment**:

```bash
FRONTEND_URL=https://rfp-response-generator.vercel.app
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.0-flash-exp
```

### Step 5: Test the Fix

#### Test 1: Direct URL Access
1. Open: `https://rfp-response-generator.vercel.app/lead-capture/h2MKbXct`
2. **Expected**: Lead capture form loads (not 404)
3. **If 404**: Wait 1-2 minutes for Vercel to finish deployment

#### Test 2: API Endpoint
```bash
curl https://rfp-response-generator-h3w2.onrender.com/api/lead-capture/h2MKbXct
```

**Expected Response**:
```json
{
  "companyName": "Your Company Name",
  "companyLogo": null
}
```

**If 404 from API**:
- Check that the QR code exists in database
- Verify `unique_code` matches exactly
- Check backend logs in Render dashboard

#### Test 3: Full Flow
1. Generate a new QR code in the app
2. Scan or visit the generated URL
3. Form should load and submit successfully

## 🔧 Troubleshooting

### Issue: Still Getting 404 After Deployment

**Solution 1: Clear Vercel Cache**
1. Vercel Dashboard → Deployments
2. Click "..." on latest deployment
3. Select "Redeploy"
4. **UnCHECK** "Use existing Build Cache"
5. Click "Redeploy"

**Solution 2: Verify vercel.json is Deployed**
1. Check deployment logs in Vercel
2. Verify `vercel.json` is included in build
3. Check build output shows routing configuration

**Solution 3: Check Browser Cache**
- Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- Or use incognito/private window

### Issue: API Returns 404

**Check 1: QR Code Exists**
```sql
SELECT * FROM qr_codes WHERE unique_code = 'h2MKbXct';
```

**Check 2: Backend Logs**
- Render Dashboard → Your Service → Logs
- Look for route registration: `QR Code and Lead Capture routes`
- Check for errors when accessing `/api/lead-capture/:code`

**Check 3: CORS Issues**
- Check browser console for CORS errors
- Verify `FRONTEND_URL` in Render matches Vercel URL exactly
- Check backend logs show CORS origin allowed

### Issue: Form Loads But API Call Fails

**Check 1: API URL Configuration**
- Open browser console (F12)
- Check: `console.log('VITE_API_URL:', import.meta.env.VITE_API_URL)`
- Should show: `https://rfp-response-generator-h3w2.onrender.com/api`

**Check 2: Network Tab**
- Open DevTools → Network tab
- Try submitting form
- Check request URL and response
- Look for CORS errors or 404 responses

## 📋 Pre-Deployment Checklist

- [ ] `vercel.json` updated with `rewrites` configuration
- [ ] `index.tsx` has proper route matching
- [ ] Changes committed and pushed to `main` branch
- [ ] `VITE_API_URL` set correctly in Vercel
- [ ] `FRONTEND_URL` set correctly in Render
- [ ] Backend is running and healthy
- [ ] QR code exists in database with correct `unique_code`

## 🎯 Expected Behavior After Fix

1. **QR Code URL**: `https://rfp-response-generator.vercel.app/lead-capture/h2MKbXct`
   - ✅ Loads lead capture form
   - ✅ Shows company name from API
   - ✅ Form submission works

2. **API Endpoint**: `https://rfp-response-generator-h3w2.onrender.com/api/lead-capture/h2MKbXct`
   - ✅ Returns company info (200 OK)
   - ✅ Updates scan count
   - ✅ No authentication required

3. **Form Submission**: `POST /api/lead-capture/h2MKbXct`
   - ✅ Saves lead to database
   - ✅ Sends notification email to company
   - ✅ Sends welcome email to lead
   - ✅ Returns success message

## 📝 Notes

- The fix uses Vercel's `rewrites` which is the recommended approach for SPAs
- All `/lead-capture/*` routes now serve `index.html` for client-side routing
- The React app (`index.tsx`) handles the route matching and renders `LeadCaptureForm`
- The API endpoint is public (no auth required) for lead capture functionality


