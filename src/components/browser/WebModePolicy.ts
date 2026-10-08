/**
 * ORION-9 BROWSER WEB MODE POLICY
 * 
 * Canonical security and embedding policy for ORION-9 Web Mode (Chrome / Brave / Firefox / Safari).
 * 
 * ARCHITECTURAL RATIONALE:
 * A standard web application running inside an operating system browser cannot reliably inspect
 * or override remote server response headers such as X-Frame-Options or Content-Security-Policy (CSP)
 * frame-ancestors. Remote platforms (Google, GitHub, Wikipedia, YouTube, Microsoft, etc.) explicitly
 * forbid being framed within third-party contexts for clickjacking protection.
 * 
 * Attempting to bypass this via arbitrary server proxies or CORS-stripping introduces serious security
 * vulnerabilities (SSRF, credential leakage, origin confusion).
 * 
 * Therefore, ORION-9 Web Mode operates as a controlled, honest compatibility viewer:
 * 1. INTERNAL_ORION: Internal OS routes and system pages rendered via native React components.
 * 2. EMBED_ALLOWED: Explicitly approved destinations with verified iframe embedding support.
 * 3. EXTERNAL_REQUIRED: Unknown arbitrary public websites that control their own framing policies.
 *    ORION-9 Web Mode does NOT mount an iframe for these destinations, preventing browser-level
 *    framing errors and offering an honest, polished "Open Externally" workflow instead.
 * 4. INVALID: Malformed URLs or dangerous/unsupported protocols (javascript:, data:, file:, blob:).
 */

import { validateBrowserUrl } from './BrowserSecurity';

export type WebModePolicyDecision = 
  | 'INTERNAL_ORION'
  | 'EMBED_ALLOWED'
  | 'EXTERNAL_REQUIRED'
  | 'INVALID';

export interface WebModePolicyResult {
  decision: WebModePolicyDecision;
  url: string;
  normalizedUrl: string;
  hostname?: string;
  origin?: string;
  displayName: string;
  reason: string;
  iframeAllowed: boolean;
}

/**
 * Explicit list of approved web origins that permit embedded iframe presentation
 * within ORION-9 Web Mode.
 */
export const EMBEDDABLE_WEB_ORIGINS: readonly string[] = [
  'https://example.com',
  'https://www.example.com',
  'https://example.org',
  'https://www.example.org',
  'https://example.net',
  'https://www.example.net',
  'https://orion9.tech',
  'https://preview.orion9.tech',
];

/**
 * Checks whether an origin is explicitly approved for iframe embedding.
 */
export function isEmbeddableOrigin(url: string): boolean {
  try {
    const parsed = new URL(url);
    const origin = parsed.origin.toLowerCase();
    const hostname = parsed.hostname.toLowerCase();

    // Direct match against approved origins
    if (EMBEDDABLE_WEB_ORIGINS.some(allowed => allowed.toLowerCase() === origin)) {
      return true;
    }

    // Match hostname variations for example.com/org/net
    if (
      hostname === 'example.com' || 
      hostname === 'www.example.com' ||
      hostname === 'example.org' ||
      hostname === 'example.net'
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Evaluates the authoritative Web Mode policy for a target address.
 */
export function resolveWebModePolicy(
  targetUrl: string,
  options?: { isHttpsHost?: boolean }
): WebModePolicyResult {
  const trimmed = (targetUrl || '').trim();

  // 1. Internal Orion schemes and system pages
  if (
    !trimmed || 
    trimmed === 'orion://newtab' || 
    trimmed === 'about:blank' || 
    trimmed === 'about:newtab' || 
    trimmed.startsWith('orion://') || 
    trimmed.startsWith('about:') || 
    trimmed.startsWith('/')
  ) {
    return {
      decision: 'INTERNAL_ORION',
      url: trimmed || 'orion://newtab',
      normalizedUrl: trimmed || 'orion://newtab',
      displayName: 'Orion Workspace',
      reason: 'Internal Orion system page rendered natively within the OS shell.',
      iframeAllowed: false,
    };
  }

  // 2. Validate scheme and structural validity
  const validation = validateBrowserUrl(trimmed);
  if (!validation.valid) {
    return {
      decision: 'INVALID',
      url: trimmed,
      normalizedUrl: trimmed,
      displayName: 'Invalid Address',
      reason: validation.error || 'The entered address contains an unsupported or dangerous protocol.',
      iframeAllowed: false,
    };
  }

  const normalizedUrl = validation.normalizedUrl;

  // Extract hostname and display name safely
  let parsed: URL;
  try {
    parsed = new URL(normalizedUrl);
  } catch {
    return {
      decision: 'INVALID',
      url: trimmed,
      normalizedUrl,
      displayName: 'Invalid URL',
      reason: 'The target address could not be parsed into a structurally valid URL.',
      iframeAllowed: false,
    };
  }

  const hostname = parsed.hostname;
  const origin = parsed.origin;
  const displayName = hostname.replace(/^www\./, '');

  // 3. Mixed Content Check: Insecure HTTP requests blocked within HTTPS hosts
  const isHostHttps = options?.isHttpsHost ?? (typeof window !== 'undefined' && window.location?.protocol === 'https:');
  if (isHostHttps && parsed.protocol === 'http:') {
    return {
      decision: 'EXTERNAL_REQUIRED',
      url: trimmed,
      normalizedUrl,
      hostname,
      origin,
      displayName,
      reason: `Mixed Content Restriction: Insecure HTTP addresses (${hostname}) cannot be embedded within a secure HTTPS origin. Modern browsers block mixed active content.`,
      iframeAllowed: false,
    };
  }

  // 4. Check against explicit embeddable origins
  if (isEmbeddableOrigin(normalizedUrl)) {
    // If target is HTTP but parent is HTTPS, it was caught by mixed content check above
    if (parsed.protocol === 'http:' && isHostHttps) {
      return {
        decision: 'EXTERNAL_REQUIRED',
        url: trimmed,
        normalizedUrl,
        hostname,
        origin,
        displayName,
        reason: 'Mixed Content Restriction: Insecure HTTP frames cannot be embedded in an HTTPS application.',
        iframeAllowed: false,
      };
    }

    return {
      decision: 'EMBED_ALLOWED',
      url: trimmed,
      normalizedUrl,
      hostname,
      origin,
      displayName,
      reason: 'Destination origin is explicitly approved for embedded iframe presentation.',
      iframeAllowed: true,
    };
  }

  // 5. Unknown arbitrary public website: Require external window
  return {
    decision: 'EXTERNAL_REQUIRED',
    url: trimmed,
    normalizedUrl,
    hostname,
    origin,
    displayName,
    reason: `${displayName} controls its own embedding security policy (X-Frame-Options/CSP). ORION-9 Web Mode does not load unauthorized cross-origin frames.`,
    iframeAllowed: false,
  };
}
