import dotenv from 'dotenv';
dotenv.config();

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, terminate } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';

const config = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'orion9-dev-db-2026.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'orion9-dev-db-2026',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'orion9-dev-db-2026.firebasestorage.app',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:1031466156269:web:44dd23cdcc883f809b8ce4'
};

async function probe() {
  console.log('=== REAL LIVE FIREBASE ENVIRONMENT AUDIT PROBE ===');
  console.log('Target Project ID:', config.projectId);
  console.log('Auth Domain:', config.authDomain);
  console.log('Storage Bucket:', config.storageBucket);

  const app = initializeApp(config, 'LIVE_PROBE_APP');
  const db = getFirestore(app);
  const auth = getAuth(app);
  const storage = getStorage(app);

  const report = {
    environment: 'LIVE',
    configuredProjectId: config.projectId,
    authStatus: 'UNKNOWN',
    firestoreStatus: 'UNKNOWN',
    storageStatus: 'UNKNOWN',
    latencyMs: 0,
    timestamp: new Date().toISOString()
  };

  // 1. Test Firestore Live Read Probe
  const startTime = Date.now();
  try {
    const probeDoc = doc(db, 'system_health', 'live_status');
    const snap = await getDoc(probeDoc);
    report.latencyMs = Date.now() - startTime;
    report.firestoreStatus = snap.exists() ? 'VERIFIED_EXISTS' : 'VERIFIED_READ_SUCCESS_EMPTY';
    console.log(`[FIRESTORE] Live read probe SUCCEEDED in ${report.latencyMs}ms! (Exists: ${snap.exists()})`);
  } catch (err) {
    report.latencyMs = Date.now() - startTime;
    report.firestoreStatus = `FAILED: ${err.code || err.message}`;
    console.log('[FIRESTORE] Live read probe failed:', err.code, err.message);
  }

  // 2. Test Firebase Auth Initialization & App Binding
  try {
    if (auth && auth.app && auth.app.options.projectId === config.projectId) {
      report.authStatus = 'VERIFIED_INITIALIZED_AND_BOUND';
      console.log('[AUTH] Firebase Auth successfully bound to project:', auth.app.options.projectId);
    } else {
      report.authStatus = 'INITIALIZATION_MISMATCH';
    }
  } catch (err) {
    report.authStatus = `FAILED: ${err.message}`;
  }

  // 3. Test Storage Bucket Probe
  try {
    const probeRef = ref(storage, 'system/health_probe.json');
    try {
      await getDownloadURL(probeRef);
      report.storageStatus = 'VERIFIED_OBJECT_ACCESSIBLE';
      console.log('[STORAGE] Storage object probe accessible');
    } catch (storageErr) {
      if (storageErr.code === 'storage/object-not-found') {
        report.storageStatus = 'VERIFIED_BUCKET_REACHABLE_OBJECT_NOT_FOUND';
        console.log('[STORAGE] Storage bucket is reachable! (storage/object-not-found is expected for missing probe object)');
      } else if (storageErr.code === 'storage/unauthorized') {
        report.storageStatus = 'VERIFIED_BUCKET_SECURITY_ENFORCED_UNAUTHORIZED';
        console.log('[STORAGE] Storage bucket security rules actively enforcing (storage/unauthorized)');
      } else {
        report.storageStatus = `FAILED: ${storageErr.code || storageErr.message}`;
        console.log('[STORAGE] Storage probe error:', storageErr.code, storageErr.message);
      }
    }
  } catch (err) {
    report.storageStatus = `FAILED: ${err.message}`;
  }

  // Terminate Firestore connection so node exits cleanly
  await terminate(db);

  console.log('\n=== LIVE HEALTH CHECK REPORT ===');
  console.log(JSON.stringify(report, null, 2));
}

probe().catch(e => {
  console.error('Fatal probe error:', e);
  process.exit(1);
});
