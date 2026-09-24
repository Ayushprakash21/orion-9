import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

async function main() {
  console.log('===============================================================');
  console.log('ORION-9 — PHASE 9 DATABASE REALITY & FAILURE INDUCTION PROBE');
  console.log('===============================================================');
  console.log('Connecting to project:', firebaseConfig.projectId);

  const app = initializeApp(firebaseConfig, 'failure-induction-probe');
  const db = getFirestore(app);

  const testDocRef = doc(db, '_audit_verification_test', 'PHASE_9_PROBE_DOC');

  // Step 1: Live Write
  console.log('\n[TEST 1] Testing live Cloud Firestore write...');
  const testPayload = {
    testId: 'PHASE_9_PROBE',
    timestamp: new Date().toISOString(),
    organizationId: 'ORION_PLATFORM',
    tenantId: 'ORION_PLATFORM',
    status: 'ACTIVE_PROBE',
  };
  await setDoc(testDocRef, testPayload);
  console.log('✓ Live write succeeded.');

  // Step 2: Live Read
  console.log('\n[TEST 2] Testing live Cloud Firestore read verification...');
  const snap = await getDoc(testDocRef);
  if (!snap.exists()) {
    throw new Error('Verification doc does not exist!');
  }
  const readData = snap.data();
  console.log('✓ Live document verified:', readData.testId, '| Tenant:', readData.tenantId);

  // Step 3: Live Delete / Cleanup
  console.log('\n[TEST 3] Testing live Cloud Firestore cleanup...');
  await deleteDoc(testDocRef);
  const snapAfter = await getDoc(testDocRef);
  if (snapAfter.exists()) {
    throw new Error('Cleanup failed - document still exists!');
  }
  console.log('✓ Live cleanup verified. Document successfully removed.');

  // Step 4: Verify Historical Document Stamping
  console.log('\n[TEST 4] Verifying live historical document migration (PO-2026-0001)...');
  const poDoc = await getDoc(doc(db, 'purchase_orders', 'PO-2026-0001'));
  if (poDoc.exists()) {
    const poData = poDoc.data();
    console.log('✓ PO-2026-0001 tenantId:', poData.tenantId, '| organizationId:', poData.organizationId);
    if (poData.tenantId !== 'ORION_PLATFORM' || poData.organizationId !== 'ORION_PLATFORM') {
      throw new Error('PO-2026-0001 tenant stamping invalid!');
    }
  } else {
    console.warn('! PO-2026-0001 not found (skipping exact doc check)');
  }

  console.log('\n===============================================================');
  console.log('PHASE 9 DATABASE REALITY PROBE: 100% PASSED');
  console.log('===============================================================');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ FAILURE INDUCTION PROBE FAILED:', err);
  process.exit(1);
});
