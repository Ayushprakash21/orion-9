import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const getEnvVar = (key: string, fallback: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
      return (import.meta as any).env[key];
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key]!;
    }
  } catch {}
  return fallback;
};

export const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY', "AIzaSyC5qgG4DkMfCEdhNYHIb8hsIQ00pIkYRGo"),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN', "orion9-dev-db-2026.firebaseapp.com"),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID', "orion9-dev-db-2026"),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET', "orion9-dev-db-2026.firebasestorage.app"),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', "1031466156269"),
  appId: getEnvVar('VITE_FIREBASE_APP_ID', "1:1031466156269:web:44dd23cdcc883f809b8ce4")
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export const getFirebaseApp = (): FirebaseApp => {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  return app;
};

export const getFirebaseAuth = (): Auth => {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
};

export const getFirebaseFirestore = (): Firestore => {
  if (!db) {
    db = getFirestore(getFirebaseApp());
  }
  return db;
};
