# Vercel QR Code 404 Fix - Production Deployment

## Issue
QR code URLs work locally but return 404 in production on Vercel.

## Root Cause
Vercel needs explicit rewrites configuration to serve `index.html` for client-side routes. The pattern syntax may need adjustment.

## Solution Applied

### Updated `vercel.json`
Changed from `:path*` to `(.*)` regex pattern for better Vercel compatibility:

```json
{
  "rewrites": [
    {
      "source": "/lead-capture/(.*)",
      "destination": "/index.html"
    },
    {
      "source": "/invitations/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Deployment Steps

### 1. Commit and Push Changes
```bash
git add vercel.json
git commit -m "Fix Vercel rewrites pattern for QR code routes"
git push origin main
```

### 2. Force Vercel Redeploy (IMPORTANT)

**Option A: Via Vercel Dashboard (Recommended)**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `rfp-response-generator`
3. Go to **Deployments** tab
4. Find the latest deployment
5. Click **"..."** (three dots) → **"Redeploy"**
6. **UNCHECK** ✅ "Use existing Build Cache"
7. Click **"Redeploy"**
8. Wait 2-3 minutes for deployment

**Option B: Via Git (Alternative)**
```bash
# Make a small change to trigger redeploy
git commit --allow-empty -m "Trigger Vercel redeploy for routing fix"
git push origin main
```

### 3. Clear Vercel Cache (If Still Not Working)

If the issue persists after redeploy:

1. **Vercel Dashboard** → **Settings** → **Build & Development Settings**
2. Clear build cache (if available)
3. Or create a new deployment from scratch

### 4. Verify Deployment

After redeployment, test:
- Visit: `https://rfp-response-generator.vercel.app/lead-capture/h2MKbXct`
- Should load the lead capture form (not 404)

## Troubleshooting

### Still Getting 404?

**Check 1: Verify vercel.json is in Build**
1. Vercel Dashboard → Latest Deployment → **Build Logs**
2. Check if `vercel.json` is being processed
3. Look for "Rewrites" or "Routing" in logs

**Check 2: Test Pattern Matching**
The pattern `/lead-capture/(.*)` should match:
- ✅ `/lead-capture/h2MKbXct`
- ✅ `/lead-capture/abc123`
- ❌ `/lead-capture/` (no code)

**Check 3: Browser Cache**
- Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- Or use incognito/private window

**Check 4: Check Vercel Function Logs**
1. Vercel Dashboard → **Functions** tab
2. Look for any errors related to routing
3. Check if requests are reaching the rewrite rule

### Alternative: Use Catch-All Rewrite

If specific patterns don't work, try a catch-all (less specific but more reliable):

```json
{
  "rewrites": [
    {
      "source": "/((?!api|_next|assets|favicon.ico|.*\\..*).*)",
      "destination": "/index.html"
    }
  ]
}
```

This catches all routes except:
- `/api/*` (API routes)
- `/_next/*` (Next.js internals)
- `/assets/*` (static assets)
- Files with extensions (`.js`, `.css`, etc.)

## Expected Behavior

After fix:
1. **QR Code URL**: `https://rfp-response-generator.vercel.app/lead-capture/h2MKbXct`
   - ✅ Returns `index.html` (200 OK)
   - ✅ React app loads
   - ✅ Route matching works in `index.tsx`
   - ✅ `LeadCaptureForm` component renders

2. **API Endpoint**: `https://rfp-response-generator-h3w2.onrender.com/api/lead-capture/h2MKbXct`
   - ✅ Returns company info (200 OK)
   - ✅ No authentication required

## Verification Checklist

- [ ] `vercel.json` updated with correct pattern
- [ ] Changes committed and pushed
- [ ] Vercel redeployed (without cache)
- [ ] QR code URL tested in production
- [ ] Form loads successfully
- [ ] API endpoint responds correctly

## Notes

- The pattern `(.*)` is standard regex that Vercel supports
- `:path*` is Vercel-specific syntax that might not work in all cases
- Always redeploy without cache when changing routing configuration
- Test in incognito mode to avoid browser cache issues

