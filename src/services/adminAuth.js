import { doc, getDoc, setDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase';

export async function checkIsAdmin(uid) {
  if (!db || !uid) return false;
  try {
    for (const col of ['admins', 'Admin']) {
      const snap = await getDoc(doc(db, col, uid));
      if (snap.exists()) return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function checkIsBanned(uid) {
  if (!db || !uid) return false;
  try {
    const snap = await getDoc(doc(db, 'banned_users', uid));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function loadBannedUserIds() {
  if (!db) return [];
  try {
    const snap = await getDocs(collection(db, 'banned_users'));
    return snap.docs.map(d => d.id);
  } catch {
    return [];
  }
}

export async function banUserInFirestore(uid, meta = {}) {
  if (!db || !uid) return { error: 'Database unavailable' };
  try {
    await setDoc(doc(db, 'banned_users', uid), {
      bannedAt: Date.now(),
      ...meta,
    });
    return { success: true };
  } catch (e) {
    return { error: e?.message || 'Could not ban user' };
  }
}

export async function unbanUserInFirestore(uid) {
  if (!db || !uid) return { error: 'Database unavailable' };
  try {
    await deleteDoc(doc(db, 'banned_users', uid));
    return { success: true };
  } catch (e) {
    return { error: e?.message || 'Could not unban user' };
  }
}
