# 🚀 Quick Start - Deploy in 30 Minutes

This guide will get your RFP Response Generator deployed to production quickly.

---

## ✅ Prerequisites

Before starting, make sure you have:
- [x] GitHub account
- [ ] Railway account (sign up at https://railway.app)
- [ ] Vercel account (sign up at https://vercel.com)
- [ ] Your Supabase credentials handy
- [ ] Your Gemini API key handy
- [ ] Your Resend API key (for email invitations)

---

## 🎯 Part 1: Deploy Backend (10 minutes)

### Step 1: Sign up for Railway
1. Go to https://railway.app
2. Click "Login" → "Login with GitHub"
3. Authorize Railway

### Step 2: Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `rfp-response-generator` repository
4. Railway will start deploying automatically

### Step 3: Configure Settings
1. Click on your deployment
2. Go to "Settings"
3. Set "Root Directory" to `backend`
4. Build Command: `npm run build` (should be auto-detected)
5. Start Command: `npm start` (should be auto-detected)

### Step 4: Add Environment Variables
1. Go to "Variables" tab
2. Click "Add Variable"
3. Add these one by one:

```
NODE_ENV=production
PORT=${{PORT}}
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_key_from_supabase
SUPABASE_SERVICE_ROLE_KEY=your_service_key_from_supabase
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.0-flash
FRONTEND_URL=https://temporary-url.vercel.app
JWT_SECRET=generate_a_random_32_character_string
JWT_EXPIRES_IN=7d
RESEND_API_KEY=your_resend_key
FROM_EMAIL=noreply@yourdomain.com
```

**Note:** We'll update FRONTEND_URL after deploying the frontend.

### Step 5: Deploy
1. Click "Deploy"
2. Wait for build to complete (~2-3 minutes)
3. Copy your Railway URL (looks like: `https://your-app.railway.app`)
4. Test it: `curl https://your-app.railway.app/health`

✅ **Backend deployed!**

---

## 🎨 Part 2: Deploy Frontend (10 minutes)

### Step 1: Sign up for Vercel
1. Go to https://vercel.com
2. Click "Sign Up" → "Continue with GitHub"
3. Authorize Vercel

### Step 2: Import Project
1. Click "Add New..." → "Project"
2. Find your `rfp-response-generator` repository
3. Click "Import"

### Step 3: Configure Project
Vercel auto-detects everything, just verify:
- Framework Preset: **Vite** ✓
- Root Directory: `./` ✓
- Build Command: `npm run build` ✓
- Output Directory: `dist` ✓

### Step 4: Add Environment Variable
1. Before clicking "Deploy", scroll down to "Environment Variables"
2. Add:
   - Key: `VITE_API_URL`
   - Value: `https://your-backend.railway.app` (your Railway URL from Step 1)

### Step 5: Deploy
1. Click "Deploy"
2. Wait for build (~1-2 minutes)
3. Copy your Vercel URL (looks like: `https://your-app.vercel.app`)
4. Open it in browser to test

✅ **Frontend deployed!**

---

## 🔗 Part 3: Connect Everything (5 minutes)

### Step 1: Update Railway FRONTEND_URL
1. Go back to Railway Dashboard
2. Go to Variables tab
3. Update `FRONTEND_URL` to your Vercel URL
4. Railway will automatically redeploy

### Step 2: Update Supabase Settings
1. Go to Supabase Dashboard
2. Settings → Authentication → URL Configuration
3. Set "Site URL" to your Vercel URL
4. Add your Vercel URL to "Redirect URLs"
5. Click "Save"

---

## 🧪 Part 4: Test Everything (5 minutes)

### 1. Test Authentication
1. Open your Vercel URL in browser
2. Click "Register"
3. Create a new account
4. Verify email works
5. Login

### 2. Test Core Features
1. Create company profile
2. Upload a test document
3. Upload an RFP
4. Generate a proposal
5. Export to PDF

### 3. Test Team Invitations
1. Send an invitation to yourself (different email)
2. Check email received
3. Click invitation link
4. Accept invitation

If all these work → **🎉 You're live!**

---

## 🚨 Troubleshooting

### Backend Issues

**Problem:** Build fails
```
Solution: Check Railway logs for errors
Common fix: Verify all env variables are set
```

**Problem:** "CORS Error" in browser console
```
Solution: Verify FRONTEND_URL in Railway matches your Vercel URL exactly
Include https:// and no trailing slash
```

**Problem:** Backend crashes on start
```
Solution: Check Railway logs
Common issue: Missing SUPABASE_URL or GEMINI_API_KEY
```

### Frontend Issues

**Problem:** White screen after deploy
```
Solution: Check Vercel function logs
Common fix: Verify VITE_API_URL is set correctly
```

**Problem:** API calls fail (404 or connection refused)
```
Solution: Check VITE_API_URL includes https:// and correct Railway URL
Test backend directly: curl https://your-backend.railway.app/health
```

**Problem:** "Cannot read properties of undefined"
```
Solution: Check browser console for specific error
Verify all API endpoints are working
```

---

## 💰 Cost

- **Railway:** ~$5/month (Hobby plan)
- **Vercel:** $0/month (Free tier)
- **Supabase:** $0/month (Free tier)

**Total:** ~$5/month

---

## 📈 Optional Enhancements

### Custom Domain (Optional)

**For Frontend (Vercel):**
1. Purchase domain (e.g., yourdomain.com)
2. Vercel → Settings → Domains
3. Add your domain
4. Update DNS records (Vercel provides instructions)

**For Backend (Railway):**
1. Use subdomain (e.g., api.yourdomain.com)
2. Railway → Settings → Custom Domain
3. Add subdomain
4. Update DNS CNAME record

**After adding custom domains:**
1. Update Railway FRONTEND_URL to new domain
2. Update Supabase allowed origins
3. Update VITE_API_URL in Vercel (redeploy)

### Monitoring (Optional)

**Railway:**
- Enable email notifications for crashes
- Monitor resource usage in dashboard

**Vercel:**
- Enable deployment notifications
- Check Analytics tab for usage

---

## 🔄 Continuous Deployment

Both platforms are now set up for automatic deployments:

**When you push to GitHub:**
1. Code pushed to `main` branch
2. Railway automatically deploys backend
3. Vercel automatically deploys frontend
4. Changes live in ~2-3 minutes

**Best Practice:**
1. Make changes on feature branch
2. Test locally
3. Create Pull Request
4. Vercel creates preview deployment
5. Test preview
6. Merge to main
7. Auto-deploys to production

---

## 📝 What You've Deployed

**Backend Services:**
- ✅ Authentication API
- ✅ RFP parsing (Gemini AI)
- ✅ Proposal generation
- ✅ PDF/DOCX export
- ✅ Team invitations (email)
- ✅ Analytics tracking
- ✅ Marketplace API

**Frontend Features:**
- ✅ User authentication
- ✅ Profile management
- ✅ RFP upload
- ✅ Proposal editor
- ✅ Team collaboration
- ✅ Analytics dashboard
- ✅ Marketplace

**Security:**
- ✅ Row Level Security (Supabase)
- ✅ Rate limiting (8 different limits)
- ✅ HTTPS everywhere
- ✅ Environment validation
- ✅ Error boundaries

---

## 🎉 You're Live!

Your RFP Response Generator is now live and ready for users!

**Next Steps:**
1. Share the URL with your team
2. Monitor for any errors in first 24 hours
3. Gather user feedback
4. Plan next features

**Support:**
- Railway: https://docs.railway.app
- Vercel: https://vercel.com/docs
- Supabase: https://supabase.com/docs

---

**Need help?** Check the full [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions.

**Deployment Checklist:** [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
