# Backend Deployment - Render

## ✅ Current Backend Provider

**Backend is deployed on Render, not Railway.**

- **Service Name:** `rfp-generator-backend`
- **Configuration:** `render.yaml`
- **Dashboard:** https://dashboard.render.com/

## 📝 Important Notes

1. **Backend URL:** Check your Render dashboard for the actual backend URL
   - Format: `https://rfp-generator-backend.onrender.com` (or similar)
   - API endpoint: `https://rfp-generator-backend.onrender.com/api`

2. **Environment Variables:**
   - Set in Render Dashboard → Your Service → Environment
   - Key variable: `FRONTEND_URL` (should be your Vercel URL)

3. **CORS Configuration:**
   - Backend code allows both production and localhost origins
   - No need to change `FRONTEND_URL` for local development
   - The code automatically allows `http://localhost:5173`

4. **Deployments:**
   - Render auto-deploys on git push to main branch
   - Check deployment status in Render Dashboard

## 🔄 If You Need to Update Backend URL

If your Render backend URL has changed, update:

1. **Local development:** `.env.local`
   ```
   VITE_API_URL="https://your-backend.onrender.com/api"
   ```

2. **Vercel production:** Environment Variables
   - Key: `VITE_API_URL`
   - Value: `https://your-backend.onrender.com/api`

