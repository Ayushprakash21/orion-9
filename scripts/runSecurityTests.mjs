#!/usr/bin/env node
import { spawn } from 'child_process';
import process from 'process';

console.log('============================================================');
console.log('ORION-9 MANDATORY SECURITY GATE 1 ENFORCEMENT');
console.log('Zero Skipped Tests Allowed · Live Firebase Emulator Enforced');
console.log('============================================================\n');

process.env.FIREBASE_EMULATOR_REQUIRED = 'true';

const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const vitestCmd = process.platform === 'win32' ? 'npx.cmd vitest run src/__tests__/security/' : 'npx vitest run src/__tests__/security/';
const args = [
  'firebase-tools',
  'emulators:exec',
  '--only',
  'firestore,auth',
  vitestCmd,
];

console.log(`[GATE 1] Booting Firebase Emulators & executing security test suite...`);

const child = spawn(cmd, args, {
  env: {
    ...process.env,
    FIREBASE_EMULATOR_REQUIRED: 'true',
  },
  stdio: ['inherit', 'pipe', 'pipe'],
});

let stdoutBuffer = '';
let stderrBuffer = '';

child.stdout.on('data', (data) => {
  const str = data.toString();
  stdoutBuffer += str;
  process.stdout.write(str);
});

child.stderr.on('data', (data) => {
  const str = data.toString();
  stderrBuffer += str;
  process.stderr.write(str);
});

child.on('close', (code) => {
  console.log('\n============================================================');
  console.log('SECURITY GATE 1 POST-EXECUTION VERIFICATION');
  console.log('============================================================');

  if (code !== 0) {
    console.error(`[GATE 1 FAILURE] Test execution exited with non-zero code ${code}.`);
    process.exit(code || 1);
  }

  // Parse stdout and stderr for any skipped tests in security directory
  const skippedMatch = stdoutBuffer.match(/(\d+)\s+skipped/i);
  if (skippedMatch && parseInt(skippedMatch[1], 10) > 0) {
    console.error(`\n[FATAL GATE 1 VIOLATION] Detected ${skippedMatch[1]} skipped test(s) in mandatory security suite!`);
    console.error('All security rules tests must execute against the live emulator without skipping.');
    process.exit(1);
  }

  // Also check for Vitest indicator of skipped files
  if (stdoutBuffer.includes('skipped (') && !stdoutBuffer.includes('0 skipped')) {
    const skippedFiles = stdoutBuffer.match(/(\d+)\s+skipped\s+\(/);
    if (skippedFiles && parseInt(skippedFiles[1], 10) > 0) {
      console.error(`\n[FATAL GATE 1 VIOLATION] Detected ${skippedFiles[1]} skipped test file(s) in security suite!`);
      process.exit(1);
    }
  }

  console.log('[GATE 1 PASS] All mandatory security tests executed. Zero tests skipped.');
  console.log('============================================================\n');
  process.exit(0);
});
