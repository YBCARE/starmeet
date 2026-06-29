# Starmeet Security Setup

After pulling these changes, complete these steps **once** in Firebase.

## 1. Deploy Firestore rules

The app code is only half the fix — rules must be published in Firebase.

```bash
firebase deploy --only firestore:rules
```

Or in [Firebase Console](https://console.firebase.google.com) → Firestore → **Rules** → paste `firestore.rules` → **Publish**.

## 2. Create your admin account

The old `admin` / `starmeet2025` login **no longer works**. Admin access uses your real Firebase account.

1. Sign in to Starmeet once (Google or email) so your user exists.
2. Firebase Console → **Authentication** → copy your **User UID**.
3. Firestore → **Start collection** (or add document):
   - Collection ID: `admins`
   - Document ID: **your UID** (exact match)
   - Fields (example):
     - `email` (string): `you@example.com`
     - `role` (string): `superadmin`
     - `createdAt` (number): `1719000000000`

4. Go to `https://starmeet.online/admin` and sign in with that same account.

## 3. Ban users (now enforced)

Admin → **Fans** → **Ban** writes to `banned_users/{uid}` in Firestore.

Banned users are signed out and cannot log in again until unbanned.

## What changed

| Before | After |
|--------|--------|
| Hardcoded admin password in client code | Firebase login + `admins/{uid}` check |
| Open admin Firestore collections | Admin writes require `admins` document |
| Anyone could read all user emails | User profiles require sign-in to read |
| Anyone could read/write any conversation | Only participants (+ admins) can access chats |
| Bans stored in browser localStorage only | Bans stored in Firestore and enforced on login |

## Add more admins

Create another document in `admins` with that person's Firebase UID.  
Documents can only be created in Firebase Console (rules block client writes).

## If admin panel writes fail

- Confirm you're signed in with an account that has an `admins/{uid}` document.
- Confirm Firestore rules are deployed.
- Check browser console for `permission-denied` errors.
