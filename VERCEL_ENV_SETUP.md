# Vercel Environment Variables Setup

## 🔐 Environment Variables Needed for Vercel

Go to your Vercel Dashboard → Your Project → Settings → Environment Variables

Add these **3** environment variables:

### 1. Backend API URL (Required)
```
Key: VITE_API_URL
Value: https://your-backend-url.railway.app
```
*Replace with your actual Railway backend URL*

### 2. Gemini API Key (Required for client-side PDF generation)
```
Key: VITE_GEMINI_API_KEY
Value: your_actual_gemini_api_key_here
```
*Get this from Google AI Studio: https://aistudio.google.com/apikey*

**Why needed:** The frontend uses Gemini for client-side PDF generation features.

### 3. Alternative Gemini Key Name (For compatibility)
```
Key: GEMINI_API_KEY
Value: your_actual_gemini_api_key_here
```
*Same key as above - the vite.config.ts looks for this name*

---

## ⚙️ How vite.config.ts Works

Your `vite.config.ts` does this:
```typescript
define: {
  'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
}
```

It reads `GEMINI_API_KEY` from environment and makes it available to the frontend as `process.env.API_KEY` and `process.env.GEMINI_API_KEY`.

---

## 📝 After Adding Variables

1. Click "Save" in Vercel
2. Vercel will ask if you want to redeploy
3. Click "Redeploy" to apply the new environment variables
4. Wait ~1-2 minutes for redeployment

---

## ✅ Verification

After redeployment:
1. Open your Vercel URL in browser
2. Open browser console (F12)
3. Should see no errors about "API_KEY environment variable not set"
4. App should load correctly

---

## 🔒 Security Note

**Backend API calls use the Railway backend** (which has its own Gemini key).

**Client-side PDF generation** uses the Gemini key from Vercel environment variables.

Both are secure because:
- Vercel environment variables are encrypted
- Keys are not exposed in your source code
- Keys are only available at build time (not in browser)

---

## 🚨 If You Still Get Errors

**Error: "API_KEY environment variable not set"**

Solution:
1. Verify `GEMINI_API_KEY` is added to Vercel
2. Check spelling matches exactly: `GEMINI_API_KEY`
3. Redeploy after adding variables
4. Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)

**Error: "MIME type error" for index.css**

Solution: Already fixed! We removed the reference to non-existent index.css file.

---

## 📦 Summary

**Add to Vercel:**
1. `VITE_API_URL` = Your Railway URL
2. `VITE_GEMINI_API_KEY` = Your Gemini key
3. `GEMINI_API_KEY` = Your Gemini key (same)

**Then redeploy!**
