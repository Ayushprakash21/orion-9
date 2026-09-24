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

export const LIVE_FIREBASE_CONFIG = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY', "AIzaSyC5qgG4DkMfCEdhNYHIb8hsIQ00pIkYRGo"),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN', "orion9-dev-db-2026.firebaseapp.com"),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID', "orion9-dev-db-2026"),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET', "orion9-dev-db-2026.firebasestorage.app"),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', "1031466156269"),
  appId: getEnvVar('VITE_FIREBASE_APP_ID', "1:1031466156269:web:44dd23cdcc883f809b8ce4")
};

export const DEMO_FIREBASE_CONFIG = {
  apiKey: getEnvVar('VITE_DEMO_FIREBASE_API_KEY', "AIzaSyDemo00000000000000000000000000000"),
  authDomain: getEnvVar('VITE_DEMO_FIREBASE_AUTH_DOMAIN', "demo-orion9-db-2026.firebaseapp.com"),
  projectId: getEnvVar('VITE_DEMO_FIREBASE_PROJECT_ID', "demo-orion9-db-2026"),
  storageBucket: getEnvVar('VITE_DEMO_FIREBASE_STORAGE_BUCKET', "demo-orion9-db-2026.firebasestorage.app"),
  messagingSenderId: getEnvVar('VITE_DEMO_FIREBASE_MESSAGING_SENDER_ID', "999999999999"),
  appId: getEnvVar('VITE_DEMO_FIREBASE_APP_ID', "1:999999999999:web:demo44dd23cdcc883f809b8ce4")
};

// Backwards compatibility export
export const firebaseConfig = LIVE_FIREBASE_CONFIG;

const appInstances: Map<string, FirebaseApp> = new Map();
const authInstances: Map<string, Auth> = new Map();
const firestoreInstances: Map<string, Firestore> = new Map();

/**
 * Returns the isolated Firebase App instance for the given environment.
 * LIVE uses the default instance ('orion9-dev-db-2026'), DEMO uses named instance ('demo-orion9-db-2026').
 */
export const getFirebaseApp = (environment: 'LIVE' | 'DEMO' = 'LIVE'): FirebaseApp => {
  const envKey = (environment || 'LIVE').toUpperCase();
  if (appInstances.has(envKey)) {
    return appInstances.get(envKey)!;
  }

  const existingApps = getApps();
  const targetConfig = envKey === 'DEMO' ? DEMO_FIREBASE_CONFIG : LIVE_FIREBASE_CONFIG;

  let targetApp: FirebaseApp;
  const found = existingApps.find(a => (envKey === 'DEMO' ? a.name === 'DEMO_ORION9_APP' : a.name === '[DEFAULT]'));

  if (found) {
    targetApp = found;
  } else {
    if (envKey === 'DEMO') {
      targetApp = initializeApp(targetConfig, 'DEMO_ORION9_APP');
    } else {
      targetApp = existingApps.length === 0 ? initializeApp(targetConfig) : getApp();
    }
  }

  appInstances.set(envKey, targetApp);
  return targetApp;
};

/**
 * Returns Auth instance isolated per environment.
 */
export const getFirebaseAuth = (environment: 'LIVE' | 'DEMO' = 'LIVE'): Auth => {
  const envKey = (environment || 'LIVE').toUpperCase();
  if (!authInstances.has(envKey)) {
    const app = getFirebaseApp(environment);
    authInstances.set(envKey, getAuth(app));
  }
  return authInstances.get(envKey)!;
};

/**
 * Returns Cloud Firestore instance strictly connected to the corresponding environment project.
 */
export const getFirebaseFirestore = (environment: 'LIVE' | 'DEMO' = 'LIVE'): Firestore => {
  const envKey = (environment || 'LIVE').toUpperCase();
  if (!firestoreInstances.has(envKey)) {
    const app = getFirebaseApp(environment);
    firestoreInstances.set(envKey, getFirestore(app));
  }
  return firestoreInstances.get(envKey)!;
};
