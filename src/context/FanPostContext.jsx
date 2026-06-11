// FanPostContext — manages fan-created posts, backed by Firestore
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  collection, addDoc, getDocs, query, where, orderBy, limit,
  onSnapshot, serverTimestamp, doc, setDoc,
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

const FanPostContext = createContext(null);

function load(key, fb) { try { return JSON.parse(localStorage.getItem(key)) ?? fb; } catch { return fb; } }
function save(key, v)  { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }
function uid()         { return 'fp_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

// Upload base64 media to Firebase Storage, return URL
async function uploadMedia(postId, base64, type) {
  if (!base64 || !base64.startsWith('data:')) return base64;
  try {
    const ext = type === 'video' ? 'mp4' : 'jpg';
    const storageRef = ref(storage, `posts/${postId}.${ext}`);
    await uploadString(storageRef, base64, 'data_url');
    return await getDownloadURL(storageRef);
  } catch { return base64; }
}

export function FanPostProvider({ children }) {
  const [fanPosts, setFanPosts] = useState(() => load('sm_fan_posts', []));
  const [firestoreReady, setFirestoreReady] = useState(false);

  // Real-time listener: load recent fan posts from Firestore on mount
  useEffect(() => {
    let unsub;
    try {
      const q = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc'),
        limit(200)
      );
      unsub = onSnapshot(q, (snap) => {
        const posts = snap.docs.map(d => ({ ...d.data(), id: d.id }));
        if (posts.length > 0) {
          // Merge Firestore posts with localStorage (localStorage posts may be newer)
          setFanPosts(prev => {
            const localOnly = prev.filter(p => !posts.find(fp => fp.id === p.id));
            const merged = [...posts, ...localOnly].sort((a, b) => (b.createdAt||0) - (a.createdAt||0)).slice(0, 500);
            save('sm_fan_posts', merged);
            return merged;
          });
        }
        setFirestoreReady(true);
      }, () => setFirestoreReady(true)); // error fallback
    } catch { setFirestoreReady(true); }

    return () => { try { unsub?.(); } catch {} };
  }, []);

  const createPost = useCallback(async (user, { caption, media, mediaType, taggedCelebs = [], location = '' }) => {
    if (!user) return null;
    const postId = uid();

    // Upload media to Storage if it's a base64 string
    let mediaUrl = media || null;
    if (media && media.startsWith('data:')) {
      mediaUrl = await uploadMedia(postId, media, mediaType);
    }

    const post = {
      id:           postId,
      type:         'fan',
      userId:       user.id,
      username:     user.username || user.name,
      userAvatar:   user.avatar,
      userName:     user.name,
      caption:      caption || '',
      media:        mediaUrl,
      mediaType:    mediaType || 'photo',
      taggedCelebs,
      location,
      likes:        0,
      commentsCount: 0,
      createdAt:    Date.now(),
    };

    // Save to local state immediately
    setFanPosts(prev => {
      const next = [post, ...prev].slice(0, 500);
      save('sm_fan_posts', next);
      return next;
    });

    // Also save to Firestore (fire and forget)
    try {
      await setDoc(doc(db, 'posts', postId), post);
    } catch {}

    return post;
  }, []);

  const getPostsByUser = useCallback((userId) =>
    fanPosts.filter(p => p.userId === userId), [fanPosts]);

  const getRecentPosts = useCallback((limit = 50) =>
    fanPosts.slice(0, limit), [fanPosts]);

  return (
    <FanPostContext.Provider value={{ fanPosts, createPost, getPostsByUser, getRecentPosts, firestoreReady }}>
      {children}
    </FanPostContext.Provider>
  );
}

export function useFanPosts() { return useContext(FanPostContext); }
