# Production Deployment Guide

**Application:** RFP Response Generator
**Date:** December 3, 2025
**Status:** Ready for Production

---

## 🎯 Deployment Strategy

### Backend → Railway (Recommended)
- Easy setup with GitHub integration
- Built-in PostgreSQL (but we use Supabase)
- Automatic HTTPS
- ~$5/month for hobby tier

### Frontend → Vercel (Recommended)
- Best for React/Vite apps
- Automatic deployments from GitHub
- Global CDN
- Free tier available

---

## 📋 Pre-Deployment Checklist

### ✅ Completed:
- [x] Database schema verified and enhanced
- [x] Environment variable validation
- [x] Rate limiting configured
- [x] Error boundaries added
- [x] Request/response logging
- [x] Row Level Security enabled
- [x] All critical features tested

### 🔄 To Complete:
- [ ] Backend deployed to Railway
- [ ] Frontend deployed to Vercel
- [ ] Production environment variables configured
- [ ] Custom domain configured (optional)
- [ ] End-to-end testing in production

---

## 🚀 Part 1: Backend Deployment (Railway)

### Step 1: Prepare Backend for Production

**1.1 Create Railway Configuration**

We'll create this file next: `railway.json`

**1.2 Verify Build Script**

Your `package.json` already has the correct scripts:
```json
"scripts": {
  "build": "tsc",
  "start": "node dist/index.js"
}
```

✅ Good to go!

**1.3 Test Production Build Locally**

```bash
cd backend
npm run build
npm start
```

Verify it starts without errors.

### Step 2: Deploy to Railway

**2.1 Create Railway Account**
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project"

**2.2 Deploy from GitHub**
1. Click "Deploy from GitHub repo"
2. Select your `rfp-response-generator` repository
3. Railway will detect it's a Node.js app

**2.3 Configure Build Settings**

Railway should auto-detect, but verify:
- **Root Directory:** `backend`
- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Port:** `3001` (or let Railway assign)

**2.4 Add Environment Variables**

Go to Railway Project → Variables tab and add:

```env
NODE_ENV=production
PORT=${{PORT}}

# Supabase (from your Supabase dashboard)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_actual_key_here
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_key_here

# Gemini AI
GEMINI_API_KEY=your_actual_gemini_key
GEMINI_MODEL=gemini-2.0-flash

# CORS - Update after deploying frontend
FRONTEND_URL=https://your-app.vercel.app

# JWT (generate a secure secret)
JWT_SECRET=generate_a_long_random_string_here
JWT_EXPIRES_IN=7d

# Email (from Resend dashboard)
RESEND_API_KEY=your_resend_key_here
FROM_EMAIL=noreply@yourdomain.com
```

**Important:** Railway provides `${{PORT}}` - use this!

### Step 3: Deploy and Test

1. Click "Deploy" in Railway
2. Wait for build to complete (~2-3 minutes)
3. Railway will provide a URL like: `https://your-app.railway.app`
4. Test: `https://your-app.railway.app/health` (should return health status)

**Verify Backend:**
```bash
curl https://your-app.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "RFP Generator API is running"
}
```

---

## 🚀 Part 2: Frontend Deployment (Vercel)

### Step 1: Prepare Frontend for Production

**1.1 Create Vercel Configuration**

