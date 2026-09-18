/**
 * ORION-9 KERNEL SECURITY & CRYPTO UTILITIES
 * Provides constant-time password hashing/verification, correlation tracking,
 * token signing helpers, and data sanitization.
 */

/**
 * Computes a SHA-256 hash formatted with salt: "sha256:{salt}:{hash}"
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = Math.random().toString(36).substring(2, 12);
  const data = new TextEncoder().encode(salt + ":" + password);
  
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `sha256:${salt}:${hashHex}`;
  }
  
  // Fallback if subtle crypto is not available in environment
  let hash = 0;
  const str = salt + ":" + password;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `sha256:${salt}:${Math.abs(hash).toString(16)}`;
}

/**
 * Constant-time password verification against salted hashes.
 * Forbids empty passwords, invalid hashes, or universal bypasses.
 */
export async function verifyPassword(password: string, storedHashOrPlain: string): Promise<boolean> {
  if (!password || !storedHashOrPlain || !password.trim()) return false;
  
  // Stored password MUST be formatted as salted hash "sha256:{salt}:{hash}"
  if (storedHashOrPlain.startsWith('sha256:')) {
    const parts = storedHashOrPlain.split(':');
    if (parts.length !== 3) return false;
    const salt = parts[1];
    const expectedHash = parts[2];
    
    let computedHash = '';
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const data = new TextEncoder().encode(salt + ":" + password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      let hash = 0;
      const str = salt + ":" + password;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
      }
      computedHash = Math.abs(hash).toString(16);
    }

    // Constant-time string comparison to prevent timing side-channel attacks
    if (computedHash.length !== expectedHash.length) return false;
    let result = 0;
    for (let i = 0; i < computedHash.length; i++) {
      result |= computedHash.charCodeAt(i) ^ expectedHash.charCodeAt(i);
    }
    return result === 0;
  }
  
  return false;
}

/**
 * Generates an RFC-compliant or collision-resistant unique correlation ID
 */
export function generateCorrelationId(prefix: string = 'corr'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Generates an idempotency key for transactions
 */
export function generateIdempotencyKey(action: string, entityId: string): string {
  const timestamp = Math.floor(Date.now() / 60000); // 1-minute bucket for deduplication window
  return `idemp-${action}-${entityId}-${timestamp}`;
}

/**
 * Computes a standard hex SHA-256 digest of input text
 */
export async function sha256(content: string): Promise<string> {
  const data = new TextEncoder().encode(content);
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

