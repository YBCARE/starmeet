// Firebase configuration for Starmeet
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey:            "AIzaSyBdSCjLIp02OtruF5V0XHtWNeMKdmgjoNA",
  authDomain:        "starmeet.online",
  projectId:         "starmeet-99b71",
  storageBucket:     "starmeet-99b71.firebasestorage.app",
  messagingSenderId: "635091525831",
  appId:             "1:635091525831:web:efad38c027ea92c0f71ee2",
  measurementId:     "G-W9S5T4RQ0D",
};

console.log('[Firebase] authDomain:', firebaseConfig.authDomain, '| project:', firebaseConfig.projectId);

let app, auth, db, storage;

try {
  app     = initializeApp(firebaseConfig);
  auth    = getAuth(app);
  db      = getFirestore(app);
  storage = getStorage(app);
  console.log('[Firebase] ✅ Initialized successfully — project:', firebaseConfig.projectId);
} catch (e) {
  console.error('[Firebase] ❌ Initialization FAILED:', e);
  // Don't re-throw — let the app degrade gracefully with localStorage fallback
}

export { auth, db, storage };

// Lazy analytics — browser only, won't block anything
if (typeof window !== 'undefined') {
  import('firebase/analytics').then(({ getAnalytics }) => {
    try {
      getAnalytics(app);
      console.log('[Firebase] ✅ Analytics ready');
    } catch (e) {
      console.warn('[Firebase] Analytics skipped:', e.message);
    }
  });
}

export default app;
