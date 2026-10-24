import { describe, it, expect } from 'vitest';
import { hmacSha256, hmacSha256WebCrypto, timingSafeEqualStr } from '../../kernel/security/crypto';

describe('Standard Cryptographic Test Vectors & Timing-Safe Equality', () => {
  it('passes RFC 4231 Test Case 2 (ASCII string key and message)', async () => {
    const key = 'Jefe';
    const message = 'what do ya want for nothing?';
    const expected = '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843';

    const syncResult = hmacSha256(key, message);
    expect(syncResult).toBe(expected);

    const asyncWebCryptoResult = await hmacSha256WebCrypto(key, message);
    expect(asyncWebCryptoResult).toBe(expected);
  });

  it('passes RFC 4231 Test Case 7 (Key larger than block size 131 bytes of 0xaa)', async () => {
    const key = new Uint8Array(131).fill(0xaa);
    const message = 'Test Using Larger Than Block-Size Key and Larger Than One Block-Size Data';
    const expected = 'c9731f25665706dab8200d9ce68fad2cbac48efc4a5f72292e4eeb81e7d29298';

    const syncResult = hmacSha256(key, message);
    expect(syncResult).toBe(expected);

    const asyncWebCryptoResult = await hmacSha256WebCrypto(key, message);
    expect(asyncWebCryptoResult).toBe(expected);
  });

  it('correctly compares strings in constant time without early length returns', () => {
    const secret = 'd4c1b92019483756281938571029384756102938475610293847561029384756';
    const exactMatch = 'd4c1b92019483756281938571029384756102938475610293847561029384756';
    const wrongLength = 'd4c1b9201948375628193857102938475610293847561029384756102938475';
    const wrongChar = 'd4c1b92019483756281938571029384756102938475610293847561029384757';

    expect(timingSafeEqualStr(secret, exactMatch)).toBe(true);
    expect(timingSafeEqualStr(secret, wrongLength)).toBe(false);
    expect(timingSafeEqualStr(secret, wrongChar)).toBe(false);
    expect(timingSafeEqualStr('', '')).toBe(true);
    expect(timingSafeEqualStr('a', '')).toBe(false);
    expect(timingSafeEqualStr('', 'b')).toBe(false);
  });
});
