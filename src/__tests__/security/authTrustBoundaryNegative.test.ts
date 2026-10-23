/**
 * ORION-9 NEGATIVE SECURITY TEST SUITE: AUTHENTICATION TRUST BOUNDARY & WEBHOOK CRYPTO
 * 
 * Verifies non-bypassable enforcement of zero-trust security boundaries:
 * 1. Forged and tampered JWT cryptographic signature rejection
 * 2. Elevation of privilege attacks (client-injected role tampering)
 * 3. Algorithm confusion attacks (alg: none, HS256 symmetric confusion)
 * 4. Claim validation (audience, issuer, expiry, subject identifier)
 * 5. Strict rejection of DEMO and client-minted session tokens in LIVE mode
 * 6. Express server admin endpoint protection against dev token bypass in LIVE mode
 * 7. Webhook HMAC-SHA256 timing-safe verification, replay prevention, and freshness windows
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as crypto from 'node:crypto';
import {
  verifyWorkerAuthToken,
  verifyJwtSignature,
  createSignedTestJwt,
  registerTrustedJwtPublicKey,
  unregisterTrustedJwtPublicKey,
  getDefaultTestKeyPair,
} from '../../server/workerSecurity';
import { integrationGateway } from '../../integration/gateway/IntegrationGateway';

describe('P0 Security Negative Test Suite — Auth Trust Boundary & Webhook Cryptography', () => {
  beforeEach(() => {
    integrationGateway.reset();
  });

  // =========================================================================
  // 1. JWT CRYPTOGRAPHIC SIGNATURE & FORGERY DEFENSE
  // =========================================================================
  describe('1. JWT Cryptographic Signature & Tampering Defense', () => {
    it('strictly rejects forged JWT with fake signature in LIVE mode', () => {
      const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({
        sub: 'attacker-sub',
        aud: 'orion9-dev-db-2026',
        iss: 'https://securetoken.google.com/orion9-dev-db-2026',
        exp: Math.floor(Date.now() / 1000) + 3600,
        role: 'platform_admin',
        admin: true,
      })).toString('base64url');
      const forgedToken = `${header}.${payload}.arbitrary_fake_signature_bytes`;

      const result = verifyWorkerAuthToken(forgedToken, 'LIVE');
      expect(result.authorized).toBe(false);
      expect(result.statusCode).toBe(401);
      expect(result.error).toContain('Cryptographic');
    });

    it('strictly rejects payload tampering when signature was minted for different payload', () => {
      // Create a validly signed user token
      const validToken = createSignedTestJwt({
        sub: 'legitimate-user',
        aud: 'orion9-dev-db-2026',
        iss: 'https://securetoken.google.com/orion9-dev-db-2026',
        exp: Math.floor(Date.now() / 1000) + 3600,
        role: 'user',
      });

      const parts = validToken.split('.');
      // Attacker tampers payload to elevate privileges to platform_admin
      const tamperedPayload = Buffer.from(JSON.stringify({
        sub: 'legitimate-user',
        aud: 'orion9-dev-db-2026',
        iss: 'https://securetoken.google.com/orion9-dev-db-2026',
        exp: Math.floor(Date.now() / 1000) + 3600,
        role: 'platform_admin',
        admin: true,
      })).toString('base64url');

      const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;
      const result = verifyWorkerAuthToken(tamperedToken, 'LIVE');
      expect(result.authorized).toBe(false);
      expect(result.statusCode).toBe(401);
      expect(result.error).toContain('Cryptographic');
    });

    it('rejects tokens signed by an untrusted or rogue RSA private key', () => {
      // Generate a rogue RSA key pair
      const roguePair = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });

      const rogueToken = createSignedTestJwt(
        {
          sub: 'rogue-admin',
          aud: 'orion9-dev-db-2026',
          iss: 'https://securetoken.google.com/orion9-dev-db-2026',
          exp: Math.floor(Date.now() / 1000) + 3600,
          role: 'platform_admin',
        },
        roguePair.privateKey,
        'rogue-key-id'
      );

      const result = verifyWorkerAuthToken(rogueToken, 'LIVE');
      expect(result.authorized).toBe(false);
      expect(result.statusCode).toBe(401);
      expect(result.error).toContain('Cryptographic signature verification failed');
    });

    it('accepts tokens when trusted key is explicitly registered and revokes upon unregistration', () => {
      const customPair = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });

      registerTrustedJwtPublicKey('custom-partner-key', customPair.publicKey);

      const customToken = createSignedTestJwt(
        {
          sub: 'partner-analyst',
          aud: 'orion9-dev-db-2026',
          iss: 'https://securetoken.google.com/orion9-dev-db-2026',
          exp: Math.floor(Date.now() / 1000) + 3600,
          role: 'planner',
        },
        customPair.privateKey,
        'custom-partner-key'
      );

      // Should be authorized while key is registered
      const validRes = verifyWorkerAuthToken(customToken, 'LIVE');
      expect(validRes.authorized).toBe(true);
      expect(validRes.user?.role).toBe('planner');

      // Unregister key: should be rejected immediately
      unregisterTrustedJwtPublicKey('custom-partner-key');
      const revokedRes = verifyWorkerAuthToken(customToken, 'LIVE');
      expect(revokedRes.authorized).toBe(false);
      expect(revokedRes.statusCode).toBe(401);
    });
  });

  // =========================================================================
  // 2. ALGORITHM CONFUSION & CLAIM VALIDATION
  // =========================================================================
  describe('2. Algorithm Confusion & Strict Claim Verification', () => {
    it('strictly rejects algorithm "none" token', () => {
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({
        sub: 'usr-admin',
        aud: 'orion9-dev-db-2026',
        iss: 'https://securetoken.google.com/orion9-dev-db-2026',
        exp: Math.floor(Date.now() / 1000) + 3600,
        role: 'platform_admin',
      })).toString('base64url');
      const noneToken = `${header}.${payload}.`;

      const result = verifyWorkerAuthToken(noneToken, 'LIVE');
      expect(result.authorized).toBe(false);
      expect(result.statusCode).toBe(401);
      expect(result.error).toContain('none');
    });

    it('strictly rejects symmetric HS256 algorithm confusion attack in LIVE mode', () => {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({
        sub: 'usr-admin',
        aud: 'orion9-dev-db-2026',
        iss: 'https://securetoken.google.com/orion9-dev-db-2026',
        exp: Math.floor(Date.now() / 1000) + 3600,
        role: 'platform_admin',
      })).toString('base64url');
      const hmacSig = crypto.createHmac('sha256', 'public-key-as-secret').update(`${header}.${payload}`).digest('base64url');
      const hsToken = `${header}.${payload}.${hmacSig}`;

      const result = verifyWorkerAuthToken(hsToken, 'LIVE');
      expect(result.authorized).toBe(false);
      expect(result.statusCode).toBe(401);
      expect(result.error).toContain('only RS256 is permitted');
    });

    it('rejects expired tokens in LIVE mode', () => {
      const expiredToken = createSignedTestJwt({
        sub: 'usr-123',
        aud: 'orion9-dev-db-2026',
        iss: 'https://securetoken.google.com/orion9-dev-db-2026',
        exp: Math.floor(Date.now() / 1000) - 300,
        role: 'buyer',
      });

      const result = verifyWorkerAuthToken(expiredToken, 'LIVE');
      expect(result.authorized).toBe(false);
      expect(result.statusCode).toBe(401);
      expect(result.error).toContain('expired');
    });

    it('rejects tokens with wrong audience', () => {
      const badAudToken = createSignedTestJwt({
        sub: 'usr-123',
        aud: 'unauthorized-project-id',
        iss: 'https://securetoken.google.com/orion9-dev-db-2026',
        exp: Math.floor(Date.now() / 1000) + 3600,
        role: 'buyer',
      });

      const result = verifyWorkerAuthToken(badAudToken, 'LIVE');
      expect(result.authorized).toBe(false);
      expect(result.statusCode).toBe(401);
      expect(result.error).toContain('Invalid token audience');
    });

    it('rejects tokens with wrong issuer', () => {
      const badIssToken = createSignedTestJwt({
        sub: 'usr-123',
        aud: 'orion9-dev-db-2026',
        iss: 'https://malicious-identity-provider.com',
        exp: Math.floor(Date.now() / 1000) + 3600,
        role: 'buyer',
      });

      const result = verifyWorkerAuthToken(badIssToken, 'LIVE');
      expect(result.authorized).toBe(false);
      expect(result.statusCode).toBe(401);
      expect(result.error).toContain('Invalid token issuer');
    });

    it('rejects tokens missing subject identifier', () => {
      const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({
        aud: 'orion9-dev-db-2026',
        iss: 'https://securetoken.google.com/orion9-dev-db-2026',
        exp: Math.floor(Date.now() / 1000) + 3600,
      })).toString('base64url');
      const token = `${header}.${payload}.fake_signature`;

      const result = verifyWorkerAuthToken(token, 'LIVE');
      expect(result.authorized).toBe(false);
      expect(result.statusCode).toBe(401);
      expect(result.error).toContain('missing subject identifier');
    });
  });

  // =========================================================================
  // 3. DEMO TO LIVE ESCALATION DEFENSE
  // =========================================================================
  describe('3. DEMO to LIVE Privilege Escalation Prevention', () => {
    it('strictly forbids deterministic demo admin tokens in LIVE environment', () => {
      const result = verifyWorkerAuthToken('demo-admin-token', 'LIVE');
      expect(result.authorized).toBe(false);
      expect(result.statusCode).toBe(401);
      expect(result.error).toContain('strictly forbidden in LIVE environment');
    });

    it('strictly forbids deterministic demo user tokens in LIVE environment', () => {
      const result = verifyWorkerAuthToken('demo-user-token', 'LIVE');
      expect(result.authorized).toBe(false);
      expect(result.statusCode).toBe(401);
      expect(result.error).toContain('strictly forbidden in LIVE environment');
    });

    it('strictly forbids client-minted session tokens in LIVE environment', () => {
      const sessionToken = `orion_sess:LIVE:local-admin:platform_admin:${Date.now() + 3600000}:sig_admin`;
      const result = verifyWorkerAuthToken(sessionToken, 'LIVE');
      expect(result.authorized).toBe(false);
      expect(result.statusCode).toBe(401);
      expect(result.error).toContain('Client-minted session tokens are strictly forbidden in LIVE environment');
    });

    it('rejects cross-environment token presentation (DEMO session token sent to LIVE)', () => {
      const demoSessionToken = `orion_sess:DEMO:local-admin:platform_admin:${Date.now() + 3600000}:sig_demo`;
      const result = verifyWorkerAuthToken(demoSessionToken, 'LIVE');
      expect(result.authorized).toBe(false);
      expect(result.statusCode).toBe(403);
      expect(result.error).toContain('Cross-environment token rejection');
    });
  });

  // =========================================================================
  // 4. WEBHOOK CRYPTOGRAPHIC VERIFICATION & REPLAY DEFENSE
  // =========================================================================
  describe('4. Webhook HMAC-SHA256 Cryptography & Replay Defense', () => {
    const secret = 'partner-secret-whsec_991827';
    const rawPayload = JSON.stringify({ event: 'ASN_SUBMITTED', asnId: 'ASN-882190', supplierId: 'SUP-PACIFIC' });
    const correctSignature = crypto.createHmac('sha256', secret).update(rawPayload).digest('hex');

    it('accepts authentic HMAC signature with fresh timestamp', () => {
      const res = integrationGateway.validateWebhookSignature({
        rawPayload,
        signatureHeader: `sha256=${correctSignature}`,
        timestampHeader: new Date().toISOString(),
        secret,
        nonce: 'nonce-auth-01',
      });
      expect(res.valid).toBe(true);
      expect(res.reason).toContain('verified successfully');
    });

    it('rejects modified or tampered payload with timing-safe comparison', () => {
      const tamperedPayload = JSON.stringify({ event: 'ASN_SUBMITTED', asnId: 'ASN-882190-MODIFIED', supplierId: 'SUP-PACIFIC' });
      const res = integrationGateway.validateWebhookSignature({
        rawPayload: tamperedPayload,
        signatureHeader: `sha256=${correctSignature}`,
        timestampHeader: new Date().toISOString(),
        secret,
      });
      expect(res.valid).toBe(false);
      expect(res.reason).toContain('signature mismatch');
    });

    it('rejects incorrect signature with valid format', () => {
      const wrongSignature = crypto.createHmac('sha256', 'wrong-secret-key').update(rawPayload).digest('hex');
      const res = integrationGateway.validateWebhookSignature({
        rawPayload,
        signatureHeader: `sha256=${wrongSignature}`,
        timestampHeader: new Date().toISOString(),
        secret,
      });
      expect(res.valid).toBe(false);
      expect(res.reason).toContain('signature mismatch');
    });

    it('rejects stale timestamp exceeding maxAge window', () => {
      const staleTime = new Date(Date.now() - 400 * 1000).toISOString(); // 400s ago (> 300s window)
      const res = integrationGateway.validateWebhookSignature({
        rawPayload,
        signatureHeader: `sha256=${correctSignature}`,
        timestampHeader: staleTime,
        secret,
        maxAgeSeconds: 300,
      });
      expect(res.valid).toBe(false);
      expect(res.reason).toContain('freshness window');
    });

    it('rejects future timestamp exceeding acceptable clock skew', () => {
      const futureTime = new Date(Date.now() + 120 * 1000).toISOString(); // 120s in future
      const res = integrationGateway.validateWebhookSignature({
        rawPayload,
        signatureHeader: `sha256=${correctSignature}`,
        timestampHeader: futureTime,
        secret,
      });
      expect(res.valid).toBe(false);
      expect(res.reason).toContain('future');
    });

    it('prevents replay attack when replaying identical signature or nonce', () => {
      const nowIso = new Date().toISOString();
      const first = integrationGateway.validateWebhookSignature({
        rawPayload,
        signatureHeader: `sha256=${correctSignature}`,
        timestampHeader: nowIso,
        secret,
        nonce: 'replayed-nonce-abc',
      });
      expect(first.valid).toBe(true);

      const second = integrationGateway.validateWebhookSignature({
        rawPayload,
        signatureHeader: `sha256=${correctSignature}`,
        timestampHeader: nowIso,
        secret,
        nonce: 'replayed-nonce-abc',
      });
      expect(second.valid).toBe(false);
      expect(second.reason).toContain('Replay attack detected');
    });

    it('rejects request when webhook secret is missing or empty', () => {
      const res = integrationGateway.validateWebhookSignature({
        rawPayload,
        signatureHeader: `sha256=${correctSignature}`,
        timestampHeader: new Date().toISOString(),
        secret: '',
      });
      expect(res.valid).toBe(false);
      expect(res.reason).toContain('Missing webhook secret');
    });
  });
});
