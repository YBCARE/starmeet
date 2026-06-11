// Shared message store — primary: Firestore, secondary: localStorage cache
// Firestore collection: /conversations/{convoId}
// ConvoId = `${smallerId}__${largerId}` (sorted so same pair always produces same ID)

import {
  doc, setDoc, updateDoc, onSnapshot,
  collection, query, where, getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';

const LS_KEY = 'sm_convos_v3';

// ─── localStorage helpers ─────────────────────────────────────────────────────
export function loadAll() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; }
}
export function saveAll(data) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
}

// Deterministic convo ID from two participant IDs
export function convoId(a, b) {
  return [String(a), String(b)].sort().join('__');
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ─── Sync helpers ─────────────────────────────────────────────────────────────

// Write a full convo object to Firestore
async function fsWrite(convo) {
  try {
    await setDoc(doc(db, 'conversations', convo.id), convo, { merge: true });
  } catch {}
}

// Update a field on a Firestore convo doc
async function fsPatch(cid, patch) {
  try {
    await updateDoc(doc(db, 'conversations', cid), patch);
  } catch {}
}

// ─── Sync: pull all convos for a user from Firestore into localStorage ────────
export async function syncConvosFromFirestore(myId) {
  try {
    const q = query(collection(db, 'conversations'),
      where('participants', 'array-contains', myId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return;
    const all = loadAll();
    snap.docs.forEach(d => {
      const c = d.data();
      // Merge: keep whichever has more messages / is newer
      const existing = all[c.id];
      if (!existing || c.updatedAt > (existing.updatedAt || 0)) {
        all[c.id] = c;
      }
    });
    saveAll(all);
  } catch {}
}

// ─── Real-time listener for all convos of a user ─────────────────────────────
export function subscribeToConvos(myId, onUpdate) {
  if (!myId) return () => {};
  try {
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', myId)
    );
    return onSnapshot(q, (snap) => {
      const all = loadAll();
      snap.docs.forEach(d => {
        const c = d.data();
        all[c.id] = c;
      });
      saveAll(all);
      onUpdate(Object.values(all).filter(c => c.participants?.includes(myId)));
    }, () => {
      // Firestore error — fallback to localStorage
      onUpdate(getConvosForUser(myId));
    });
  } catch {
    return () => {};
  }
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export function getConvo(participantA, participantB) {
  const all = loadAll();
  return all[convoId(participantA, participantB)] || null;
}

export function upsertMessage(participantA, participantB, withInfo, message, status = 'active') {
  const all  = loadAll();
  const cid  = convoId(participantA, participantB);
  const prev = all[cid] || {
    id:           cid,
    myId:         participantA,
    theirId:      participantB,
    participants: [participantA, participantB],
    with:         withInfo,
    status,
    messages:     [],
    updatedAt:    Date.now(),
  };
  const updated = {
    ...prev,
    status,
    participants: [participantA, participantB],
    messages:  [...prev.messages, { ...message, id: message.id || uid() }],
    updatedAt: Date.now(),
  };
  all[cid] = updated;
  saveAll(all);

  // Async write to Firestore
  fsWrite(updated);

  return updated;
}

export function updateConvoStatus(cid, status) {
  const all = loadAll();
  if (all[cid]) {
    all[cid].status    = status;
    all[cid].updatedAt = Date.now();
    saveAll(all);
    fsPatch(cid, { status, updatedAt: Date.now() });
  }
}

export function appendMessage(cid, message) {
  const all = loadAll();
  if (!all[cid]) return;
  all[cid].messages = [...all[cid].messages, { ...message, id: message.id || uid() }];
  all[cid].updatedAt = Date.now();
  saveAll(all);
  fsWrite(all[cid]);
  return all[cid];
}

// Get all convos for a given participant (works on localStorage cache)
export function getConvosForUser(myId) {
  const all = loadAll();
  return Object.values(all).filter(c => {
    if (c.participants) return c.participants.includes(myId);
    return c.myId === myId || c.theirId === myId;
  });
}
