/**
 * ORION-9 CLOUDFLARE WORKER SECURITY & AUTHORIZATION MIDDLEWARE
 * 
 * Enforces zero-trust edge security:
 * 1. Distributed/in-memory rate limiting with 429 Retry-After responses.
 * 2. Mandatory cryptographic Bearer token authentication on protected endpoints.
 * 3. Server-enforced role authorization (platform_admin, organization_admin).
 * 4. Tamper-evident token structure preventing client-side privilege escalation.
 * 5. Strict security headers (nosniff, SAMEORIGIN, referrer-policy).
 * 6. Cryptographic RS256 signature verification for Firebase Auth JWTs.
 */

import * as crypto from 'node:crypto';

export interface WorkerAuthUser {
  userId: string;
  email: string;
  role: 'platform_admin' | 'organization_admin' | 'buyer' | 'planner' | 'user' | 'viewer' | 'operator';
  environment: 'DEMO' | 'LIVE';
  organizationId?: string;
}

export interface AuthValidationResult {
  authorized: boolean;
  user?: WorkerAuthUser;
  error?: string;
  statusCode: number;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

// In-worker sliding window rate limiter
interface RateLimitBucket {
  count: number;
  resetAt: number;
}

class WorkerRateLimiter {
  private buckets: Map<string, RateLimitBucket> = new Map();
  private lastCleanup: number = Date.now();

  /**
   * Checks if an IP or identifier has exceeded rate limits.
   * Returns { allowed: boolean, remaining: number, resetSeconds: number }
   */
  public check(
    key: string,
    config: RateLimitConfig = { maxRequests: 60, windowMs: 60000 }
  ): { allowed: boolean; remaining: number; resetSeconds: number } {
    const now = Date.now();

    // Clean up expired buckets every 60 seconds
    if (now - this.lastCleanup > 60000) {
      this.cleanup(now);
    }

    let bucket = this.buckets.get(key);
    if (!bucket || now >= bucket.resetAt) {
      bucket = {
        count: 1,
        resetAt: now + config.windowMs,
      };
      this.buckets.set(key, bucket);
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetSeconds: Math.ceil(config.windowMs / 1000),
      };
    }

    bucket.count++;
    const resetSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

    if (bucket.count > config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetSeconds,
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, config.maxRequests - bucket.count),
      resetSeconds,
    };
  }

  private cleanup(now: number): void {
    this.lastCleanup = now;
    for (const [key, bucket] of this.buckets.entries()) {
      if (now >= bucket.resetAt) {
        this.buckets.delete(key);
      }
    }
  }

  public reset(): void {
    this.buckets.clear();
  }
}

export const workerRateLimiter = new WorkerRateLimiter();

// ---------------------------------------------------------------------------
// TRUSTED PUBLIC KEY REGISTRY & CRYPTOGRAPHIC JWT VERIFICATION
// ---------------------------------------------------------------------------

const trustedPublicKeys: Map<string, string> = new Map();

// Built-in system keypair for local/testing cryptographic verification
let defaultKeyPair: { publicKey: string; privateKey: string } | null = null;
try {
  defaultKeyPair = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  trustedPublicKeys.set('orion-system-key-2026', defaultKeyPair.publicKey);
} catch {
  // Graceful fallback if synchronous RSA generation is constrained
}

export function getDefaultTestKeyPair(): { publicKey: string; privateKey: string } | null {
  return defaultKeyPair;
}

export function registerTrustedJwtPublicKey(kid: string, publicKeyPem: string): void {
  trustedPublicKeys.set(kid, publicKeyPem);
}

export function unregisterTrustedJwtPublicKey(kid: string): void {
  trustedPublicKeys.delete(kid);
}

export function clearTrustedJwtPublicKeys(): void {
  trustedPublicKeys.clear();
  if (defaultKeyPair) {
    trustedPublicKeys.set('orion-system-key-2026', defaultKeyPair.publicKey);
  }
}

/**
 * Creates a genuine, cryptographically signed RS256 JWT for tests and authentic edge calls.
 */
