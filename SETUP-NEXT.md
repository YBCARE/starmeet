# Starmeet — Next setup steps

## High: Stripe Pro upgrades

1. [Stripe Dashboard](https://dashboard.stripe.com) → **Products** → create:
   - **Pro Fan** — $9/month recurring
   - **Celebrity** — $29/month recurring
2. **Payment Links** → create one link per product
3. For each link, set **After payment** → redirect to:
   - Pro: `https://starmeet.online/upgrade-success?plan=pro`
   - Celebrity: `https://starmeet.online/upgrade-success?plan=celebrity`
4. Copy `.env.example` → `.env` and paste:
   - `VITE_STRIPE_PUBLISHABLE_KEY` (starts with `pk_live_`)
   - `VITE_STRIPE_LINK_PRO`
   - `VITE_STRIPE_LINK_CELEBRITY`
5. **Vercel** → Project → Settings → Environment Variables → add the same three `VITE_*` vars → redeploy
6. Test with live card (or `4242…` in test mode with `pk_test_` keys)

Until keys are set, Pro upgrades use **demo mode** (local activation only, no real payment).

---

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
