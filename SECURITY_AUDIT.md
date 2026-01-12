# Security Audit Report
**Date:** December 10, 2025  
**Status:** 🔴 **CRITICAL ISSUES FOUND**

---

## Executive Summary

This security audit identified **3 CRITICAL** vulnerabilities and **2 HIGH** security issues that expose API keys and credentials. Immediate action is required to prevent unauthorized access and potential financial abuse.

---

## 🔴 CRITICAL VULNERABILITIES

### 1. **Gemini API Key Exposed in Client-Side Code** ⚠️ CRITICAL

**Location:** `components/VideoPitcherView.tsx:105`

**Issue:**
```typescript
<video
    controls
    src={`${project.videoPitchUrl}&key=${GEMINI_API_KEY}`}
    className="w-full h-full rounded-lg"
>
```

The Gemini API key is being directly embedded in HTML/JavaScript, making it visible to:
- Anyone viewing the page source
- Browser DevTools
- Network request logs
- Anyone inspecting the DOM

**Impact:**
- API key can be extracted and used maliciously
- Unauthorized API usage leading to unexpected charges
- Potential rate limit abuse
- Violation of Google's API terms of service

**Fix Required:**
1. Remove API key from video URL
2. Use backend proxy endpoint for video access
3. Implement server-side authentication for video requests

---

### 2. **API Keys Baked into Client Bundle** ⚠️ CRITICAL

**Location:** `vite.config.ts:8-9`

**Issue:**
```typescript
define: {
  'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
}
```

API keys are being embedded into the JavaScript bundle at build time. This means:
- The API key is visible in the compiled JavaScript files
- Anyone can extract it from `dist/assets/*.js`
- The key is exposed in production builds

**Impact:**
- Complete API key exposure in production
- Anyone can download your JavaScript bundle and extract the key
- No way to revoke access without rebuilding

**Fix Required:**
1. Remove API key from Vite build configuration
2. Move all Gemini API calls to backend endpoints
3. Use backend service (`backend/src/services/gemini.service.ts`) instead

---

### 3. **API Key Exported and Used Client-Side** ⚠️ CRITICAL

**Location:** `services/geminiService.ts:15`

**Issue:**
```typescript
export const GEMINI_API_KEY = apiKey; // Export the validated key for direct use.
```

The API key is exported and imported in multiple components:
- `components/VideoPitcherView.tsx:4`
- `components/CreativeStudioView.tsx:5`

**Impact:**
- API key accessible via browser console: `import { GEMINI_API_KEY } from './services/geminiService'`
- Can be extracted via browser DevTools
- Violates security best practices

**Fix Required:**
1. Remove client-side API key usage entirely
2. Move all AI generation to backend API endpoints
3. Use authenticated API calls from frontend to backend

---

## 🟠 HIGH PRIORITY ISSUES

### 4. **Hardcoded Passwords in Seed Scripts** ⚠️ HIGH

**Locations:**
- `backend/scripts/seed-mock-profiles.ts:14,28,42,56,70,84,98,112,185`
- `backend/scripts/create-pc-coggins.ts:138`
- `backend/src/routes/test.routes.ts:265`

**Issue:**
```typescript
password: 'Demo123!',
```

Hardcoded passwords are committed to the repository. While these are for development/test accounts, they:
- Are visible in git history
- Could be used if test accounts aren't properly secured
- Set a bad precedent

**Impact:**
- Test accounts could be compromised
- If test accounts have elevated permissions, security risk increases

**Fix Required:**
1. Use environment variables for test passwords
2. Add test passwords to `.env.example` (not actual values)
3. Document that test accounts should be deleted in production

---

### 5. **.env File Tracked in Git** ⚠️ HIGH

**Location:** `.env` (root directory)

**Issue:**
The `.env` file is tracked in git. While it currently only contains:
```
VITE_API_URL="http://localhost:3001/api"
```

This is still problematic because:
- Developers might accidentally add secrets to it
- It's easy to forget it's tracked
- Best practice is to never track `.env` files

**Impact:**
- Risk of accidentally committing secrets
- Violates security best practices

**Fix Required:**
1. Remove `.env` from git tracking
2. Add to `.gitignore` (already present, but file was added before)
3. Use `.env.example` for documentation

---

