import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile as fbUpdateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import {
  doc, setDoc, getDoc, updateDoc, collection,
  query, where, getDocs,
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase';

const AuthContext = createContext(null);

// ─── localStorage cache helpers ───────────────────────────────────────────────
function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

function firebaseAuthError(e, action = 'sign in') {
  if (e?.code === 'auth/unauthorized-domain') {
    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    return [
      e.message || 'This domain is not authorized for Firebase Auth.',
      host ? `Your browser is on: ${host}` : '',
      'In project starmeet-99b71 → Authentication → Settings → Authorized domains, add that exact hostname (and www if you use both).',
      'Also check Google Cloud → Credentials → API key HTTP referrers if you restricted the key.',
    ].filter(Boolean).join(' ');
  }
  if (e?.code === 'auth/operation-not-allowed') {
    return 'Email/password sign-in is disabled. Enable it in Firebase Console → Authentication → Sign-in method.';
  }
  if (e?.code === 'auth/email-already-in-use') return 'Email already registered';
  if (e?.code === 'auth/weak-password') return 'Password too weak (min 6 chars)';
  if (e?.code === 'auth/user-not-found' || e?.code === 'auth/invalid-email') {
    return 'No account found with this email';
  }
  if (e?.code === 'auth/invalid-credential' || e?.code === 'auth/wrong-password') {
    return 'Incorrect email or password';
  }
  if (e?.code === 'auth/popup-closed-by-user' || e?.code === 'auth/cancelled-popup-request') return 'Sign-in cancelled';
  if (e?.code === 'auth/too-many-requests') return 'Too many attempts. Wait a few minutes and try again.';
  if (e?.code === 'auth/requires-recent-login') return 'For security, log out and sign in again, then retry.';
  return e?.message || `Could not ${action}`;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function authReady() {
  if (!auth) {
    return 'Sign-in is unavailable. Refresh the page and try again.';
  }
  return null;
}

// Upload base64 avatar to Firebase Storage; returns download URL
async function uploadAvatar(userId, base64) {
  if (!base64 || !base64.startsWith('data:')) return base64; // already a URL or null
  try {
    const storageRef = ref(storage, `avatars/${userId}`);
    await uploadString(storageRef, base64, 'data_url');
    return await getDownloadURL(storageRef);
  } catch { return base64; } // fallback to base64 if upload fails
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user,          setUser]          = useState(() => load('sm_user', null));
  const [authLoading,   setAuthLoading]   = useState(true);
  const [fansDb,        setFansDb]        = useState(() => load('sm_fans_db', []));
  const [celebFollows,  setCelebFollows]  = useState(() => load('sm_celeb_follows', []));
  const [fanFollows,    setFanFollows]    = useState(() => load('sm_fan_follows', []));
  const [fanFollowers,  setFanFollowers]  = useState(() => load('sm_fan_followers', {}));
  const [likes,         setLikes]         = useState(() => load('sm_likes', []));
  const [saved,         setSaved]         = useState(() => load('sm_saved', []));
  const [comments,      setComments]      = useState(() => load('sm_comments', []));
  const [notifications, setNotifications] = useState(() => load('sm_notifications', []));
  const [proStatus,     setProStatus]     = useState(() => load('sm_pro_status', null)); // null | { plan, activatedAt }
  const [msgCounts,     setMsgCounts]     = useState(() => load('sm_msg_counts', {})); // celebId → sent count

  const isLoggedIn = !!user;
  const isPro      = !!proStatus;

  // ── Firebase Auth state listener ──────────────────────────────────────────
  // NOTE: _applyProfile is defined BELOW this effect; we use a ref to avoid
  // stale closure issues at the cost of one extra render on the cold path.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const snap = await getDoc(doc(db, 'users', fbUser.uid));
          if (snap.exists()) {
            // Use setUser/etc. directly here (can't call _applyProfile — defined later)
            const profile     = snap.data();
            const sessionUser = { id: fbUser.uid, ...profile };
            setUser(prev => {
              // Don't overwrite if already set by login/signup to avoid flicker
              if (prev?.id === fbUser.uid) return prev;
              save('sm_user', sessionUser);
              return sessionUser;
            });
            if (profile.celebFollows)  { setCelebFollows(profile.celebFollows);  save('sm_celeb_follows', profile.celebFollows); }
            if (profile.fanFollows)    { setFanFollows(profile.fanFollows);       save('sm_fan_follows', profile.fanFollows); }
            if (profile.fanFollowers)  { setFanFollowers(profile.fanFollowers);   save('sm_fan_followers', profile.fanFollowers); }
            if (profile.likes)         { setLikes(profile.likes);                 save('sm_likes', profile.likes); }
            if (profile.saved)         { setSaved(profile.saved);                 save('sm_saved', profile.saved); }
            if (profile.notifications) { setNotifications(profile.notifications); save('sm_notifications', profile.notifications); }
            setFansDb(prev => {
              const exists = prev.find(f => f.id === fbUser.uid);
              const entry  = { id: fbUser.uid, ...profile };
              const next   = exists ? prev.map(f => f.id === fbUser.uid ? entry : f) : [entry, ...prev].slice(0, 2000);
              save('sm_fans_db', next);
              return next;
            });
          }
        } catch (e) {
          console.warn('Firestore load failed, using localStorage cache', e);
        }
      }
      // Don't clear user on sign-out event — let logout() handle that explicitly
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // ── Helper: write user fields to Firestore ───────────────────────────────
  async function fsUpdateUser(uid, patch) {
    try {
      await updateDoc(doc(db, 'users', uid), patch);
    } catch {}
  }

  // ── AUTH ─────────────────────────────────────────────────────────────────

  // ── Helper: build a full profile and sync it to state + localStorage ────────
  function _applyProfile(fbUid, profile) {
    const sessionUser = { id: fbUid, ...profile };
    setUser(sessionUser);
    save('sm_user', sessionUser);
    if (profile.celebFollows)  { setCelebFollows(profile.celebFollows);  save('sm_celeb_follows', profile.celebFollows); }
    if (profile.fanFollows)    { setFanFollows(profile.fanFollows);       save('sm_fan_follows', profile.fanFollows); }
    if (profile.fanFollowers)  { setFanFollowers(profile.fanFollowers);   save('sm_fan_followers', profile.fanFollowers); }
    if (profile.likes)         { setLikes(profile.likes);                 save('sm_likes', profile.likes); }
    if (profile.saved)         { setSaved(profile.saved);                 save('sm_saved', profile.saved); }
    if (profile.notifications) { setNotifications(profile.notifications); save('sm_notifications', profile.notifications); }
    setFansDb(prev => {
      const exists = prev.find(f => f.id === fbUid);
      const entry  = { id: fbUid, ...profile };
      const next   = exists
        ? prev.map(f => f.id === fbUid ? entry : f)
        : [entry, ...prev].slice(0, 2000);
      save('sm_fans_db', next);
      return next;
    });
    return sessionUser;
  }

  async function signup({ username, email, password, name, bio, dob, avatar }) {
    const authErr = authReady();
    if (authErr) return { error: authErr };

    email = normalizeEmail(email);
    const cleanUsername = username.toLowerCase().replace(/\s+/g, '_');
    const existing = fansDb.find(f => f.email === email || f.username === cleanUsername);
    if (existing) return { error: existing.email === email ? 'Email already registered' : 'Username taken' };

    // ── Step 2: create Firebase Auth user ─────────────────────────────────
    console.log('[Starmeet] Signup: calling createUserWithEmailAndPassword...', { email });
    console.log('[Starmeet] Firebase auth object:', auth);
    console.log('[Starmeet] Firebase db object:', db);

    let fbUser;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      fbUser = cred.user;
      console.log('[Starmeet] ✅ Firebase Auth user created! UID:', fbUser.uid);
    } catch (e) {
      console.error('[Starmeet] ❌ Firebase Auth error:', e.code, e.message);
      return { error: firebaseAuthError(e, 'sign up') };
    }

    // ── Step 3: upload avatar (non-blocking — fallback to base64) ─────────
    let avatarUrl = avatar || null;
    if (avatar && avatar.startsWith('data:')) {
      avatarUrl = await uploadAvatar(fbUser.uid, avatar);
    }

    // ── Step 4: update Firebase Auth display name + send verification email ──
    try {
      await fbUpdateProfile(fbUser, { displayName: name || username, photoURL: '' });
    } catch (e) {
      console.warn('[Starmeet] updateProfile warning (non-fatal):', e.message);
    }
    try {
      await sendEmailVerification(fbUser);
      console.log('[Starmeet] ✅ Verification email sent to:', email);
    } catch (e) {
      console.warn('[Starmeet] Verification email failed (non-fatal):', e.message);
    }

    // ── Step 5: build profile object ──────────────────────────────────────
    const profile = {
      id:           fbUser.uid,
      username:     cleanUsername,
      email,
      name:         name || username,
      bio:          bio || '',
      dob:          dob || '',
      avatar:       avatarUrl,
      coverPhoto:   null,
      location:     '',
      createdAt:    Date.now(),
      postsCount:   0,
      celebFollows: [],
      fanFollows:   [],
      fanFollowers: {},
      likes:        [],
      saved:        [],
      notifications:[],
    };

    // ── Step 6: sign user in NOW (don't block on Firestore) ───────────────
    _applyProfile(fbUser.uid, profile);

    // ── Step 7: write Firestore profile (non-blocking, with retry) ────────
    const writeToFirestore = async (attempt = 1) => {
      try {
        await setDoc(doc(db, 'users', fbUser.uid), profile);
        console.log('[Starmeet] ✅ Firestore profile saved! UID:', fbUser.uid);
      } catch (e) {
        console.error(`[Starmeet] ❌ Firestore write attempt ${attempt} failed:`, e.code, e.message);
        if (attempt < 3) {
          setTimeout(() => writeToFirestore(attempt + 1), attempt * 2000);
        } else {
          console.error('[Starmeet] Firestore write failed after 3 attempts. Check: 1) Firestore is enabled in Firebase Console, 2) Security rules allow writes, 3) No network errors.');
        }
      }
    };
    writeToFirestore();

    return { success: true };
  }

  async function login({ email, password }) {
    const authErr = authReady();
    if (authErr) return { error: authErr };

    email = normalizeEmail(email);

    // ── Step 1: Firebase Auth sign-in ─────────────────────────────────────
    console.log('[Starmeet] Login: calling signInWithEmailAndPassword...', { email });
    let fbUser;
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      fbUser = cred.user;
      console.log('[Starmeet] ✅ Firebase Auth sign-in success! UID:', fbUser.uid);
    } catch (e) {
      console.error('[Starmeet] ❌ Login error:', e.code, e.message);
      return { error: firebaseAuthError(e, 'sign in') };
    }

    // ── Step 2: Load Firestore profile (non-blocking) ─────────────────────
    try {
      const snap = await getDoc(doc(db, 'users', fbUser.uid));
      if (snap.exists()) {
        _applyProfile(fbUser.uid, snap.data());
        console.log('[Starmeet] ✅ Firestore profile loaded');
      } else {
        // Auth user exists but no Firestore profile — create it now
        console.warn('[Starmeet] No Firestore profile found, creating minimal one...');
        const minimal = {
          id: fbUser.uid, email, name: fbUser.displayName || email.split('@')[0],
          username: email.split('@')[0].replace(/[^a-z0-9_]/gi, '_'),
          avatar: fbUser.photoURL || null, bio: '', coverPhoto: null,
          location: '', createdAt: Date.now(), postsCount: 0,
          celebFollows: [], fanFollows: [], fanFollowers: {},
          likes: [], saved: [], notifications: [],
        };
        setDoc(doc(db, 'users', fbUser.uid), minimal).catch(e =>
          console.warn('[Starmeet] Could not create profile doc:', e.message)
        );
        _applyProfile(fbUser.uid, minimal);
      }
    } catch (e) {
      // Firestore failed — still sign in using cached data or bare auth info
      console.warn('[Starmeet] Firestore load failed (signing in with cache):', e.message);
      const cached = load('sm_user', null);
      if (cached?.id === fbUser.uid) {
        setUser(cached); // restore from localStorage
      } else {
        setUser({ id: fbUser.uid, email, name: fbUser.displayName || email.split('@')[0], avatar: null });
        save('sm_user', { id: fbUser.uid, email, name: fbUser.displayName || email.split('@')[0], avatar: null });
      }
    }

    return { success: true };
  }

  async function resetPassword(email) {
    const authErr = authReady();
    if (authErr) return { error: authErr };

    const normalized = normalizeEmail(email);
    if (!normalized) return { error: 'Enter your email address' };

    try {
      await sendPasswordResetEmail(auth, normalized, {
        url: typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined,
      });
      return { success: true };
    } catch (e) {
      console.error('[Starmeet] Password reset error:', e.code, e.message);
      if (e?.code === 'auth/user-not-found') {
        // Don't reveal whether the email exists
        return { success: true };
      }
      return { error: firebaseAuthError(e, 'send reset email') };
    }
  }

  function hasPasswordLogin() {
    const fbUser = auth?.currentUser;
    if (!fbUser) return false;
    return fbUser.providerData.some(p => p.providerId === 'password');
  }

  function usesGoogleLogin() {
    const fbUser = auth?.currentUser;
    if (!fbUser) return false;
    return fbUser.providerData.some(p => p.providerId === 'google.com');
  }

  async function changePassword(currentPassword, newPassword) {
    const authErr = authReady();
    if (authErr) return { error: authErr };

    const fbUser = auth.currentUser;
    if (!fbUser) return { error: 'Not signed in' };
    if (!hasPasswordLogin()) {
      return { error: 'Your account uses Google sign-in. Use Google to log in, or request an email reset link to set a password.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { error: 'New password must be at least 6 characters' };
    }

    try {
      const credential = EmailAuthProvider.credential(fbUser.email, currentPassword);
      await reauthenticateWithCredential(fbUser, credential);
      await updatePassword(fbUser, newPassword);
      return { success: true };
    } catch (e) {
      console.error('[Starmeet] Change password error:', e.code, e.message);
      return { error: firebaseAuthError(e, 'change password') };
    }
  }

  async function loginWithGoogle() {
    const authErr = authReady();
    if (authErr) return { error: authErr };

    try {
      const provider = new GoogleAuthProvider();
      const cred   = await signInWithPopup(auth, provider);
      const fbUser = cred.user;

      // Check if Firestore profile exists; create if first login
      const snap = await getDoc(doc(db, 'users', fbUser.uid));
      let profile;
      if (snap.exists()) {
        profile = snap.data();
      } else {
        const cleanName = fbUser.displayName || 'Fan';
        const username  = cleanName.toLowerCase().replace(/\s+/g, '_') + '_' + fbUser.uid.slice(-4);
        profile = {
          id: fbUser.uid, username,
          email:        fbUser.email || '',
          name:         cleanName,
          bio: '', dob: '', avatar: fbUser.photoURL || null, coverPhoto: null,
          location: '', createdAt: Date.now(), postsCount: 0,
          celebFollows: [], fanFollows: [], fanFollowers: {},
          likes: [], saved: [], notifications: [],
        };
        await setDoc(doc(db, 'users', fbUser.uid), profile);
      }

      // Set user state IMMEDIATELY — don't wait for onAuthStateChanged
      _applyProfile(fbUser.uid, profile);

      return { success: true };
    } catch (e) {
      return { error: firebaseAuthError(e, 'sign in with Google') };
    }
  }

  function logout() {
    signOut(auth).catch(() => {});
    setUser(null);
    localStorage.removeItem('sm_user');
  }

  async function updateProfile(updates) {
    if (!user) return;
    // Upload new avatar if base64
    let avatarUrl = updates.avatar;
    if (avatarUrl && avatarUrl.startsWith('data:')) {
      avatarUrl = await uploadAvatar(user.id, avatarUrl);
      updates = { ...updates, avatar: avatarUrl };
    }
    let coverUrl = updates.coverPhoto;
    if (coverUrl && coverUrl.startsWith('data:')) {
      try {
        const storageRef = ref(storage, `covers/${user.id}`);
        await uploadString(storageRef, coverUrl, 'data_url');
        coverUrl = await getDownloadURL(storageRef);
        updates = { ...updates, coverPhoto: coverUrl };
      } catch {}
    }

    const updated = { ...user, ...updates };
    setUser(updated);
    save('sm_user', updated);

    const nextDb = fansDb.map(f => f.id === user.id ? { ...f, ...updates } : f);
    setFansDb(nextDb);
    save('sm_fans_db', nextDb);

    fsUpdateUser(user.id, updates);
  }

  // ── CELEBRITY FOLLOWS ────────────────────────────────────────────────────
  const toggleCelebFollow = useCallback((celebId) => {
    if (!user) return;
    setCelebFollows(prev => {
      const next = prev.includes(celebId) ? prev.filter(id => id !== celebId) : [...prev, celebId];
      save('sm_celeb_follows', next);
      fsUpdateUser(user.id, { celebFollows: next });
      return next;
    });
  }, [user]);

  const isCelebFollowing = useCallback((id) => celebFollows.includes(id), [celebFollows]);

  // ── FAN FOLLOWS ──────────────────────────────────────────────────────────
  const toggleFanFollow = useCallback((fanId) => {
    if (!user) return;
    setFanFollows(prev => {
      const alreadyFollowing = prev.includes(fanId);
      const next = alreadyFollowing ? prev.filter(id => id !== fanId) : [...prev, fanId];
      save('sm_fan_follows', next);
      setFanFollowers(fc => {
        const updated = { ...fc, [fanId]: (fc[fanId] || 0) + (alreadyFollowing ? -1 : 1) };
        save('sm_fan_followers', updated);
        fsUpdateUser(user.id, { fanFollows: next, fanFollowers: updated });
        return updated;
      });
      return next;
    });
  }, [user]);

  const isFanFollowing  = useCallback((id) => fanFollows.includes(id), [fanFollows]);
  const getFanFollowers = useCallback((id) => fanFollowers[id] || 0, [fanFollowers]);

  // Backwards compat
  const toggleFollow = toggleCelebFollow;
  const isFollowing  = isCelebFollowing;
  const follows      = celebFollows;

  // ── LIKES ────────────────────────────────────────────────────────────────
  const toggleLike = useCallback((postId) => {
    if (!user) return;
    setLikes(prev => {
      const next = prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId];
      save('sm_likes', next);
      fsUpdateUser(user.id, { likes: next });
      return next;
    });
  }, [user]);
  const isLiked = useCallback((id) => likes.includes(id), [likes]);

  // ── SAVES ────────────────────────────────────────────────────────────────
  const toggleSave = useCallback((postId) => {
    if (!user) return;
    setSaved(prev => {
      const next = prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId];
      save('sm_saved', next);
      fsUpdateUser(user.id, { saved: next });
      return next;
    });
  }, [user]);
  const isSaved = useCallback((id) => saved.includes(id), [saved]);

  // ── COMMENTS ─────────────────────────────────────────────────────────────
  const addComment = useCallback(async (postId, text, replyTo = null) => {
    if (!user || !text.trim()) return;
    const c = {
      id: uid(), postId, text: text.trim(),
      userId: user.id, user: user.username || user.name,
      avatar: user.avatar, time: 'just now',
      replyTo, likes: [], createdAt: Date.now(),
    };
    setComments(prev => {
      const next = [c, ...prev].slice(0, 1000);
      save('sm_comments', next);
      return next;
    });
    // Also write to Firestore
    try {
      await setDoc(doc(db, 'comments', c.id), c);
    } catch {}
    return c;
  }, [user]);

  const getPostComments = useCallback((postId) =>
    comments.filter(c => c.postId === postId), [comments]);

  // ── PRO STATUS ───────────────────────────────────────────────────────────
  const upgradeToPro = useCallback((plan = 'pro') => {
    const status = { plan, activatedAt: Date.now() };
    setProStatus(status);
    save('sm_pro_status', status);
    if (user) fsUpdateUser(user.id, { proStatus: status });
  }, [user]);

  // Track how many messages a user has sent to a specific celeb
  const trackMessage = useCallback((celebId) => {
    setMsgCounts(prev => {
      const next = { ...prev, [celebId]: (prev[celebId] || 0) + 1 };
      save('sm_msg_counts', next);
      return next;
    });
  }, []);
  const getMessageCount = useCallback((celebId) => msgCounts[celebId] || 0, [msgCounts]);

  // ── NOTIFICATIONS ─────────────────────────────────────────────────────────
  const addNotification = useCallback((notif) => {
    if (!user) return;
    const n = { id: uid(), read: false, createdAt: Date.now(), ...notif };
    setNotifications(prev => {
      const next = [n, ...prev].slice(0, 100);
      save('sm_notifications', next);
      fsUpdateUser(user.id, { notifications: next });
      return next;
    });
  }, [user]);

  const markAllRead = useCallback(() => {
    if (!user) return;
    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, read: true }));
      save('sm_notifications', next);
      fsUpdateUser(user.id, { notifications: next });
      return next;
    });
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // ── FAN LOOKUP ────────────────────────────────────────────────────────────
  const getFanById = useCallback((id) => fansDb.find(f => f.id === id), [fansDb]);
  const getFanByUsername = useCallback((u) => fansDb.find(f => f.username === u), [fansDb]);
  const searchFans = useCallback((q) => {
    if (!q) return fansDb.slice(0, 50);
    const lq = q.toLowerCase();
    return fansDb.filter(f => f.username?.includes(lq) || f.name?.toLowerCase().includes(lq)).slice(0, 50);
  }, [fansDb]);

  return (
    <AuthContext.Provider value={{
      user, isLoggedIn, authLoading, fansDb,
      signup, login, loginWithGoogle, logout, resetPassword, changePassword,
      hasPasswordLogin, usesGoogleLogin, updateProfile,
      // celeb follows (backwards compat)
      follows, celebFollows, toggleFollow, isFollowing, toggleCelebFollow, isCelebFollowing,
      // fan follows
      fanFollows, toggleFanFollow, isFanFollowing, getFanFollowers,
      // likes / saves
      likes, toggleLike, isLiked,
      saved, toggleSave, isSaved,
      // comments
      comments, addComment, getPostComments,
      // notifications
      notifications, addNotification, markAllRead, unreadCount,
      // pro
      isPro, proStatus, upgradeToPro, trackMessage, getMessageCount,
      // fan lookup
      getFanById, getFanByUsername, searchFans,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