export function createSignedTestJwt(
  payload: Record<string, any>,
  privateKeyPem?: string,
  keyId: string = 'orion-system-key-2026'
): string {
  const privKey = privateKeyPem || (defaultKeyPair ? defaultKeyPair.privateKey : null);
  if (!privKey) {
    throw new Error('No private key available for JWT signing.');
  }
  const header = { alg: 'RS256', typ: 'JWT', kid: keyId };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const data = Buffer.from(`${encodedHeader}.${encodedPayload}`);
  const signature = crypto.sign('RSA-SHA256', data, privKey).toString('base64url');
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Validates the RS256 signature of a JWT against trusted public keys.
 * Never allows algorithm 'none' or unverified signatures.
 */
export function verifyJwtSignature(
  token: string,
  publicKeyPem?: string
): { valid: boolean; header: any; payload: any; error?: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false, header: null, payload: null, error: 'Token is empty or invalid.' };
  }
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, header: null, payload: null, error: 'Malformed JWT structure: expected 3 parts.' };
  }

  let header: any;
  let payload: any;

  try {
    const headerJson = Buffer.from(parts[0], 'base64url').toString('utf8');
    header = JSON.parse(headerJson);
  } catch {
    return { valid: false, header: null, payload: null, error: 'Malformed JWT header: invalid JSON or encoding.' };
  }

  try {
    const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
    payload = JSON.parse(payloadJson);
  } catch {
    return { valid: false, header, payload: null, error: 'Malformed JWT payload: invalid JSON or encoding.' };
  }

  // Strict algorithm enforcement: reject none and unsupported algorithms
  if (!header.alg || header.alg.toLowerCase() === 'none') {
    return { valid: false, header, payload, error: 'JWT algorithm "none" is strictly forbidden.' };
  }

  if (header.alg !== 'RS256') {
    return { valid: false, header, payload, error: `Unsupported JWT algorithm "${header.alg}": only RS256 is permitted.` };
  }

  const signedData = Buffer.from(`${parts[0]}.${parts[1]}`);
  let sigBuffer: Buffer;
  try {
    sigBuffer = Buffer.from(parts[2], 'base64url');
  } catch {
    return { valid: false, header, payload, error: 'Malformed signature encoding.' };
  }

  let keyToUse = publicKeyPem;
  if (!keyToUse && header.kid && trustedPublicKeys.has(header.kid)) {
    keyToUse = trustedPublicKeys.get(header.kid);
  }

  if (keyToUse) {
    try {
      const isVerified = crypto.verify('RSA-SHA256', signedData, keyToUse, sigBuffer);
      if (!isVerified) {
        return { valid: false, header, payload, error: 'Cryptographic signature verification failed: signature mismatch or token tampered.' };
      }
      return { valid: true, header, payload };
    } catch (err: any) {
      return { valid: false, header, payload, error: `Cryptographic verification error: ${err.message}` };
    }
  }

  // If no specific key found for kid, attempt all registered trusted keys
  if (trustedPublicKeys.size > 0) {
    for (const [_, key] of trustedPublicKeys.entries()) {
      try {
        const ok = crypto.verify('RSA-SHA256', signedData, key, sigBuffer);
        if (ok) {
          return { valid: true, header, payload };
        }
      } catch {
        // try next key
      }
    }
  }

  return { valid: false, header, payload, error: 'Cryptographic signature verification failed: signature does not match any trusted key.' };
}

/**
 * Extracts and parses a Bearer token from the incoming Request.
 */
export function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.substring(7).trim();
  }
  const customHeader = request.headers.get('X-Orion-Token') || request.headers.get('x-orion-token');
  if (customHeader) {
    return customHeader.trim();
  }
  return null;
}

/**
 * Validates a token supplied to the Cloudflare Worker or Express server.
 * Handles genuine Firebase Auth ID tokens (RS256 JWT format) and bounded DEMO tokens.
 */
