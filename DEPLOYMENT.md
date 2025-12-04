# Deployment Guide

This guide covers deploying the RFP Response Generator with:
- **Frontend**: Vercel
- **Backend**: Render
- **Database**: Supabase (already configured)

---

## 🚀 Backend Deployment (Render)

### Option A: Deploy via Dashboard (Recommended)

1. **Go to Render Dashboard**
   - Visit https://dashboard.render.com/
   - Sign in with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `kalilagreen-pursuit/rfp-response-generator`
   - Click "Connect"

3. **Configure Service**
   ```
   Name: rfp-generator-backend
   Region: Oregon (US West)
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

4. **Add Environment Variables**
   Click "Environment" and add:
   ```
   NODE_ENV=production
   PORT=3001
   SUPABASE_URL=<your-supabase-url>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   SUPABASE_ANON_KEY=<your-anon-key>
   GEMINI_API_KEY=<your-gemini-key>
   RESEND_API_KEY=<your-resend-key>
   FRONTEND_URL=https://your-app.vercel.app
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (takes 2-3 minutes)
   - Copy your backend URL: `https://rfp-generator-backend.onrender.com`

### Option B: Deploy via render.yaml (Blueprint)

1. Push the `render.yaml` file to your repository
2. Go to Render Dashboard → "Blueprints"
3. Click "New Blueprint Instance"
4. Select your repository
5. Fill in environment variables when prompted
6. Click "Apply"

---

## 🌐 Frontend Deployment (Vercel)

### Already Connected to GitHub

Your frontend is already configured with `vercel.json`. You just need to:

1. **Update Environment Variable**
   - Go to https://vercel.com/dashboard
   - Select your project
   - Go to "Settings" → "Environment Variables"
   - Update or add:
     ```
     VITE_API_URL=https://rfp-generator-backend.onrender.com/api
     ```

2. **Redeploy**
   - Vercel will automatically redeploy on next git push
   - Or manually trigger: "Deployments" → "Redeploy"

3. **Verify**
   - Visit your Vercel URL
   - Check that API calls work (login, signup, etc.)

---

## 🔄 Complete Deployment Steps

### Step 1: Deploy Backend First

```bash
# Make sure your code is committed
git add .
git commit -m "feat: Add Render deployment configuration"
git push origin main
```

Then follow "Backend Deployment (Render)" above.

### Step 2: Update Frontend Environment

After backend is deployed:

1. Copy backend URL from Render (e.g., `https://rfp-generator-backend.onrender.com`)
2. Go to Vercel → Settings → Environment Variables
3. Set `VITE_API_URL=https://rfp-generator-backend.onrender.com/api`
4. Redeploy frontend

### Step 3: Update CORS

Update `FRONTEND_URL` in Render environment variables to your Vercel URL.

### Step 4: Test

- Visit your Vercel URL
- Try logging in
- Check console for any CORS errors
- Test creating a proposal

---

## 🐛 Troubleshooting

### Backend Issues

**Build fails:**
- Check Render logs: Dashboard → Your Service → Logs
- Verify `backend/package.json` has correct build script
- Check TypeScript compilation: `npm run build` locally

**Environment variable errors:**
- Double-check all variables are set in Render
- SUPABASE_URL should start with `https://`
- Keys should not have quotes

**Port binding errors:**
- Render automatically sets PORT=10000
- Your Express server should use `process.env.PORT`

### Frontend Issues

**API calls failing:**
- Check `VITE_API_URL` is set correctly
- Must include `/api` at the end
- No trailing slash

**CORS errors:**
- Update `FRONTEND_URL` in backend Render environment
- Restart backend service after changing env vars

**Build fails:**
- Check Vercel logs
- Run `npm run build` locally to test
- Check for TypeScript errors

---

## 📊 Monitoring

### Render
- Logs: Dashboard → Service → Logs
- Metrics: Dashboard → Service → Metrics
- Free tier: 750 hours/month, sleeps after 15 min inactivity

### Vercel
- Analytics: Dashboard → Analytics
- Logs: Dashboard → Deployments → [deployment] → Build Logs
- Edge Network: Automatic CDN distribution

---

## 💰 Cost Estimates

### Free Tier Limits

**Render (Free):**
- 750 hours/month
- 512 MB RAM
- Service sleeps after 15 min inactivity
- First request after sleep: ~30s cold start

**Vercel (Free):**
- 100 GB bandwidth/month
- Unlimited deployments
- Automatic SSL
- Global CDN

**Supabase (Free):**
- 500 MB database
- 2 GB file storage
- 50,000 monthly active users

---

## 🔐 Security Checklist

- [ ] All environment variables set in Render
- [ ] CORS configured with correct frontend URL
- [ ] Supabase RLS policies enabled
- [ ] No sensitive keys in git history
- [ ] HTTPS enforced (automatic on Render/Vercel)
- [ ] Rate limiting enabled (already in backend code)

---

## 🚀 Upgrade Paths

### When to upgrade Render:

**Starter Plan ($7/month):**
- No sleep (always on)
- 512 MB RAM
- Good for development/staging

**Standard Plan ($25/month):**
- 2 GB RAM
- Better for production with traffic

### When to upgrade Vercel:

**Pro Plan ($20/month):**
- Needed if exceeding 100 GB bandwidth
- Advanced analytics
- Password protection

---

## 📝 Post-Deployment Tasks

1. **Test all features:**
   - [ ] User registration/login
   - [ ] Profile creation
   - [ ] RFP upload and parsing
   - [ ] Proposal generation
   - [ ] Document export (PDF/DOCX)
   - [ ] Team invitations
   - [ ] Marketplace search
   - [ ] Connection requests

2. **Configure monitoring:**
   - Set up error tracking (Sentry, LogRocket)
   - Configure uptime monitoring (UptimeRobot)

3. **Set up backups:**
   - Supabase has automatic backups on paid plans
   - Export data regularly

4. **Domain setup (optional):**
   - Add custom domain to Vercel
   - Update FRONTEND_URL in Render

---

## 🔄 Continuous Deployment

Both platforms support automatic deployments:

**Render:**
- Auto-deploys on push to `main` branch
- Configure in: Settings → Build & Deploy

**Vercel:**
- Auto-deploys on push to `main` branch
- Preview deployments for pull requests
- Already configured

---

## 📞 Support

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs

---

**Ready to deploy?** Start with the backend deployment on Render! 🚀
