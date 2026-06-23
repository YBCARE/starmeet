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

## Google sign-in branding

**Full guide:** see [`SETUP-GOOGLE-BRANDING.md`](./SETUP-GOOGLE-BRANDING.md)

Quick version: Firebase authorized domains → Google OAuth app name “Starmeet” → change `authDomain` to `starmeet.online` in `src/firebase.js` → deploy. Vercel auth proxy is already in `vercel.json`.

---

## Low: Admin UI

Admin at `/admin` — styling uses `Admin.css`. Credentials in `AdminContext.jsx`.
