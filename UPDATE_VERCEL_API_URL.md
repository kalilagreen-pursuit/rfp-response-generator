# ⚠️ Update Vercel API URL

## 🚨 Issue

The frontend is trying to connect to:
- `https://rfp-generator-backend.onrender.com/api`

But the actual backend is at:
- `https://rfp-response-generator-h3w2.onrender.com`

**These URLs don't match!**

## ✅ Fix: Update Vercel Environment Variable

### Step 1: Find Your Actual Render Backend URL

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Select your backend service
3. Look at the top of the page - you'll see the URL
4. It should be something like: `https://rfp-response-generator-h3w2.onrender.com`

### Step 2: Update Vercel Environment Variable

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `rfp-response-generator`
3. Go to **Settings** → **Environment Variables**
4. Find `VITE_API_URL`
5. Update it to match your actual Render backend URL:
   ```
   https://rfp-response-generator-h3w2.onrender.com/api
   ```
   ⚠️ **Important:** 
   - Use the exact URL from Render Dashboard
   - Must include `/api` suffix
   - No trailing slash

6. Click **"Save"**

### Step 3: Force Redeploy

**Critical:** The environment variable won't be included unless you redeploy!

1. Go to **Deployments** tab
2. Click **"..."** on latest deployment → **"Redeploy"**
3. **UNCHECK** ✅ "Use existing Build Cache"
4. Click **"Redeploy"**
5. Wait 1-2 minutes for deployment

### Step 4: Verify

After redeployment:

1. Open your Vercel site
2. Open browser console (F12)
3. Check logs:
   ```
   VITE_API_URL: https://rfp-response-generator-h3w2.onrender.com/api
   Using API_BASE_URL: https://rfp-response-generator-h3w2.onrender.com/api
   ```
4. Try logging in - should work now!

## 📝 Current Backend URLs

Based on the logs, your backend is at:
- **URL:** `https://rfp-response-generator-h3w2.onrender.com`
- **API Base:** `https://rfp-response-generator-h3w2.onrender.com/api`

Make sure `VITE_API_URL` in Vercel matches this exactly!