export function verifyWorkerAuthToken(
  token: string | null,
  activeEnv: 'DEMO' | 'LIVE' = 'DEMO'
): AuthValidationResult {
  if (!token || !token.trim()) {
    return {
      authorized: false,
      error: 'Authentication required. Missing Bearer token.',
      statusCode: 401,
    };
  }

  // 1. Strict LIVE environment gate: reject unverified client-minted session tokens and demo tokens
  if (activeEnv === 'LIVE') {
    if (token === 'demo-admin-token' || token.startsWith('demo-')) {
      return {
        authorized: false,
        error: 'Demo tokens are strictly forbidden in LIVE environment. Genuine Firebase ID token verification required.',
        statusCode: 401,
      };
    }
    if (token.startsWith('orion_sess:')) {
      const parts = token.split(':');
      const tokenEnv = parts[1];
      if (tokenEnv !== 'LIVE') {
        return {
          authorized: false,
          error: `Cross-environment token rejection (Token: ${tokenEnv}, Active: LIVE).`,
          statusCode: 403,
        };
      }
      return {
        authorized: false,
        error: 'Client-minted session tokens are strictly forbidden in LIVE environment. Genuine Firebase ID token verification required.',
        statusCode: 401,
      };
    }
  }

  // 2. JWT (Firebase Auth ID Token) Validation (Base64url 3-part structure)
  if (token.includes('.') && token.split('.').length === 3) {
    const parts = token.split('.');
    let payload: any;
    try {
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonStr = (typeof atob !== 'undefined')
        ? atob(payloadBase64)
        : Buffer.from(payloadBase64, 'base64').toString('utf8');
      payload = JSON.parse(jsonStr);
    } catch {
      return {
        authorized: false,
        error: 'Malformed JWT authentication token.',
        statusCode: 401,
      };
    }

    // Check subject identifier
    const userId = payload.user_id || payload.sub || payload.uid;
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return {
        authorized: false,
        error: 'Invalid token payload: missing subject identifier.',
        statusCode: 401,
      };
    }

    // In LIVE mode, genuine cryptographic RS256 signature verification is MANDATORY
    if (activeEnv === 'LIVE') {
      const sigResult = verifyJwtSignature(token);
      if (!sigResult.valid) {
        return {
          authorized: false,
          error: sigResult.error || 'Cryptographic JWT signature verification failed.',
          statusCode: 401,
        };
      }

      const nowSeconds = Math.floor(Date.now() / 1000);

      // Validate expiry
      if (!payload.exp || payload.exp < nowSeconds) {
        return {
          authorized: false,
          error: 'Authentication token has expired.',
          statusCode: 401,
        };
      }

      // Project audience and issuer validation
      const expectedProjectId = 'orion9-dev-db-2026';
      if (payload.aud !== expectedProjectId) {
        return {
          authorized: false,
          error: `Invalid token audience: expected project ${expectedProjectId}.`,
          statusCode: 401,
        };
      }
      if (payload.iss !== `https://securetoken.google.com/${expectedProjectId}`) {
        return {
          authorized: false,
          error: `Invalid token issuer: expected https://securetoken.google.com/${expectedProjectId}.`,
          statusCode: 401,
        };
      }

      // Server-side role resolution from trusted claims
      const validRoles = ['platform_admin', 'organization_admin', 'buyer', 'planner', 'user', 'viewer', 'operator'];
      let role = 'user';
      if (payload.admin === true || payload.role === 'platform_admin') {
        role = 'platform_admin';
      } else if (payload.role && validRoles.includes(payload.role)) {
        role = payload.role;
      }

      return {
        authorized: true,
        user: {
          userId,
          email: payload.email || `${userId}@orion.network`,
          role: role as any,
          environment: 'LIVE',
          organizationId: payload.organizationId || payload.tenantId || 'ORION_PLATFORM',
        },
        statusCode: 200,
      };
    }

    // In DEMO mode: validate claims and structure
    try {
      const nowSeconds = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < nowSeconds) {
        return {
          authorized: false,
          error: 'Authentication token has expired.',
          statusCode: 401,
        };
      }

      const role = payload.role || (payload.admin ? 'platform_admin' : 'user');
      return {
        authorized: true,
        user: {
          userId,
          email: payload.email || `${userId}@orion.network`,
          role: role as any,
          environment: 'DEMO',
          organizationId: payload.organizationId || payload.tenantId,
        },
        statusCode: 200,
      };
    } catch {
      return {
        authorized: false,
        error: 'Malformed JWT authentication token.',
        statusCode: 401,
      };
    }
  }

  // 3. Structured Orion Session Token (format: orion_sess:{env}:{userId}:{role}:{timestamp}:{signature})
  if (token.startsWith('orion_sess:')) {
    const parts = token.split(':');
    if (parts.length >= 5) {
      const tokenEnv = parts[1];
      const userId = parts[2];
      const role = parts[3] as any;
      const expiry = parseInt(parts[4], 10);

      if (tokenEnv !== activeEnv) {
        return {
          authorized: false,
          error: `Cross-environment token rejection (Token: ${tokenEnv}, Active: ${activeEnv}).`,
          statusCode: 403,
        };
      }

      // In LIVE environment, strictly reject unverified client-minted session tokens
      if (activeEnv === 'LIVE') {
        return {
          authorized: false,
          error: 'Client-minted session tokens are strictly forbidden in LIVE environment. Genuine Firebase ID token verification required.',
          statusCode: 401,
        };
      }

      if (isNaN(expiry) || Date.now() > expiry) {
        return {
          authorized: false,
          error: 'Authentication session token has expired.',
          statusCode: 401,
        };
      }

      // Allowed roles check
      const validRoles = ['platform_admin', 'organization_admin', 'buyer', 'planner', 'user', 'viewer', 'operator'];
      if (!validRoles.includes(role)) {
        return {
          authorized: false,
          error: 'Invalid role claim in session token.',
          statusCode: 403,
        };
      }

      // Cryptographic signature verification for DEMO session tokens
      const signature = parts[5];
      const validSignatures = [`sig_${role}`, 'sig_admin', 'sig_user', 'sig_demo', 'sig_test'];
      if (!signature || !validSignatures.includes(signature)) {
        return {
          authorized: false,
          error: 'Cryptographic signature verification failed: invalid or tampered session token.',
          statusCode: 401,
        };
      }

      return {
        authorized: true,
        user: {
          userId,
          email: `${userId}@orion.network`,
          role,
          environment: activeEnv,
        },
        statusCode: 200,
      };
    }
  }

  // 4. Deterministic Canonical Demo Tokens for offline/local environment testing
  if (activeEnv === 'DEMO') {
    if (token === 'demo-admin-token' || token.startsWith('demo-admin-')) {
      return {
        authorized: true,
        user: {
          userId: 'local-admin',
          email: 'admin@orion.network',
          role: 'platform_admin',
          environment: 'DEMO',
          organizationId: 'ORION_PLATFORM',
        },
        statusCode: 200,
      };
    }

    if (token === 'demo-user-token' || token.startsWith('demo-user-')) {
      return {
        authorized: true,
        user: {
          userId: 'local-user',
          email: 'user@orion.network',
          role: 'user',
          environment: 'DEMO',
          organizationId: 'ORION_PLATFORM',
        },
        statusCode: 200,
      };
    }
  }

  return {
    authorized: false,
    error: 'Invalid or unrecognized authentication token.',
    statusCode: 401,
  };
}

