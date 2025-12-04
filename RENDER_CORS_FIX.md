# Fix CORS Error - Deploy Backend Changes to Railway

## 🚨 Current Issue

The CORS error persists because the backend CORS fix hasn't been deployed to Railway yet.

**Error:**
```
Access to fetch at 'https://rfp-response-generator-production.up.railway.app/api/auth/login' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

## ✅ Solution

The backend code has been updated to allow `localhost:5173`, but it needs to be deployed to Railway.

### Step 1: Verify Changes Are Pushed

The changes have been committed and pushed to GitHub. Railway should automatically detect and deploy them.

### Step 2: Check Railway Deployment

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your backend service: `rfp-response-generator-production`
3. Go to **"Deployments"** tab
4. Check if a new deployment is in progress or completed

### Step 3: Verify CORS Configuration

After Railway deploys, check the logs:

1. Railway Dashboard → Your Service → **"Logs"** tab
2. Look for this line on startup:
   ```
   🌐 CORS configured for origins: [ 'https://rfp-response-generator.vercel.app', 'http://localhost:5173', ... ]
   ```
3. You should see `http://localhost:5173` in the list

### Step 4: Test Again

1. Open: http://localhost:5173
2. Try logging in
3. The CORS error should be resolved

## 🔄 Alternative: Update Railway Environment Variable

If you can't wait for the deployment, you can temporarily update Railway's `FRONTEND_URL`:

1. Railway Dashboard → Your Service → **"Variables"** tab
2. Find `FRONTEND_URL`
3. Update to: `http://localhost:5173`
4. Railway will redeploy automatically

**Note:** This will break production, so only do this for testing. Revert it after testing.

## 📝 What Changed

The backend CORS configuration now allows:
- Production frontend URL (from `FRONTEND_URL` env var)
- `http://localhost:5173` (local development)
- `http://localhost:3000` (alternative local port)

This allows both production and local development to work.

