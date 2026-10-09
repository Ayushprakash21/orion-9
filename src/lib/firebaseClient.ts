import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';

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
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY', ''),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN', 'orion9-dev-db-2026.firebaseapp.com'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID', 'orion9-dev-db-2026'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET', 'orion9-dev-db-2026.firebasestorage.app'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', '1031466156269'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID', '1:1031466156269:web:44dd23cdcc883f809b8ce4')
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
const storageInstances: Map<string, FirebaseStorage> = new Map();
const connectedEmulators: Set<string> = new Set();

/**
 * Resolves the authoritative environment dynamically.
 * If omitted or unspecified, defaults safely to DEMO to prevent accidental LIVE writes.
 */
export const resolveCurrentEnvironment = (environment?: 'LIVE' | 'DEMO'): 'LIVE' | 'DEMO' => {
  if (environment === 'LIVE' || environment === 'DEMO') {
    return environment;
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = localStorage.getItem('orion9_database_environment');
      if (saved === 'LIVE' || saved === 'DEMO') {
        return saved;
      }
    } catch {}
  }
  if (typeof process !== 'undefined' && process.env) {
    const nodeEnv = process.env.VITE_ORION_ENV || process.env.ORION_ENV;
    if (nodeEnv === 'LIVE' || nodeEnv === 'DEMO') {
      return nodeEnv as 'LIVE' | 'DEMO';
    }
  }
  return 'DEMO';
};

/**
 * Connects Firebase instances to local emulators when configured.
 */
function setupEmulators(envKey: string, app: FirebaseApp): void {
  if (connectedEmulators.has(envKey)) return;
  connectedEmulators.add(envKey);

  const authHost = getEnvVar('FIREBASE_AUTH_EMULATOR_HOST', '');
  const firestoreHost = getEnvVar('FIRESTORE_EMULATOR_HOST', '');
  const storageHost = getEnvVar('FIREBASE_STORAGE_EMULATOR_HOST', '');

  if (authHost) {
    try {
      const auth = getAuth(app);
      connectAuthEmulator(auth, authHost.startsWith('http') ? authHost : `http://${authHost}`, { disableWarnings: true });
    } catch {}
  }
  if (firestoreHost) {
    try {
      const [host, port] = firestoreHost.split(':');
      const firestore = getFirestore(app);
      connectFirestoreEmulator(firestore, host || 'localhost', port ? parseInt(port, 10) : 8080);
    } catch {}
  }
  if (storageHost) {
    try {
      const [host, port] = storageHost.split(':');
      const storage = getStorage(app);
      connectStorageEmulator(storage, host || 'localhost', port ? parseInt(port, 10) : 9199);
    } catch {}
  }
}

/**
 * Invalidates and clears all cached instances across environments.
 */
export const resetFirebaseInstances = (): void => {
  appInstances.clear();
  authInstances.clear();
  firestoreInstances.clear();
  storageInstances.clear();
  connectedEmulators.clear();
};

/**
 * Returns the isolated Firebase App instance for the given environment.
 * LIVE uses the default instance ('orion9-dev-db-2026'), DEMO uses named instance ('demo-orion9-db-2026').
 */
export const getFirebaseApp = (environment?: 'LIVE' | 'DEMO'): FirebaseApp => {
  const envKey = resolveCurrentEnvironment(environment);
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
      if (!targetConfig.apiKey && typeof process !== 'undefined' && process.env?.NODE_ENV !== 'test') {
        console.warn('[FIREBASE-CONFIG] Warning: VITE_FIREBASE_API_KEY is not set for LIVE environment. Firebase client calls may fail.');
      }
      targetApp = initializeApp(targetConfig);
    }
  }

  setupEmulators(envKey, targetApp);
  appInstances.set(envKey, targetApp);
  return targetApp;
};

/**
 * Returns Auth instance isolated per environment.
 */
export const getFirebaseAuth = (environment?: 'LIVE' | 'DEMO'): Auth => {
  const envKey = resolveCurrentEnvironment(environment);
  if (!authInstances.has(envKey)) {
    const app = getFirebaseApp(envKey);
    authInstances.set(envKey, getAuth(app));
  }
  return authInstances.get(envKey)!;
};

/**
 * Returns Cloud Firestore instance strictly connected to the corresponding environment project.
 */
export const getFirebaseFirestore = (environment?: 'LIVE' | 'DEMO'): Firestore => {
  const envKey = resolveCurrentEnvironment(environment);
  if (!firestoreInstances.has(envKey)) {
    const app = getFirebaseApp(envKey);
    firestoreInstances.set(envKey, getFirestore(app));
  }
  return firestoreInstances.get(envKey)!;
};

/**
 * Returns Firebase Storage instance strictly connected to the corresponding environment project.
 */
export const getFirebaseStorage = (environment?: 'LIVE' | 'DEMO'): FirebaseStorage => {
  const envKey = resolveCurrentEnvironment(environment);
  if (!storageInstances.has(envKey)) {
    const app = getFirebaseApp(envKey);
    storageInstances.set(envKey, getStorage(app));
  }
  return storageInstances.get(envKey)!;
};