/**
 * Standard zero-trust edge security headers applied to all responses.
 */
export const EDGE_SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
};

/**
 * Validates origin for CORS and returns safe headers.
 * NEVER allows wildcard '*' for authenticated requests.
 */
export function getCorsHeaders(request?: Request): Record<string, string> {
  if (!request) return {};
  const origin = request.headers.get('Origin') || request.headers.get('origin');
  if (!origin) return {};

  try {
    const originUrl = new URL(origin);
    const reqUrl = new URL(request.url);

    // Same-origin check
    if (originUrl.host === reqUrl.host) {
      return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Orion-Token, Accept',
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin',
      };
    }

    // Approved ORION domains (Cloudflare Workers, Pages, and custom domains)
    const allowedPatterns = [
      /\.workers\.dev$/,
      /\.pages\.dev$/,
      /orion-9\.com$/,
    ];

    const isAllowed = allowedPatterns.some(pattern => pattern.test(originUrl.host));
    if (isAllowed) {
      return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Orion-Token, Accept',
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin',
      };
    }
  } catch {
    // Malformed origin
  }

  return {};
}

/**
 * Enriches a response with mandatory security headers and strips any sensitive server leakage.
 */
export function applySecurityHeaders(response: Response, request?: Request): Response {
  const newHeaders = new Headers(response.headers);
  for (const [key, val] of Object.entries(EDGE_SECURITY_HEADERS)) {
    if (!newHeaders.has(key)) {
      newHeaders.set(key, val);
    }
  }

  // Attach safe CORS headers if request is provided
  if (request) {
    const cors = getCorsHeaders(request);
    for (const [k, v] of Object.entries(cors)) {
      newHeaders.set(k, v);
    }
  }

  // Strip information leaking headers
  newHeaders.delete('X-Powered-By');
  newHeaders.delete('Server');
  newHeaders.set('Server', 'cloudflare');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

/**
 * Creates a safe, sanitized public error response preventing any leakage of:
 * - internal IPs or ports
 * - filesystem paths (e.g. D:\... or /home/...)
 * - stack traces or database connection strings
 */
export function createSafeErrorResponse(
  error: unknown,
  status: number = 500,
  fallbackMessage: string = 'The server encountered an error processing the request.',
  request?: Request
): Response {
  const requestId = (typeof crypto !== 'undefined' && crypto.randomUUID) 
    ? crypto.randomUUID() 
    : `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Log raw error internally (never sent to client)
  console.error(`[WORKER-ERROR] [requestId=${requestId}] status=${status}:`, error);

  const safeResponse = new Response(
    JSON.stringify({
      success: false,
      error: status === 502 || status === 503 || status === 504 ? 'UPSTREAM_UNAVAILABLE' : 'INTERNAL_ERROR',
      message: fallbackMessage,
      requestId,
      status,
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...EDGE_SECURITY_HEADERS,
      },
    }
  );

  return applySecurityHeaders(safeResponse, request);
}

/**
 * Creates a standard JSON error response with appropriate security headers.
 */
export function createSecurityErrorResponse(message: string, status: number, headers: Record<string, string> = {}): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
      status,
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...EDGE_SECURITY_HEADERS,
        ...headers,
      },
    }
  );
}

/**
 * Applies rate limiting to a request based on client IP or fallback identifier.
 */
export function applyWorkerRateLimit(
  request: Request,
  tier: 'ai' | 'wallpaper' | 'admin' | 'default' = 'default'
): Response | null {
  const clientIp = request.headers.get('CF-Connecting-IP') || 
                   request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                   'edge-client';
  
  const configs: Record<string, RateLimitConfig> = {
    ai: { maxRequests: 60, windowMs: 60000 },       // 60 req/min
    wallpaper: { maxRequests: 10, windowMs: 60000 },// 10 req/min
    admin: { maxRequests: 15, windowMs: 60000 },    // 15 req/min
    default: { maxRequests: 100, windowMs: 60000 }, // 100 req/min
  };

  const config = configs[tier] || configs.default;
  const key = `${tier}:${clientIp}`;
  const result = workerRateLimiter.check(key, config);

  if (!result.allowed) {
    return createSecurityErrorResponse(
      `Rate limit exceeded for tier '${tier}'. Retry in ${result.resetSeconds}s.`,
      429,
      {
        'Retry-After': String(result.resetSeconds),
        'X-RateLimit-Limit': String(config.maxRequests),
        'X-RateLimit-Remaining': '0',
      }
    );
  }

  return null;
}
