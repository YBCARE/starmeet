# Starmeet — Optional setup

## Stripe (optional — not required to launch)

**You do not need Stripe for the site to work.** Without it, Pro upgrades unlock instantly (demo mode) — unlimited messages, Pro badge, exclusive feed content.

When you want **real payments** later:

1. Create a free account at [stripe.com](https://stripe.com)
2. Follow steps in `.env.example`
3. Add keys to Vercel → redeploy

Until then, skip Stripe entirely.

## Medium: Mobile QA

After deploy, check on your phone:

- Bottom tab bar: Feed, Explore, Post, Messages, Profile
- Messages: tap a chat → back returns to list
- Feed: stories scroll, posts load, safe area at bottom
- Navbar: not overcrowded on small screens

---

## Low: Google sign-in shows starmeet.online (not firebaseapp.com)

Google popup text comes from Firebase **authDomain**. To show your domain:

1. [Firebase Console](https://console.firebase.google.com) → Hosting → connect **starmeet.online**
2. Add DNS records Firebase gives you (A/CNAME)
3. Authentication → Settings → Authorized domains → add `starmeet.online`
4. Update `src/firebase.js`:
   ```js
   authDomain: "starmeet.online",
   ```
5. Redeploy

**Note:** Site can stay on Vercel; Firebase Hosting is mainly for the auth domain. Alternative: keep `firebaseapp.com` in popup (works fine, just less branded).

---

## Low: Admin UI

Admin at `/admin` — styling uses `Admin.css`. Credentials in `AdminContext.jsx`.
