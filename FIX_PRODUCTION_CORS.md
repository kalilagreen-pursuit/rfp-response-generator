# Fix Production CORS Error - Render Backend

## 🚨 Current Error

```
Access to fetch at 'https://rfp-generator-backend.onrender.com/api/auth/login' 
from origin 'https://rfp-response-generator.vercel.app' has been blocked by CORS policy
```

## 🔍 Root Cause

The Render backend is not allowing requests from your Vercel frontend URL. This happens when:
1. `FRONTEND_URL` in Render is not set to your Vercel URL
2. The backend CORS fix hasn't been deployed to Render yet

## ✅ Solution

### Step 1: Update Render Environment Variable

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Select your backend service: `rfp-generator-backend`
3. Go to **"Environment"** tab
4. Find `FRONTEND_URL` variable
5. Update it to:
   ```
   https://rfp-response-generator.vercel.app
   ```
   ⚠️ **Important:**
   - Use `https://` (not `http://`)
   - No trailing slash
   - Exact match of your Vercel URL

6. Click **"Save Changes"**
7. Render will automatically redeploy (takes 2-3 minutes)

### Step 2: Verify Backend CORS Code is Deployed

The backend code should already allow multiple origins. Check Render logs:

1. Render Dashboard → Your Service → **"Logs"** tab
2. Look for this line on startup:
   ```
   🌐 CORS configured for origins: [ 'https://rfp-response-generator.vercel.app', 'http://localhost:5173', ... ]
   ```
3. You should see your Vercel URL in the list

### Step 3: Test After Deployment

After Render redeploys:

1. Open your Vercel site: `https://rfp-response-generator.vercel.app`
2. Try logging in
3. The CORS error should be resolved

## 🔍 Verify Current Configuration

### Check Render Environment Variables

Make sure these are set in Render:
- `FRONTEND_URL` = `https://rfp-response-generator.vercel.app`
- Other required variables (SUPABASE_URL, GEMINI_API_KEY, etc.)

### Check Backend Code

The backend code in `backend/src/index.ts` should have:
```typescript
const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);
```

This allows both production and local development.

## 📝 Quick Checklist

- [ ] `FRONTEND_URL` is set in Render to your Vercel URL
- [ ] `FRONTEND_URL` uses `https://` (not `http://`)
- [ ] `FRONTEND_URL` has no trailing slash
- [ ] Render service has been redeployed after updating `FRONTEND_URL`
- [ ] Backend logs show CORS configured with your Vercel URL
- [ ] Test login on Vercel site - should work now

## 🆘 Still Not Working?

If after updating `FRONTEND_URL` and redeploying you still see CORS errors:

1. **Check Render logs** for CORS warnings
2. **Verify the exact Vercel URL** matches what's in `FRONTEND_URL`
3. **Check if backend code is up to date** - make sure the CORS fix is deployed
4. **Test backend directly:**
   ```bash
   curl -H "Origin: https://rfp-response-generator.vercel.app" \
        -H "Access-Control-Request-Method: POST" \
        -X OPTIONS \
        https://rfp-generator-backend.onrender.com/api/auth/login \
        -v
   ```
   Should see `Access-Control-Allow-Origin: https://rfp-response-generator.vercel.app` in response headers.



