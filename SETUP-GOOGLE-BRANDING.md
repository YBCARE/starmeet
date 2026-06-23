# Google sign-in branding (show starmeet.online)

Your app runs on **Vercel**. Google sign-in uses **Firebase Auth**.  
Right now the popup may say `starmeet-99b71.firebaseapp.com` — this guide fixes that.

You do **not** need to move the whole site off Vercel.

---

## What you’ll change (3 places)

1. **Firebase** — allow your domain  
2. **Google Cloud** — OAuth app name + redirect URLs  
3. **Your code** — `authDomain` in `src/firebase.js`  
4. **Vercel** — auth proxy (already in `vercel.json`)

---

## Step 1 — Firebase Console

Open: https://console.firebase.google.com → project **starmeet-99b71**

### A) Authorized domains

1. **Authentication** → **Settings** → **Authorized domains**
2. Make sure these are listed (add if missing):
   - `starmeet.online`
   - `www.starmeet.online`
   - `localhost` (for local dev)

### B) Google sign-in enabled

1. **Authentication** → **Sign-in method**
2. **Google** → **Enabled**

---

## Step 2 — Google Cloud Console (OAuth)

Open: https://console.cloud.google.com → select project **starmeet-99b71**

### A) OAuth consent screen (what users see)

1. **APIs & Services** → **OAuth consent screen** → **Branding**
2. Fill in exactly:

| Field | Value |
|-------|--------|
| **App name** | `Starmeet` |
| **User support email** | your email |
| **App logo** | Upload `public/starmeet-oauth-logo.png` (must be **under 1 MB**, 120×120+ px) |
| **Application home page** | `https://starmeet.online` |
| **Application privacy policy link** | `https://starmeet.online/privacy` |
| **Application Terms of Service link** | `https://starmeet.online/terms` |
| **Authorized domains** | `starmeet.online` |

3. Click **Save**
4. **Verify branding** may stay grey until Google reviews (normal for external apps)

**Logo too big?** Use `starmeet-oauth-logo.png` in the project — not the full-size marketing logo. Google max is **1 MB**.

### B) OAuth client (redirect URLs)

1. **APIs & Services** → **Credentials**
2. Open the **Web client** used by Firebase (often named “Web client (auto created by Google Service)”)
3. **Authorized JavaScript origins** — add:
   ```
   https://starmeet.online
   https://www.starmeet.online
   http://localhost:5173
   ```
4. **Authorized redirect URIs** — add:
   ```
   https://starmeet.online/__/auth/handler
   https://www.starmeet.online/__/auth/handler
   https://starmeet-99b71.firebaseapp.com/__/auth/handler
   ```
5. Save

---

## Step 3 — Update `src/firebase.js`

Change `authDomain` from firebaseapp.com to your site:

```js
authDomain: "starmeet.online",
```

(Use `www.starmeet.online` only if that’s the URL users always open.)

---

## Step 4 — Deploy

```bat
cd C:\Users\USER\starmeet
deploy.bat
```

`vercel.json` already proxies `/__/auth/*` to Firebase so sign-in works on your domain.

---

## Step 5 — Test

1. Open https://starmeet.online/login  
2. Click **Continue with Google**  
3. Popup should say something like **“Choose an account to continue to Starmeet”** or **starmeet.online** (not `firebaseapp.com`)

Hard refresh if you still see the old text (Ctrl+Shift+R).

---

## Alternative: Firebase Hosting subdomain (optional)

Only if the Vercel proxy approach fails:

1. Firebase **Hosting** → add subdomain `auth.starmeet.online`
2. DNS: CNAME `auth` → `starmeet-99b71.web.app`
3. Set `authDomain: "auth.starmeet.online"`
4. Add `https://auth.starmeet.online/__/auth/handler` in Google OAuth redirect URIs

Main site stays on Vercel; only auth runs on Firebase.

---

## Troubleshooting

| Problem | Fix |
|--------|-----|
| `auth/unauthorized-domain` | Add domain in Firebase → Authorized domains |
| Popup still shows firebaseapp.com | Clear cache; confirm `authDomain` deployed; check OAuth consent screen app name |
| Sign-in fails after change | Confirm redirect URI `https://starmeet.online/__/auth/handler` in Google Cloud |
| Works on .online but not www | Add both domains everywhere (Firebase + Google + authDomain pick one primary) |
