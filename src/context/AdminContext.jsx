import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  doc, setDoc, getDoc, updateDoc, deleteDoc,
  collection, getDocs, onSnapshot, query, orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';

const AdminContext = createContext(null);
const ADMIN_CREDS = { username: 'admin', password: 'starmeet2025' };

function load(k, fb) { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } }
function save(k, v)  { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
function uid()       { return 'adm_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

// Write to Firestore, silently fail
async function fsSet(path, id, data) {
  try { await setDoc(doc(db, path, id), data, { merge: true }); } catch {}
}
async function fsGet(path, id) {
  try { const s = await getDoc(doc(db, path, id)); return s.exists() ? s.data() : null; } catch { return null; }
}

export function AdminProvider({ children }) {
  const [loggedIn,    setLoggedIn]    = useState(() => load('sm_admin_session', false));
  const [overrides,   setOverrides]   = useState(() => load('sm_admin_overrides', {}));
  const [addedCelebs, setAddedCelebs] = useState(() => load('sm_admin_new_celebs', []));
  const [adminPosts,  setAdminPosts]  = useState(() => load('sm_admin_posts', []));
  const [postOvr,     setPostOvr]     = useState(() => load('sm_admin_post_ovr', {}));
  const [settings,    setSettings]    = useState(() => load('sm_admin_settings', {
    siteName:        'Starmeet',
    heroHeadline:    'Connect with the stars you love',
    maintenanceMode: false,
    minLikes:        10000,
    maxLikes:        2000000,
  }));

  // Sync admin data from Firestore on login
  useEffect(() => {
    if (!loggedIn) return;
    (async () => {
      try {
        // Settings
        const settingsSnap = await fsGet('admin', 'settings');
        if (settingsSnap) {
          setSettings(settingsSnap);
          save('sm_admin_settings', settingsSnap);
        }

        // Celebrity overrides
        const ovSnap = await getDocs(collection(db, 'admin_celeb_overrides'));
        if (!ovSnap.empty) {
          const ovData = {};
          ovSnap.docs.forEach(d => { ovData[d.id] = d.data(); });
          setOverrides(ovData);
          save('sm_admin_overrides', ovData);
        }

        // Added celebrities
        const acSnap = await getDocs(query(collection(db, 'admin_added_celebs'), orderBy('createdAt', 'desc')));
        if (!acSnap.empty) {
          const celebs = acSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          setAddedCelebs(celebs);
          save('sm_admin_new_celebs', celebs);
        }

        // Admin posts
        const apSnap = await getDocs(query(collection(db, 'admin_posts'), orderBy('createdAt', 'desc')));
        if (!apSnap.empty) {
          const posts = apSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          setAdminPosts(posts);
          save('sm_admin_posts', posts);
        }
      } catch {}
    })();
  }, [loggedIn]);

  /* ── auth ── */
  function adminLogin(username, password) {
    if (username === ADMIN_CREDS.username && password === ADMIN_CREDS.password) {
      setLoggedIn(true);
      save('sm_admin_session', true);
      return { success: true };
    }
    return { error: 'Invalid credentials' };
  }
  function adminLogout() {
    setLoggedIn(false);
    localStorage.removeItem('sm_admin_session');
  }

  /* ── celebrity overrides ── */
  const updateCeleb = useCallback((id, patch) => {
    setOverrides(prev => {
      const next = { ...prev, [id]: { ...(prev[id] || {}), ...patch } };
      save('sm_admin_overrides', next);
      fsSet('admin_celeb_overrides', String(id), next[id]);
      return next;
    });
  }, []);

  const deleteCeleb = useCallback((id) => {
    setOverrides(prev => {
      const next = { ...prev, [id]: { ...(prev[id] || {}), _deleted: true } };
      save('sm_admin_overrides', next);
      fsSet('admin_celeb_overrides', String(id), next[id]);
      return next;
    });
  }, []);

  const addCeleb = useCallback((data) => {
    const celeb = { id: uid(), ...data, _adminAdded: true, createdAt: Date.now() };
    setAddedCelebs(prev => {
      const next = [celeb, ...prev];
      save('sm_admin_new_celebs', next);
      fsSet('admin_added_celebs', celeb.id, celeb);
      return next;
    });
    return celeb;
  }, []);

  const getCelebOverride = useCallback((id) => overrides[id] || {}, [overrides]);

  /* ── admin posts ── */
  const addAdminPost = useCallback((data) => {
    const post = { id: uid(), ...data, createdAt: Date.now(), _adminPost: true };
    setAdminPosts(prev => {
      const next = [post, ...prev];
      save('sm_admin_posts', next);
      fsSet('admin_posts', post.id, post);
      return next;
    });
    return post;
  }, []);

  const updatePost = useCallback((id, patch) => {
    setPostOvr(prev => {
      const next = { ...prev, [id]: { ...(prev[id] || {}), ...patch } };
      save('sm_admin_post_ovr', next);
      fsSet('admin_post_overrides', String(id), next[id]);
      return next;
    });
  }, []);

  const deletePost = useCallback((id) => {
    setPostOvr(prev => {
      const next = { ...prev, [id]: { ...(prev[id] || {}), _deleted: true } };
      save('sm_admin_post_ovr', next);
      fsSet('admin_post_overrides', String(id), next[id]);
      return next;
    });
    setAdminPosts(prev => {
      const next = prev.filter(p => p.id !== id);
      save('sm_admin_posts', next);
      return next;
    });
  }, []);

  /* ── settings ── */
  const updateSettings = useCallback((patch) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      save('sm_admin_settings', next);
      fsSet('admin', 'settings', next);
      return next;
    });
  }, []);

  return (
    <AdminContext.Provider value={{
      loggedIn, adminLogin, adminLogout,
      overrides, addedCelebs, updateCeleb, deleteCeleb, addCeleb, getCelebOverride,
      adminPosts, addAdminPost, updatePost, deletePost, postOvr,
      settings, updateSettings,
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() { return useContext(AdminContext); }
