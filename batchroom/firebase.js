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
if (firebaseConfig.apiKey.includes("BUILD_VAR_")) {
  try {
    const local = await import('./config.local.js');
    if (local && local.config) {
        firebaseConfig.apiKey = local.config.apiKey;
        firebaseConfig.authDomain = local.config.authDomain;
    }
  } catch (e) {
    console.warn("Local config not found. Live site will work after deployment.");
  }
}

// Guard initialization
let app;
try {
  if (typeof getApps === 'function' && getApps().length > 0) {
    app = getApp();
  } else {
    app = initializeApp(firebaseConfig);
  }
} catch (e) {
  app = initializeApp(firebaseConfig);
}

const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Custom wait function for auth state
const waitForAuth = () => {
    return new Promise((resolve) => {
        const unsubscribe = _onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(user);
        });
    });
};

export { 
  auth, 
  db, 
  provider, 
  signInWithPopup, 
  _onAuthStateChanged as onAuthStateChanged, 
  signOut,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  setDoc,
  doc,
  serverTimestamp,
  deleteDoc,
  waitForAuth
};