import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  doc, setDoc, getDoc, getDocs,
  collection, query, orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import {
  checkIsAdmin, loadBannedUserIds, banUserInFirestore, unbanUserInFirestore,
} from '../services/adminAuth';

const AdminContext = createContext(null);

function load(k, fb) { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } }
function save(k, v)  { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
function uid()       { return 'adm_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

async function fsSet(path, id, data) {
  if (!db) throw new Error('Database unavailable');
  await setDoc(doc(db, path, id), data, { merge: true });
}

async function fsGet(path, id) {
  try {
    const s = await getDoc(doc(db, path, id));
    return s.exists() ? s.data() : null;
  } catch {
    return null;
  }
}

export function AdminProvider({ children }) {
  const { user, authLoading, logout } = useAuth();
  const [adminVerified, setAdminVerified] = useState(false);
  const [adminChecking, setAdminChecking] = useState(true);
  const [adminError, setAdminError]       = useState('');

  const [overrides,   setOverrides]   = useState(() => load('sm_admin_overrides', {}));
  const [addedCelebs, setAddedCelebs] = useState(() => load('sm_admin_new_celebs', []));
  const [adminPosts,  setAdminPosts]  = useState(() => load('sm_admin_posts', []));
  const [postOvr,     setPostOvr]     = useState(() => load('sm_admin_post_ovr', {}));
  const [bannedUsers, setBannedUsers] = useState([]);
  const [settings,    setSettings]    = useState(() => load('sm_admin_settings', {
    siteName:        'Starmeet',
    heroHeadline:    'Connect with the stars you love',
    maintenanceMode: false,
    minLikes:        10000,
    maxLikes:        2000000,
  }));

  const loggedIn = !!user && adminVerified;

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    (async () => {
      setAdminChecking(true);
      setAdminError('');
      if (!user) {
        if (!cancelled) {
          setAdminVerified(false);
          setAdminChecking(false);
        }
        return;
      }
      const ok = await checkIsAdmin(user.id);
      if (!cancelled) {
        setAdminVerified(ok);
        setAdminChecking(false);
        if (!ok) setAdminError('This account is not authorized for admin access.');
      }
    })();

    return () => { cancelled = true; };
  }, [user, authLoading]);

  useEffect(() => {
    if (!loggedIn) return;
    (async () => {
      try {
        const settingsSnap = await fsGet('admin', 'settings');
        if (settingsSnap) {
          setSettings(settingsSnap);
          save('sm_admin_settings', settingsSnap);
        }

        const ovSnap = await getDocs(collection(db, 'admin_celeb_overrides'));
        if (!ovSnap.empty) {
          const ovData = {};
          ovSnap.docs.forEach(d => { ovData[d.id] = d.data(); });
          setOverrides(ovData);
          save('sm_admin_overrides', ovData);
        }

        const acSnap = await getDocs(query(collection(db, 'admin_added_celebs'), orderBy('createdAt', 'desc')));
        if (!acSnap.empty) {
          const celebs = acSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          setAddedCelebs(celebs);
          save('sm_admin_new_celebs', celebs);
        }

        const apSnap = await getDocs(query(collection(db, 'admin_posts'), orderBy('createdAt', 'desc')));
        if (!apSnap.empty) {
          const posts = apSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          setAdminPosts(posts);
          save('sm_admin_posts', posts);
        }

        const banned = await loadBannedUserIds();
        setBannedUsers(banned);
      } catch (e) {
        console.error('[Starmeet] Admin sync failed:', e);
      }
    })();
  }, [loggedIn]);

  function adminLogout() {
    setAdminVerified(false);
    setAdminError('');
    logout();
  }

  const updateCeleb = useCallback((id, patch) => {
    setOverrides(prev => {
      const next = { ...prev, [id]: { ...(prev[id] || {}), ...patch } };
      save('sm_admin_overrides', next);
      fsSet('admin_celeb_overrides', String(id), next[id]).catch(e =>
        console.error('[Starmeet] Admin write failed:', e.message)
      );
      return next;
    });
  }, []);

  const deleteCeleb = useCallback((id) => {
    setOverrides(prev => {
      const next = { ...prev, [id]: { ...(prev[id] || {}), _deleted: true } };
      save('sm_admin_overrides', next);
      fsSet('admin_celeb_overrides', String(id), next[id]).catch(e =>
        console.error('[Starmeet] Admin write failed:', e.message)
      );
      return next;
    });
  }, []);

  const addCeleb = useCallback((data) => {
    const celeb = { id: uid(), ...data, _adminAdded: true, createdAt: Date.now() };
    setAddedCelebs(prev => {
      const next = [celeb, ...prev];
      save('sm_admin_new_celebs', next);
      fsSet('admin_added_celebs', celeb.id, celeb).catch(e =>
        console.error('[Starmeet] Admin write failed:', e.message)
      );
      return next;
    });
    return celeb;
  }, []);

  const getCelebOverride = useCallback((id) => overrides[id] || {}, [overrides]);

  const addAdminPost = useCallback((data) => {
    const post = { id: uid(), ...data, createdAt: Date.now(), _adminPost: true };
    setAdminPosts(prev => {
      const next = [post, ...prev];
      save('sm_admin_posts', next);
      fsSet('admin_posts', post.id, post).catch(e =>
        console.error('[Starmeet] Admin write failed:', e.message)
      );
      return next;
    });
    return post;
  }, []);

  const updatePost = useCallback((id, patch) => {
    setPostOvr(prev => {
      const next = { ...prev, [id]: { ...(prev[id] || {}), ...patch } };
      save('sm_admin_post_ovr', next);
      fsSet('admin_post_overrides', String(id), next[id]).catch(e =>
        console.error('[Starmeet] Admin write failed:', e.message)
      );
      return next;
    });
  }, []);

  const deletePost = useCallback((id) => {
    setPostOvr(prev => {
      const next = { ...prev, [id]: { ...(prev[id] || {}), _deleted: true } };
      save('sm_admin_post_ovr', next);
      fsSet('admin_post_overrides', String(id), next[id]).catch(e =>
        console.error('[Starmeet] Admin write failed:', e.message)
      );
      return next;
    });
    setAdminPosts(prev => {
      const next = prev.filter(p => p.id !== id);
      save('sm_admin_posts', next);
      return next;
    });
  }, []);

  const updateSettings = useCallback((patch) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      save('sm_admin_settings', next);
      fsSet('admin', 'settings', next).catch(e =>
        console.error('[Starmeet] Admin write failed:', e.message)
      );
      return next;
    });
  }, []);

  const banFan = useCallback(async (fanId, meta = {}) => {
    const res = await banUserInFirestore(fanId, meta);
    if (res?.error) return res;
    setBannedUsers(prev => (prev.includes(fanId) ? prev : [...prev, fanId]));
    return { success: true };
  }, []);

  const unbanFan = useCallback(async (fanId) => {
    const res = await unbanUserInFirestore(fanId);
    if (res?.error) return res;
    setBannedUsers(prev => prev.filter(id => id !== fanId));
    return { success: true };
  }, []);

  const isFanBanned = useCallback((fanId) => bannedUsers.includes(fanId), [bannedUsers]);

  return (
    <AdminContext.Provider value={{
      loggedIn, adminChecking, adminError, adminLogout,
      overrides, addedCelebs, updateCeleb, deleteCeleb, addCeleb, getCelebOverride,
      adminPosts, addAdminPost, updatePost, deletePost, postOvr,
      settings, updateSettings,
      bannedUsers, banFan, unbanFan, isFanBanned,
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() { return useContext(AdminContext); }