Create `vercel.json` in root directory (we'll do this next).

**1.2 Update API Base URL**

We need to create an environment file for production that points to your Railway backend.

### Step 2: Deploy to Vercel

**2.1 Create Vercel Account**
1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "Add New Project"

**2.2 Import Repository**
1. Select your `rfp-response-generator` repository
2. Vercel auto-detects Vite

**2.3 Configure Build Settings**

Vercel should auto-detect:
- **Framework Preset:** Vite
- **Root Directory:** `./` (root)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

**2.4 Add Environment Variables**

In Vercel Project Settings → Environment Variables:

```env
# Your Railway backend URL
VITE_API_URL=https://your-app.railway.app

# Gemini API - Keep for client-side PDF generation (if needed)
# VITE_GEMINI_API_KEY=your_key_here (optional, if client-side features need it)
```

**Note:** Vite requires `VITE_` prefix for environment variables!

### Step 3: Deploy and Test

1. Click "Deploy"
2. Wait for build (~1-2 minutes)
3. Vercel provides URL: `https://your-app.vercel.app`
4. Test the application end-to-end

---

## 🔧 Part 3: Configuration Files

Let me create the necessary config files for you...

---

## 🔐 Part 4: Security Configuration

### CORS Configuration

**Update Railway Environment Variable:**
```env
FRONTEND_URL=https://your-actual-app.vercel.app
```

Replace with your actual Vercel URL after deployment.

### Supabase Configuration

**Add Vercel URL to Supabase Allowed Origins:**

1. Go to Supabase Dashboard
2. Settings → API
3. Add your Vercel URL to "Site URL"
4. Add to "Redirect URLs"

### Rate Limiting

Already configured! ✅
- Auth endpoints: 5 attempts/15 min
- AI operations: 20/hour
- Uploads: 10/hour
- Invitations: 50/day

---

## 📊 Part 5: Monitoring & Health Checks

### Backend Health Check

```bash
curl https://your-backend.railway.app/health
```

### Frontend Health Check

Open browser: `https://your-app.vercel.app`

Should see your application load.

### Check Logs

**Railway:**
- Railway Dashboard → Your Project → Deployments → Logs

**Vercel:**
- Vercel Dashboard → Your Project → Deployments → Function Logs

---

## 🧪 Part 6: Post-Deployment Testing

### Test Checklist:

1. **Authentication**
   - [ ] Register new account
   - [ ] Login with credentials
   - [ ] Check profile loads

2. **Core Features**
   - [ ] Upload RFP document
   - [ ] Generate proposal
   - [ ] Edit proposal content
   - [ ] Export to PDF/DOCX
   - [ ] Send team invitation
   - [ ] Accept team invitation (in different browser/incognito)

3. **Marketplace**
   - [ ] View marketplace
   - [ ] Search profiles
   - [ ] Filter by industry

4. **Analytics**
   - [ ] Check proposal time tracking
   - [ ] View team response rates

5. **Error Handling**
   - [ ] Test with invalid inputs
   - [ ] Verify error boundaries work
   - [ ] Check rate limiting triggers

---

## 🔄 Part 7: Continuous Deployment

### Automatic Deployments

Both Railway and Vercel support automatic deployments:

**Railway:**
- Automatically deploys when you push to `main` branch
- Configure in Railway Dashboard → Settings → GitHub

**Vercel:**
- Automatically deploys on push to `main`
- Creates preview deployments for pull requests
- Configure in Vercel Dashboard → Settings → Git

### Deployment Workflow

```
1. Make code changes locally
2. Test thoroughly
3. Commit to feature branch
4. Create Pull Request
5. Vercel creates preview deployment
6. Review and test preview
7. Merge to main
8. Auto-deploys to production
```

---

## 🚨 Troubleshooting

### Backend Issues

**Problem:** Build fails on Railway
```bash
# Check logs in Railway dashboard
# Common issues:
# - Missing dependencies: npm install in backend/
# - TypeScript errors: npm run build locally first
```

**Problem:** Backend starts but crashes
```bash
# Check environment variables are set
# Verify SUPABASE_URL and keys are correct
# Check Railway logs for error messages
```

**Problem:** CORS errors
```bash
# Verify FRONTEND_URL matches your Vercel URL exactly
# Include protocol: https://your-app.vercel.app
# No trailing slash
```

### Frontend Issues

**Problem:** Build fails on Vercel
```bash
# Check build locally first: npm run build
# Verify all dependencies in package.json
# Check for TypeScript errors
```

**Problem:** API calls fail
```bash
# Verify VITE_API_URL is set correctly in Vercel
# Must include protocol: https://your-backend.railway.app
# Check Railway backend is running
```

**Problem:** White screen after deployment
```bash
# Check browser console for errors
# Verify environment variables
# Check Vercel function logs
```

---

## 💰 Cost Estimate

### Monthly Costs:

**Railway (Backend):**
- Hobby Plan: $5/month
- Includes 500 hours execution time
- ~$0.000231/GB/hour for memory

**Vercel (Frontend):**
- Free tier: $0/month
- Includes 100GB bandwidth
- Unlimited deployments

**Supabase:**
- Free tier: $0/month
- Includes 500MB database, 2GB file storage
- 50,000 monthly active users

**Total:** ~$5-10/month for hobby/small business use

---

## 📈 Scaling Considerations

### When to Upgrade:

**Railway Pro ($20/month):**
- More execution time
- Priority support
- Better performance

**Vercel Pro ($20/month):**
- More bandwidth
- Analytics
- Team features

**Supabase Pro ($25/month):**
- 8GB database
- 100GB file storage
- Daily backups

---

## 🎯 Next Steps

1. **Create configuration files** (next section)
2. **Deploy backend to Railway**
3. **Deploy frontend to Vercel**
4. **Configure environment variables**
5. **Test end-to-end**
6. **Set up custom domain** (optional)
7. **Monitor and iterate**

---

## 📞 Support Resources

- Railway: https://docs.railway.app
- Vercel: https://vercel.com/docs
- Supabase: https://supabase.com/docs
- Gemini AI: https://ai.google.dev/docs

---

**Ready to start?** Let's create the configuration files!
