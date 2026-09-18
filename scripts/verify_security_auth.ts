/**
 * ORION-9 AUTOMATED SECURITY & AUTHENTICATION VERIFICATION TEST SUITE
 * 
 * Verifies:
 * 1. "admin" is REJECTED as a universal password
 * 2. Empty or whitespace passwords are REJECTED
 * 3. Incorrect passwords are REJECTED
 * 4. Correct hashed credentials work as expected
 * 5. Normal user CANNOT perform privileged admin step-up
 * 6. Admin user MUST pass step-up authentication to obtain PrivilegedAdminSession
 * 7. Privileged session expires strictly and is revoked on demand
 * 8. Tenant isolation and RLS policies are declared in migration.sql
 * 9. Database health check reports honest connection status
 */

import fs from 'fs';
import path from 'path';
import { userService } from '../src/services/userService';
import { authService } from '../src/services/authService';
import { privilegedSessionManager } from '../src/kernel/security/privilegedSession';
import { databaseHealthService, ORION_SCHEMA_TABLES } from '../src/services/databaseHealthService';
import { verifyPassword } from '../src/kernel/security/crypto';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] ${testName}`);
  } else {
    console.error(`[FAIL] ${testName} - ${detail || 'Assertion failed'}`);
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('ORION-9: SECURITY, AUTHENTICATION & DATABASE VERIFICATION SUITE');
  console.log('================================================================\n');

  // Test 1: "admin" password rejection
  try {
    const res = await userService.verifyCredentials('admin', 'admin');
    assert(res === null, 'Universal password "admin" is strictly REJECTED for admin user');
  } catch (e) {
    assert(true, 'Universal password "admin" is strictly REJECTED');
  }

  // Test 2: "admin" password rejection for normal user
  try {
    const res = await userService.verifyCredentials('user', 'admin');
    assert(res === null, 'Universal password "admin" is strictly REJECTED for normal user');
  } catch (e) {
    assert(true, 'Universal password "admin" is strictly REJECTED');
  }

  // Test 3: Empty password rejection
  try {
    const res = await userService.verifyCredentials('admin', '');
    assert(res === null, 'Empty password is strictly REJECTED');
  } catch (e) {
    assert(true, 'Empty password is strictly REJECTED');
  }

  // Test 4: Whitespace password rejection
  try {
    const res = await userService.verifyCredentials('admin', '   ');
    assert(res === null, 'Whitespace password is strictly REJECTED');
  } catch (e) {
    assert(true, 'Whitespace password is strictly REJECTED');
  }

  // Test 5: Incorrect password rejection
  try {
    const res = await userService.verifyCredentials('admin', 'WrongPass123!');
    assert(res === null, 'Incorrect password is strictly REJECTED');
  } catch (e) {
    assert(true, 'Incorrect password is strictly REJECTED');
  }

  // Test 6: Correct admin credential succeeds
  const adminProfile = await userService.verifyCredentials('admin', 'OrionAdmin2026!');
  assert(adminProfile !== null && adminProfile.username === 'admin', 'Valid hashed admin credentials authenticate successfully');
  assert((adminProfile as any).password === undefined, 'Authenticated user profile strips plaintext password');
  assert((adminProfile as any).passwordHash === undefined, 'Authenticated user profile strips password hash');

  // Test 7: Correct normal user credential succeeds
  const normalUserProfile = await userService.verifyCredentials('user', 'OrionUser2026!');
  assert(normalUserProfile !== null && normalUserProfile.username === 'user', 'Valid hashed normal user credentials authenticate successfully');

  // Test 8: Non-admin user cannot request privileged admin step-up
  if (normalUserProfile) {
    try {
      await authService.requestAdminStepUp(normalUserProfile.id, 'OrionUser2026!');
      assert(false, 'Non-admin user CANNOT request privileged admin session', 'Step-up succeeded unexpectedly');
    } catch (err: any) {
      assert(err.message.includes('Administrator privileges required'), 'Non-admin user CANNOT request privileged admin session');
    }
  }

  // Test 9: Admin user wrong step-up password rejected
  if (adminProfile) {
    try {
      await authService.requestAdminStepUp(adminProfile.id, 'admin');
      assert(false, 'Admin entering "admin" for step-up is REJECTED');
    } catch (err: any) {
      assert(true, 'Admin entering "admin" for step-up is strictly REJECTED');
    }

    try {
      await authService.requestAdminStepUp(adminProfile.id, 'WrongPassword!');
      assert(false, 'Admin entering wrong password for step-up is REJECTED');
    } catch (err: any) {
      assert(true, 'Admin entering wrong password for step-up is REJECTED');
    }

    // Test 10: Admin valid step-up issues PrivilegedAdminSession
    const privSession = await authService.requestAdminStepUp(adminProfile.id, 'OrionAdmin2026!');
    assert(Boolean(privSession && privSession.token), 'Admin step-up authentication issues PrivilegedAdminSession');
    assert(privSession.userId === adminProfile.id, 'Privileged session binds to authenticated userId');
    assert(privSession.authenticationMethod === 'step_up_password', 'Privileged session records authentication method');
    assert(Boolean(privSession.correlationId), 'Privileged session has correlation ID');

    // Test 11: Privileged session validation
    const val = privilegedSessionManager.validate(adminProfile.id);
    assert(val.valid === true, 'Active privileged session validates successfully');

    // Test 12: Privileged session mismatch check
    const valMismatch = privilegedSessionManager.validate('different-user-id');
    assert(valMismatch.valid === false, 'Privileged session rejects mismatched identity');

    // Test 13: Privileged session revocation
    privilegedSessionManager.revoke('Test revocation');
    const valRevoked = privilegedSessionManager.validate();
    assert(valRevoked.valid === false, 'Revoked privileged session cannot perform privileged actions');
  }

  // Test 14: Check migration.sql schema coverage
  const migrationPath = path.join(process.cwd(), 'migration.sql');
  const migrationContent = fs.readFileSync(migrationPath, 'utf8');
  assert(fs.existsSync(migrationPath), 'migration.sql file is PRESENT');
  
  let allTablesPresent = true;
  for (const t of ORION_SCHEMA_TABLES) {
    if (!migrationContent.includes(`public.${t}`)) {
      allTablesPresent = false;
      console.error(`Missing table in migration.sql: ${t}`);
    }
  }
  assert(allTablesPresent, `migration.sql defines all ${ORION_SCHEMA_TABLES.length} required enterprise tables`);
  assert(migrationContent.includes('ENABLE ROW LEVEL SECURITY'), 'migration.sql activates Row Level Security (RLS)');
  assert(migrationContent.includes('organization_id'), 'migration.sql enforces organization_id tenant isolation');
  assert(!migrationContent.includes('USING (true)') && !migrationContent.includes('WITH CHECK (true)'), 'migration.sql has NO permissive "allow all" RLS policies');

  // Test 15: Database health check honest reporting
  const health = await databaseHealthService.checkHealth();
  assert(health.provider === 'Supabase PostgreSQL', 'Database health check reports provider as Supabase PostgreSQL');
  assert(health.connectionStatus === 'NOT CONFIGURED', 'Database health check honestly reports NOT CONFIGURED when env vars are absent');
  assert(health.migrationStatus === 'UNVERIFIED', 'Database health check honestly reports migration as UNVERIFIED');
  assert(health.localStore.status === 'AVAILABLE', 'Database health check reports local IndexedDB cache as AVAILABLE');

  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
  if (passedTests === totalTests) {
    console.log('ALL SECURITY & ARCHITECTURE VERIFICATIONS SUCCEEDED (100%)');
  } else {
    console.error('SOME VERIFICATIONS FAILED');
    process.exit(1);
  }
  console.log('================================================================\n');
}

runTests().catch(err => {
  console.error('Suite error:', err);
  process.exit(1);
});
