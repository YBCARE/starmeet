import {
  doc, setDoc, getDoc, getDocs, onSnapshot,
  collection, query, orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';

const COL = 'support_tickets';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function ticketIdForUser(userId) {
  return `ticket_${userId}`;
}

export async function getOrCreateTicket(user) {
  if (!db || !user?.id) throw new Error('Not signed in');

  const id = ticketIdForUser(user.id);
  const ref = doc(db, COL, id);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return { id, ...snap.data() };
  }

  const ticket = {
    id,
    userId: user.id,
    email: user.email || '',
    name: user.name || user.username || 'Fan',
    username: user.username || '',
    messages: [{
      id: 'welcome',
      from: 'system',
      text: 'Hi! Describe your issue and the Starmeet team will reply here.',
      timestamp: Date.now(),
    }],
    status: 'open',
    updatedAt: Date.now(),
  };

  await setDoc(ref, ticket);
  return ticket;
}

export async function sendFanMessage(user, text) {
  if (!db || !user?.id || !text?.trim()) throw new Error('Invalid message');

  const id = ticketIdForUser(user.id);
  const ref = doc(db, COL, id);
  let prev = (await getDoc(ref)).data();

  if (!prev) {
    prev = await getOrCreateTicket(user);
  }

  const msg = {
    id: uid(),
    from: 'fan',
    text: text.trim(),
    timestamp: Date.now(),
  };

  const messages = [...(prev.messages || []), msg];
  const ticket = {
    ...prev,
    id,
    userId: user.id,
    email: user.email || prev.email || '',
    name: user.name || user.username || prev.name || 'Fan',
    username: user.username || prev.username || '',
    messages,
    status: 'open',
    updatedAt: Date.now(),
  };

  await setDoc(ref, ticket);
  return ticket;
}

export async function sendAdminReply(ticketId, text) {
  if (!db || !ticketId || !text?.trim()) throw new Error('Invalid reply');

  const ref = doc(db, COL, ticketId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Ticket not found');

  const prev = snap.data();
  const msg = {
    id: uid(),
    from: 'support',
    text: text.trim(),
    timestamp: Date.now(),
  };

  const messages = [...(prev.messages || []), msg];
  await setDoc(ref, {
    messages,
    status: 'answered',
    updatedAt: Date.now(),
  }, { merge: true });

  return { ...prev, messages, status: 'answered', updatedAt: Date.now() };
}

export function subscribeToTicket(userId, onUpdate, onError) {
  if (!db || !userId) return () => {};
  const ref = doc(db, COL, ticketIdForUser(userId));
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) onUpdate({ id: snap.id, ...snap.data() });
  }, (err) => {
    console.error('[Starmeet] ticket listener:', err?.code, err?.message);
    onError?.(err);
  });
}

export async function loadAllTickets() {
  if (!db) return [];
  const q = query(collection(db, COL), orderBy('updatedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function subscribeAllTickets(onUpdate, onError) {
  if (!db) return () => {};
  const q = query(collection(db, COL), orderBy('updatedAt', 'desc'));
  return onSnapshot(q, (snap) => {
    onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, (err) => {
    console.error('[Starmeet] support_tickets error:', err?.code, err?.message);
    onError?.(err);
  });
}

export function lastFanMessage(ticket) {
  const msgs = (ticket.messages || []).filter(m => m.from === 'fan');
  return msgs[msgs.length - 1]?.text || '';
}

export function needsReply(ticket) {
  const msgs = ticket.messages || [];
  const last = msgs[msgs.length - 1];
  return last && last.from === 'fan';
}
