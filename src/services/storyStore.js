import {
  collection, doc, setDoc, getDocs, deleteDoc, onSnapshot,
  query, orderBy, limit,
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase';

const COL = 'stories';
export const STORY_DURATION_MS = 24 * 60 * 60 * 1000;

function uid() {
  return 'story_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

async function uploadStoryMedia(storyId, base64, mediaType) {
  if (!base64 || !base64.startsWith('data:')) return base64;
  if (!storage) return base64;
  try {
    const ext = mediaType === 'video' ? 'mp4' : 'jpg';
    const storageRef = ref(storage, `stories/${storyId}.${ext}`);
    await uploadString(storageRef, base64, 'data_url');
    return await getDownloadURL(storageRef);
  } catch (e) {
    console.warn('[Starmeet] story upload failed, using inline media', e?.message);
    return base64;
  }
}

function activeStories(list) {
  const now = Date.now();
  return (list || []).filter(s => (s.expiresAt || 0) > now);
}

export function groupStories(stories, currentUserId) {
  const map = new Map();
  for (const s of activeStories(stories)) {
    const key = s.type === 'celeb' ? `celeb_${s.celebId}` : `fan_${s.userId}`;
    if (!map.has(key)) {
      map.set(key, {
        id: key,
        name: s.authorName || 'User',
        avatar: s.authorAvatar || '',
        type: s.type,
        celebId: s.celebId || null,
        userId: s.userId || null,
        isOwn: s.type === 'fan' && s.userId === currentUserId,
        slides: [],
      });
    }
    map.get(key).slides.push({
      id: s.id,
      mediaUrl: s.mediaUrl,
      mediaType: s.mediaType || 'image',
      caption: s.caption || '',
      createdAt: s.createdAt || 0,
    });
  }

  const groups = Array.from(map.values()).map(g => ({
    ...g,
    slides: g.slides.sort((a, b) => a.createdAt - b.createdAt),
  }));

  groups.sort((a, b) => {
    if (a.isOwn && !b.isOwn) return -1;
    if (!a.isOwn && b.isOwn) return 1;
    const aT = a.slides[a.slides.length - 1]?.createdAt || 0;
    const bT = b.slides[b.slides.length - 1]?.createdAt || 0;
    return bT - aT;
  });

  return groups;
}

export async function createFanStory(user, { media, mediaType = 'image', caption = '' }) {
  if (!db || !user?.id) throw new Error('Not signed in');
  if (!media) throw new Error('Add a photo or video');

  const id = uid();
  const mediaUrl = await uploadStoryMedia(id, media, mediaType);
  const now = Date.now();

  const story = {
    id,
    type: 'fan',
    userId: user.id,
    celebId: null,
    authorName: user.name || user.username || 'Fan',
    authorAvatar: user.avatar || '',
    mediaUrl,
    mediaType,
    caption: caption.trim(),
    createdAt: now,
    expiresAt: now + STORY_DURATION_MS,
  };

  await setDoc(doc(db, COL, id), story);
  return story;
}

export async function createCelebStory(celeb, { media, mediaType = 'image', caption = '' }) {
  if (!db || !celeb?.id) throw new Error('Celebrity required');
  if (!media) throw new Error('Add a photo or video');

  const id = uid();
  const mediaUrl = await uploadStoryMedia(id, media, mediaType);
  const now = Date.now();

  const story = {
    id,
    type: 'celeb',
    userId: null,
    celebId: String(celeb.id),
    authorName: celeb.name || 'Celebrity',
    authorAvatar: celeb.image || '',
    mediaUrl,
    mediaType,
    caption: caption.trim(),
    createdAt: now,
    expiresAt: now + STORY_DURATION_MS,
  };

  await setDoc(doc(db, COL, id), story);
  return story;
}

export async function deleteStory(storyId) {
  if (!db || !storyId) throw new Error('Invalid story');
  await deleteDoc(doc(db, COL, storyId));
}

export async function loadStories() {
  if (!db) return [];
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'), limit(300));
  const snap = await getDocs(q);
  return activeStories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
}

export function subscribeStories(onUpdate, onError) {
  if (!db) return () => {};
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'), limit(300));
  return onSnapshot(q, (snap) => {
    onUpdate(activeStories(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, (err) => {
    console.error('[Starmeet] stories error:', err?.code, err?.message);
    onError?.(err);
  });
}

export function getOwnStoryGroup(groups, userId) {
  if (!userId) return null;
  return groups.find(g => g.isOwn) || null;
}
