// Firebase CDN imports
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged as _onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  setDoc,
  doc,
  serverTimestamp,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Your config
const firebaseConfig = {
  apiKey: "BUILD_VAR_FIREBASE_API_KEY",
  authDomain: "BUILD_VAR_FIREBASE_AUTH_DOMAIN",
  projectId: "batch-timeline",
  storageBucket: "batch-timeline.firebasestorage.app",
  messagingSenderId: "101195337997",
  appId: "1:101195337997:web:a68d45acee5ab0fce96044",
};

// --- Security Layer for Local Development ---
// If you are running locally and placeholders haven't been replaced by GitHub Actions,
// this part will try to find your local keys.
if (firebaseConfig.apiKey.includes("BUILD_VAR_")) {
  // We use a hardcoded fallback for local development ONLY. 
  // Since this is wrapped in a check for the BUILD_VAR string, 
  // GitHub Actions will replace the string and this block will be ignored in production.
  firebaseConfig.apiKey = "AIzaSyBcH_pCf0uXlSd9OF89K8Jm_n7ymYMknH8";
  firebaseConfig.authDomain = "batch-timeline.firebaseapp.com";
}
// --------------------------------------------

// Guard initialization: reuse existing app if present (fixes double-init on multi-page loads)
let app;
try {
  if (typeof getApps === 'function' && getApps().length > 0) {
    app = getApp();
  } else {
    app = initializeApp(firebaseConfig);
  }
} catch (e) {
  // Defensive fallback
  console.warn("Firebase initialization warning:", e);
  try {
    app = initializeApp(firebaseConfig);
  } catch (err) {
    console.error("Firebase initialization failed:", err);
    throw new Error('Failed to initialize Firebase');
  }
}

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// Lightweight wait-for-auth helper: resolves once with the initial auth state
let _authReady = false;
let _authUser = null;
let _authReadyPromise = null;
export function waitForAuth(timeoutMs = 5000) {
  if (_authReady) return Promise.resolve(_authUser);
  if (_authReadyPromise) return _authReadyPromise;

  _authReadyPromise = new Promise((resolve) => {
    const unsub = _onAuthStateChanged(auth, (user) => {
      _authReady = true;
      _authUser = user;
      resolve(user);
      // cleanup this one-time listener
      try { unsub(); } catch (e) { /* ignore */ }
    });

    // timeout fallback: resolve even if auth didn't call back in time
    setTimeout(() => {
      if (!_authReady) {
        _authReady = true;
        resolve(null);
        try { unsub(); } catch (e) { }
      }
    }, timeoutMs);
  });

  return _authReadyPromise;
}

// Re-export commonly-used functions so other modules can import from ./firebase.js
export {
  app,
  auth,
  provider,
  signInWithPopup,
  _onAuthStateChanged as onAuthStateChanged,
  signOut,
  db,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  setDoc,
  doc,
  serverTimestamp,
  deleteDoc
};