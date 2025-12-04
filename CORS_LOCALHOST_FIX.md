# Fix: CORS Error with Localhost Development

## 🚨 Error

```
Access to fetch at 'https://rfp-response-generator-production.up.railway.app/auth/login' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

## 🔍 Issues Found

### Issue 1: Missing `/api` in URL
- **Current:** `https://rfp-response-generator-production.up.railway.app/auth/login`
- **Should be:** `https://rfp-response-generator-production.up.railway.app/api/auth/login`

### Issue 2: Backend CORS Not Allowing Localhost
- Backend only allows `FRONTEND_URL` (production URL)
- Needs to also allow `http://localhost:5173` for local development

## ✅ Fixes Applied

### 1. Fixed `.env.local`
Updated `VITE_API_URL` to include `/api` suffix:
```
VITE_API_URL="https://rfp-response-generator-production.up.railway.app/api"
```

### 2. Updated Backend CORS
Modified `backend/src/index.ts` to allow:
- Production frontend URL (from `FRONTEND_URL`)
- `http://localhost:5173` (local development)
- `http://localhost:3000` (alternative local port)

## 🔄 Next Steps

### For Local Development:

1. **Restart the frontend dev server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Update backend environment variable (if using Railway):**
   - Go to Railway Dashboard → Your Service → Environment
   - Update `FRONTEND_URL` to include localhost:
     ```
     FRONTEND_URL=http://localhost:5173
     ```
   - Or keep production URL and the code will allow both

3. **Or run backend locally:**
   ```bash
   cd backend
   npm run dev
   ```
   - This will use `FRONTEND_URL` from `.env` which should include localhost

### Verify the Fix:

1. Open browser: http://localhost:5173
2. Open console (F12)
3. Check logs:
   ```
   VITE_API_URL: https://rfp-response-generator-production.up.railway.app/api
   Using API_BASE_URL: https://rfp-response-generator-production.up.railway.app/api
   ```
4. Try logging in - should work now!

## 📝 Notes

- The backend CORS now supports both production and local development
- Make sure `.env.local` has the `/api` suffix in `VITE_API_URL`
- If using Railway backend, you may need to update `FRONTEND_URL` there too