## 🟡 MEDIUM PRIORITY ISSUES

### 6. **Example Tokens in Documentation** ⚠️ MEDIUM

**Location:** `backend/API_DOCUMENTATION.md:64,110,182`

**Issue:**
Example JWT tokens in documentation:
```json
"access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Impact:**
- Low risk (these are clearly examples)
- Could confuse developers if they look like real tokens

**Fix Required:**
1. Add clear comments: `// EXAMPLE TOKEN - NOT REAL`
2. Use clearly fake tokens: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.EXAMPLE`
3. Document that these are examples only

---

## ✅ GOOD SECURITY PRACTICES FOUND

1. ✅ `.gitignore` properly excludes `.env*.local` files
2. ✅ Backend uses environment variables for all secrets
3. ✅ Supabase keys are server-side only
4. ✅ JWT tokens are handled server-side
5. ✅ No hardcoded production credentials found
6. ✅ Password validation exists in auth controller

---

## 🔧 IMMEDIATE ACTION ITEMS

### Priority 1 (Do Immediately):

1. **Remove API key from VideoPitcherView.tsx**
   ```bash
   # File: components/VideoPitcherView.tsx
   # Remove line 105: src={`${project.videoPitchUrl}&key=${GEMINI_API_KEY}`}
   # Replace with backend proxy endpoint
   ```

2. **Remove API key from vite.config.ts**
   ```bash
   # File: vite.config.ts
   # Remove lines 8-9 that expose GEMINI_API_KEY
   ```

3. **Remove client-side Gemini service**
   ```bash
   # File: services/geminiService.ts
   # Stop exporting GEMINI_API_KEY
   # Move all AI calls to backend API endpoints
   ```

4. **Remove .env from git**
   ```bash
   git rm --cached .env
   git commit -m "security: Remove .env from git tracking"
   ```

### Priority 2 (Do This Week):

5. **Replace hardcoded passwords with env vars**
   ```bash
   # Update seed scripts to use process.env.TEST_PASSWORD
   ```

6. **Add security documentation**
   ```bash
   # Document API key security requirements
   ```

---

## 📋 SECURITY CHECKLIST

Use this checklist to verify fixes:

- [ ] API keys removed from `vite.config.ts`
- [ ] `GEMINI_API_KEY` no longer exported from `services/geminiService.ts`
- [ ] Video component uses backend proxy (no API key in URL)
- [ ] All AI calls go through backend endpoints
- [ ] `.env` removed from git tracking
- [ ] Hardcoded passwords replaced with env vars
- [ ] Test accounts documented as test-only
- [ ] Production environment variables verified secure
- [ ] API keys rotated after fixes deployed

---

## 🔄 POST-FIX VERIFICATION

After implementing fixes, verify:

1. **Check JavaScript bundle:**
   ```bash
   npm run build
   grep -r "AIza" dist/  # Should find nothing
   ```

2. **Check network requests:**
   - Open browser DevTools → Network tab
   - Look for API key in any requests
   - Should only see backend API calls

3. **Check source code:**
   ```bash
   grep -r "GEMINI_API_KEY" components/  # Should find nothing
   grep -r "process.env.API_KEY" components/  # Should find nothing
   ```

4. **Verify backend-only usage:**
   ```bash
   grep -r "GEMINI_API_KEY" backend/src/  # Should only find server-side usage
   ```

---

## 📚 REFERENCES

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Google AI API Key Security](https://ai.google.dev/gemini-api/docs/api-key)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

---

## 🆘 IF API KEYS ARE COMPROMISED

If you suspect API keys have been exposed:

1. **Immediately rotate API keys:**
   - Google AI Studio: https://aistudio.google.com/apikey
   - Revoke old keys
   - Generate new keys

2. **Update environment variables:**
   - Update in all deployment environments
   - Update in local `.env.local` files
   - Never commit new keys

3. **Monitor usage:**
   - Check Google Cloud Console for unusual activity
   - Set up billing alerts
   - Review API usage logs

4. **Review git history:**
   ```bash
   git log --all --full-history -p -- .env*
   # Check if secrets were ever committed
   ```

---

**Report Generated:** December 10, 2025  
**Next Review:** After fixes are implemented  
**Status:** 🔴 **ACTION REQUIRED IMMEDIATELY**

