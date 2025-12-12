# Vercel Subroute 404 Fix

## Issue
Root route (`/`) works, but subroutes like `/lead-capture/h2MKbXct` return 404.

## Solution Applied

### Updated `vercel.json` to use Vercel-specific syntax:
```json
{
  "rewrites": [
    {
      "source": "/:path*",
      "destination": "/index.html"
    }
  ]
}
```

**Key Change:** Using `/:path*` instead of `/(.*)` - this is Vercel's native catch-all syntax.

## How It Works

1. **Static Files First**: Vercel serves static files (JS, CSS, images) directly
2. **Rewrites Applied**: For non-static routes, the rewrite rule applies
3. **All Routes → index.html**: Any route that doesn't match a static file gets rewritten to `/index.html`
4. **Client-Side Routing**: React Router (in `index.tsx`) handles the actual routing

## Testing After Deployment

1. **Root Route**: `https://rfp-response-generator.vercel.app/`
   - ✅ Should load the app

2. **Subroute**: `https://rfp-response-generator.vercel.app/lead-capture/h2MKbXct`
   - ✅ Should load `index.html` (not 404)
   - ✅ React app should initialize
   - ✅ Route matching should work in `index.tsx`

3. **Static Assets**: `https://rfp-response-generator.vercel.app/assets/index-*.js`
   - ✅ Should return JavaScript file (not rewritten)

## If Still Not Working

### Check 1: Verify Rewrites Are Applied
1. Vercel Dashboard → Latest Deployment → Build Logs
2. Search for "rewrites" or "routing"
3. Should see the rewrite configuration

### Check 2: Test with Simple Route
Try: `https://rfp-response-generator.vercel.app/test123`
- Should return HTML (not 404)
- If this works but `/lead-capture/*` doesn't, it's a route matching issue

### Check 3: Check Browser Network Tab
1. Open DevTools → Network tab
2. Navigate to `/lead-capture/h2MKbXct`
3. Check the request:
   - **Status**: Should be 200 (not 404)
   - **Response**: Should be HTML content
   - **Content-Type**: Should be `text/html`

### Check 4: Verify Vercel Project Settings
1. Framework Preset: "Vite" or "Other"
2. Root Directory: `./` (root)
3. Build Command: `npm run build`
4. Output Directory: `dist`

### Check 5: Remove Conflicting Settings
If still not working, try removing `cleanUrls`:
```json
{
  "rewrites": [
    {
      "source": "/:path*",
      "destination": "/index.html"
    }
  ]
}
```

## Alternative: Explicit Route Matching

If catch-all doesn't work, try explicit routes:
```json
{
  "rewrites": [
    {
      "source": "/lead-capture/:code",
      "destination": "/index.html"
    },
    {
      "source": "/invitations/:path*",
      "destination": "/index.html"
    },
    {
      "source": "/:path*",
      "destination": "/index.html"
    }
  ]
}
```

## Notes

- `/:path*` is Vercel's native syntax for catch-all routes
- Vercel automatically handles static files before applying rewrites
- The rewrite happens at the edge (CDN level), so it's fast
- Make sure to redeploy without cache after changes


