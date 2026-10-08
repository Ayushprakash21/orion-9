import http from 'http';

/**
 * Checks if the Firebase Firestore Emulator is running on 127.0.0.1:8080.
 * In mandatory security test mode (FIREBASE_EMULATOR_REQUIRED=true),
 * fails immediately if the emulator is not reachable so tests can never silently skip.
 */
export async function isEmulatorRunning(port = 8080, host = '127.0.0.1'): Promise<boolean> {
  const online = await new Promise<boolean>((resolve) => {
    const req = http.request(
      {
        host,
        port,
        method: 'GET',
        path: '/',
        timeout: 300,
      },
      (res) => {
        resolve(true);
      }
    );

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });

  if (!online && process.env.FIREBASE_EMULATOR_REQUIRED === 'true') {
    throw new Error(
      `[MANDATORY SECURITY GATE 1 VIOLATION] Firebase Emulator on ${host}:${port} is REQUIRED, but was offline. Silently skipping security tests is strictly prohibited.`
    );
  }

  return online;
}
