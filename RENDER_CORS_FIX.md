# Fix CORS Error - Deploy Backend Changes to Render

## 🚨 Current Issue

The CORS error persists because the backend CORS fix hasn't been deployed to Render yet.

**Error:**
```
Access to fetch at 'https://your-backend.onrender.com/api/auth/login' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

## ✅ Solution

The backend code has been updated to allow `localhost:5173`, but it needs to be deployed to Render.

### Step 1: Verify Changes Are Pushed

The changes have been committed and pushed to GitHub. Render should automatically detect and deploy them.

### Step 2: Check Render Deployment

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Select your backend service: `rfp-generator-backend`
3. Go to **"Events"** or **"Logs"** tab
4. Check if a new deployment is in progress or completed

### Step 3: Verify CORS Configuration

After Render deploys, check the logs:

1. Render Dashboard → Your Service → **"Logs"** tab
2. Look for this line on startup:
   ```
   🌐 CORS configured for origins: [ 'https://rfp-response-generator.vercel.app', 'http://localhost:5173', ... ]
   ```
3. You should see `http://localhost:5173` in the list

### Step 4: Test Again

1. Open: http://localhost:5173
2. Try logging in
3. The CORS error should be resolved

## 🔄 Alternative: Update Render Environment Variable

If you can't wait for the deployment, you can temporarily update Render's `FRONTEND_URL`:

1. Render Dashboard → Your Service → **"Environment"** tab
2. Find `FRONTEND_URL`
3. Update to: `http://localhost:5173`
4. Click **"Save Changes"** - Render will redeploy automatically

**Note:** This will break production, so only do this for testing. Revert it after testing.

## 📝 What Changed

The backend CORS configuration now allows:
- Production frontend URL (from `FRONTEND_URL` env var)
- `http://localhost:5173` (local development)
- `http://localhost:3000` (alternative local port)

This allows both production and local development to work.
