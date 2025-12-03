# Deployment Checklist

Use this checklist to track your deployment progress.

---

## 🎯 Pre-Deployment (Completed ✅)

- [x] Database schema verified
- [x] Supabase enhancements applied
- [x] Environment variable validation
- [x] Rate limiting configured
- [x] Error boundaries added
- [x] Request/response logging
- [x] All features tested locally

---

## 🚀 Backend Deployment (Railway)

### Setup
- [ ] Create Railway account (https://railway.app)
- [ ] Connect GitHub repository
- [ ] Create new project

### Configuration
- [ ] Set root directory to `backend`
- [ ] Verify build command: `npm run build`
- [ ] Verify start command: `npm start`
- [ ] Set Node.js version to 18+

### Environment Variables
Add these in Railway Dashboard → Variables:

- [ ] `NODE_ENV=production`
- [ ] `PORT=${{PORT}}` (Railway provides this)
- [ ] `SUPABASE_URL` (from Supabase dashboard)
- [ ] `SUPABASE_ANON_KEY` (from Supabase dashboard)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (from Supabase dashboard)
- [ ] `GEMINI_API_KEY` (from Google AI Studio)
- [ ] `GEMINI_MODEL=gemini-2.0-flash`
- [ ] `FRONTEND_URL` (will update after Vercel deployment)
- [ ] `JWT_SECRET` (generate random string)
- [ ] `JWT_EXPIRES_IN=7d`
- [ ] `RESEND_API_KEY` (from Resend dashboard)
- [ ] `FROM_EMAIL` (your email address)

### Deploy
- [ ] Click "Deploy" in Railway
- [ ] Wait for build to complete
- [ ] Note your Railway URL: `______________________________`
- [ ] Test health endpoint: `curl https://your-app.railway.app/health`

### Verification
- [ ] Health check returns 200 OK
- [ ] Logs show "Server running on port..."
- [ ] No error messages in Railway logs

---

## 🚀 Frontend Deployment (Vercel)

### Setup
- [ ] Create Vercel account (https://vercel.com)
- [ ] Import GitHub repository
- [ ] Vercel auto-detects Vite

### Configuration
- [ ] Framework: Vite (auto-detected)
- [ ] Root directory: `./` (leave default)
- [ ] Build command: `npm run build` (auto-detected)
- [ ] Output directory: `dist` (auto-detected)

### Environment Variables
Add these in Vercel Dashboard → Settings → Environment Variables:

- [ ] `VITE_API_URL=https://your-backend.railway.app` (your Railway URL)

### Deploy
- [ ] Click "Deploy"
- [ ] Wait for build to complete
- [ ] Note your Vercel URL: `______________________________`
- [ ] Open URL in browser to test

### Verification
- [ ] Application loads without errors
- [ ] Can navigate to different pages
- [ ] Console shows no errors

---

## 🔗 Connect Frontend & Backend

### Update Railway FRONTEND_URL
- [ ] Go to Railway → Variables
- [ ] Update `FRONTEND_URL` to your Vercel URL
- [ ] Redeploy backend (Railway will auto-redeploy)

### Update Supabase
- [ ] Go to Supabase Dashboard → Authentication → URL Configuration
- [ ] Add Vercel URL to "Site URL"
- [ ] Add Vercel URL to "Redirect URLs"

### Test CORS
- [ ] Open frontend in browser
- [ ] Try to register/login
- [ ] Check browser console for CORS errors
- [ ] If CORS errors, verify FRONTEND_URL matches exactly

---

## 🧪 End-to-End Testing

### Authentication
- [ ] Register new account
- [ ] Verify email (check spam if needed)
- [ ] Login with credentials
- [ ] Logout and login again
- [ ] Test "forgot password" flow

### Profile
- [ ] Create company profile
- [ ] Upload capability document
- [ ] Update profile information
- [ ] Verify profile strength updates

### RFP & Proposals
- [ ] Upload RFP document (PDF or DOCX)
- [ ] Wait for parsing to complete
- [ ] Validate parsed content
- [ ] Generate proposal
- [ ] Edit proposal content
- [ ] Save changes
- [ ] Export to PDF
- [ ] Export to DOCX

### Team Collaboration
- [ ] Send team invitation
- [ ] Check email received (or check sent)
- [ ] Open invitation link in incognito browser
- [ ] Accept/decline invitation
- [ ] Verify team member appears in proposal

### Marketplace
- [ ] Navigate to marketplace
- [ ] Search for companies
- [ ] Filter by industry
- [ ] View company profile

### Analytics
- [ ] Check dashboard metrics
- [ ] View proposal time tracking
- [ ] Check team response rates

---

## 🔐 Security Verification

### SSL/HTTPS
- [ ] Railway URL uses HTTPS ✓
- [ ] Vercel URL uses HTTPS ✓
- [ ] No mixed content warnings

### Rate Limiting
- [ ] Try multiple login attempts (should be limited after 5)
- [ ] Try generating many proposals quickly (should be limited)
- [ ] Verify rate limit error messages are clear

### Authentication
- [ ] Try accessing protected routes without login (should redirect)
- [ ] Verify JWT tokens expire correctly
- [ ] Test session persistence across page refreshes

### Data Access
- [ ] Verify users can only see their own data
- [ ] Test accessing another user's proposal (should fail)
- [ ] Verify RLS policies work

---

## 📊 Performance Check

### Backend
- [ ] Health check responds < 500ms
- [ ] API requests complete < 2s
- [ ] No memory leaks in Railway logs
- [ ] CPU usage stays reasonable

### Frontend
- [ ] Initial page load < 3s
- [ ] Time to Interactive < 4s
- [ ] Images load efficiently
- [ ] No console errors or warnings

### Database
- [ ] Queries execute quickly (check Supabase dashboard)
- [ ] No slow query warnings
- [ ] Index usage is optimal

---

## 🎨 Optional: Custom Domain

### Backend (Railway)
- [ ] Purchase domain (e.g., api.yourdomain.com)
- [ ] Add custom domain in Railway settings
- [ ] Configure DNS CNAME record
- [ ] Verify SSL certificate

### Frontend (Vercel)
- [ ] Purchase domain (e.g., yourdomain.com)
- [ ] Add custom domain in Vercel settings
- [ ] Configure DNS records
- [ ] Verify SSL certificate
- [ ] Update Railway FRONTEND_URL to new domain
- [ ] Update Supabase allowed origins

---

## 📈 Monitoring Setup

### Railway
- [ ] Enable email notifications for crashes
- [ ] Set up health check monitoring
- [ ] Review resource usage metrics

### Vercel
- [ ] Enable deployment notifications
- [ ] Monitor bandwidth usage
- [ ] Check function execution times

### Supabase
- [ ] Review database size
- [ ] Check API usage
- [ ] Monitor authentication events

---

## 📝 Documentation

### For Users
- [ ] Update README with production URLs
- [ ] Create user guide
- [ ] Document known limitations

### For Developers
- [ ] Document deployment process
- [ ] List all environment variables
- [ ] Document API endpoints
- [ ] Create troubleshooting guide

---

## 🎉 Launch!

- [ ] Announce to users
- [ ] Monitor closely for first 24 hours
- [ ] Gather feedback
- [ ] Plan next iteration

---

## 📞 Emergency Contacts

**Railway Support:** support@railway.app
**Vercel Support:** support@vercel.com
**Supabase Support:** support@supabase.io

---

## 🔄 Post-Launch Tasks

### Week 1
- [ ] Monitor error rates
- [ ] Review user feedback
- [ ] Fix critical bugs
- [ ] Optimize slow queries

### Week 2
- [ ] Analyze usage patterns
- [ ] Identify popular features
- [ ] Plan improvements
- [ ] Consider scaling needs

### Month 1
- [ ] Review costs vs budget
- [ ] Evaluate performance metrics
- [ ] Plan feature roadmap
- [ ] Consider premium features

---

**Date Started:** ________________
**Backend Deployed:** ________________
**Frontend Deployed:** ________________
**Production Launch:** ________________

---

Good luck with your deployment! 🚀
