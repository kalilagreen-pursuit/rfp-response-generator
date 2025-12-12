# Vercel 404 Diagnostic Guide

## Current Configuration

### vercel.json
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### URL Format
- **Generated URL**: `https://rfp-response-generator.vercel.app/lead-capture/h2MKbXct`
- **Unique Code Format**: base64url (8 chars: a-zA-Z0-9_-)
- **Frontend Route Match**: `/^\/lead-capture\/([a-zA-Z0-9_-]+)$/`

## Diagnostic Steps

### 1. Verify vercel.json is in Build Output

**Check Vercel Build Logs:**
1. Vercel Dashboard → Latest Deployment → Build Logs
2. Search for "vercel.json" or "rewrites"
3. Should see routing configuration being applied

**If not found:**
- Verify `vercel.json` is in root directory (not in `dist/`)
- Check that it's committed to git
- Verify file is not in `.vercelignore`

### 2. Test Direct URL Access

**In Browser:**
```
https://rfp-response-generator.vercel.app/lead-capture/h2MKbXct
```

**Expected:**
- Should return `index.html` (200 OK)
- Should NOT return 404

**If 404:**
- Rewrites are not being applied
- Check Vercel deployment settings

### 3. Check Vercel Project Settings

**Verify:**
1. Vercel Dashboard → Settings → General
2. **Framework Preset**: Should be "Vite" or "Other"
3. **Root Directory**: Should be `./` (root)
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`

### 4. Verify Build Output

**Check dist/index.html exists:**
- Vercel should build to `dist/` directory
- `dist/index.html` should exist
- All assets should be in `dist/assets/`

### 5. Test Static File Access

**Test root:**
```
https://rfp-response-generator.vercel.app/
```
Should load the app.

**Test static asset:**
```
https://rfp-response-generator.vercel.app/assets/index-*.js
```
Should return JavaScript file (not 404).

### 6. Check Vercel Function Logs

**Vercel Dashboard → Functions Tab:**
- Look for any routing errors
- Check if requests are reaching the rewrite rule
- Look for 404 errors in logs

### 7. Verify URL Encoding

**Check if unique code has special characters:**
- Base64url can contain: `-`, `_`, letters, numbers
- These should be URL-safe
- Test with a simple code: `/lead-capture/test123`

### 8. Alternative: Check Vercel CLI

**If you have Vercel CLI installed:**
```bash
vercel inspect <deployment-url>
```

This shows the actual routing configuration applied.

## Potential Issues & Solutions

### Issue 1: Rewrites Not Applied

**Symptoms:**
- All routes return 404
- Root `/` works but sub-routes don't

**Solution:**
1. Verify `vercel.json` is in root (not `dist/`)
2. Check file is committed to git
3. Force redeploy without cache
4. Check Vercel project settings

### Issue 2: Build Output Mismatch

**Symptoms:**
- Build succeeds but routes don't work
- `dist/` structure is wrong

**Solution:**
1. Check `vite.config.ts` output settings
2. Verify `dist/index.html` exists after build
3. Check build logs for errors

### Issue 3: Framework Detection

**Symptoms:**
- Vercel not detecting Vite correctly
- Wrong build settings applied

**Solution:**
1. Manually set Framework Preset to "Vite"
2. Or set to "Other" and configure manually
3. Verify build command and output directory

### Issue 4: Caching Issues

**Symptoms:**
- Changes not reflected after deployment
- Old behavior persists

**Solution:**
1. Redeploy without cache
2. Clear browser cache
3. Test in incognito mode
4. Check CDN cache settings

## Alternative Solutions

### Solution A: Use Vercel's Built-in SPA Support

If rewrites don't work, Vercel might need explicit SPA configuration:

```json
{
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "trailingSlash": false,
  "cleanUrls": true
}
```

### Solution B: Check for Conflicting Routes

If you have API routes or other routes, ensure they're excluded:

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

### Solution C: Use Vercel's Redirects Instead

As a last resort, try redirects (less efficient but more reliable):

```json
{
  "redirects": [
    {
      "source": "/lead-capture/:code",
      "destination": "/index.html",
      "permanent": false
    }
  ]
}
```

## Testing Checklist

- [ ] Root URL (`/`) loads correctly
- [ ] Static assets load (JS, CSS files)
- [ ] `/lead-capture/test123` returns HTML (not 404)
- [ ] Browser shows `index.html` content
- [ ] React app initializes
- [ ] Route matching works in `index.tsx`
- [ ] `LeadCaptureForm` component renders

## Next Steps

1. **Check Vercel Build Logs** for routing configuration
2. **Test with simple code**: `/lead-capture/test123`
3. **Verify `vercel.json` is processed** in build
4. **Check Vercel project settings** for framework detection
5. **Test in incognito** to rule out browser cache

## Contact Vercel Support

If none of the above works:
1. Vercel Dashboard → Help → Contact Support
2. Include:
   - Deployment URL
   - Build logs
   - `vercel.json` content
   - Description of issue


