import http from 'http';

/**
 * Checks if the Firebase Firestore Emulator is running on 127.0.0.1:8080.
 */
export async function isEmulatorRunning(port = 8080, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
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
}
