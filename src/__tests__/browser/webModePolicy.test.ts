/**
 * ORION-9 BROWSER WEB MODE POLICY & SECURITY AUDIT TEST SUITE
 * 
 * Verifies the 7 Mandatory Web Mode Security Rules:
 * Test 1: example.com -> Approved embed origin, iframe permitted, decision: EMBED_ALLOWED
 * Test 2: google.com -> Non-embeddable public origin, iframe forbidden, decision: EXTERNAL_REQUIRED
 * Test 3: github.com -> Non-embeddable public origin, iframe forbidden, decision: EXTERNAL_REQUIRED
 * Test 4: javascript:alert(1) -> Dangerous protocol blocked, decision: INVALID
 * Test 5: data:text/html,test -> Dangerous protocol blocked, decision: INVALID
 * Test 6: file:///etc/passwd -> Dangerous protocol blocked, decision: INVALID
 * Test 7: http://example.com when host is HTTPS -> Mixed content blocked, decision: EXTERNAL_REQUIRED
 */

import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  resolveWebModePolicy,
  isEmbeddableOrigin,
  EMBEDDABLE_WEB_ORIGINS,
} from '../../components/browser/WebModePolicy';
import { BrowserContent } from '../../components/browser/BrowserContent';
import { BrowserTab } from '../../components/browser/BrowserTypes';
import { validateBrowserUrl, openExternally } from '../../components/browser/BrowserSecurity';
import { normalizeUrl } from '../../components/browser/BrowserEngine';

describe('Orion Browser Web Mode Policy & Embedding Security Suite', () => {
  // Test 1: example.com -> EMBED_ALLOWED, iframe permitted
  it('Test 1: Identifies example.com as EMBED_ALLOWED and authorizes iframe creation', () => {
    expect(isEmbeddableOrigin('https://example.com')).toBe(true);
    expect(isEmbeddableOrigin('https://www.example.com')).toBe(true);
    expect(isEmbeddableOrigin('https://example.org')).toBe(true);

    const result = resolveWebModePolicy('https://example.com', { isHttpsHost: true });
    expect(result.decision).toBe('EMBED_ALLOWED');
    expect(result.iframeAllowed).toBe(true);
    expect(result.displayName).toBe('example.com');
    expect(result.normalizedUrl).toBe('https://example.com');
  });

  // Test 2: google.com -> EXTERNAL_REQUIRED, iframe NOT allowed, renders external fallback
  it('Test 2: Identifies google.com as EXTERNAL_REQUIRED, forbids iframe, and renders external action card', () => {
    expect(isEmbeddableOrigin('https://google.com')).toBe(false);
    expect(isEmbeddableOrigin('https://www.google.com')).toBe(false);

    const result = resolveWebModePolicy('https://google.com');
    expect(result.decision).toBe('EXTERNAL_REQUIRED');
    expect(result.iframeAllowed).toBe(false);
    expect(result.displayName).toBe('google.com');
    expect(result.reason).toContain('controls its own embedding security policy');

    // Verify BrowserContent component does NOT render an iframe for google.com in Web Mode
    const testTab: BrowserTab = {
      id: 'tab-web-google',
      url: 'https://google.com',
      title: 'Google',
      loading: false,
      loadState: 'EXTERNAL_REQUIRED',
      contentState: 'EXTERNAL_REQUIRED',
      webNavigationState: 'EXTERNAL_REQUIRED',
      canGoBack: false,
      canGoForward: false,
      historyStack: ['https://google.com'],
      historyIndex: 0,
      createdAt: Date.now(),
      zoomLevel: 1.0,
      securityStatus: 'secure',
    };

    const html = renderToString(
      React.createElement(BrowserContent, {
        activeTab: testTab,
        onNavigate: () => {},
        runtimeMode: 'WEB_EMBEDDED',
      })
    );

    // ZERO iframe elements rendered
    expect(html).not.toContain('<iframe');
    // Fallback UI elements rendered
    expect(html).toContain('data-testid="browser-blocked-embedding"');
    expect(html).toContain('data-testid="browser-open-external-btn"');
    expect(html).toContain('data-testid="browser-install-desktop-btn"');
    expect(html).toContain('Open Externally');
  });

  // Test 3: github.com -> EXTERNAL_REQUIRED
  it('Test 3: Identifies github.com as EXTERNAL_REQUIRED and refuses iframe creation', () => {
    expect(isEmbeddableOrigin('https://github.com')).toBe(false);

    const result = resolveWebModePolicy('https://github.com');
    expect(result.decision).toBe('EXTERNAL_REQUIRED');
    expect(result.iframeAllowed).toBe(false);
    expect(result.displayName).toBe('github.com');
  });

  // Test 4: javascript:alert(1) -> INVALID
  it('Test 4: Detects and rejects javascript: protocol as INVALID', () => {
    const result = resolveWebModePolicy('javascript:alert(1)');
    expect(result.decision).toBe('INVALID');
    expect(result.iframeAllowed).toBe(false);
    expect(result.reason).toContain('not permitted in Orion Browser for security reasons');
  });

  // Test 5: data:text/html,test -> INVALID
  it('Test 5: Detects and rejects data: protocol as INVALID', () => {
    const result = resolveWebModePolicy('data:text/html,<h1>test</h1>');
    expect(result.decision).toBe('INVALID');
    expect(result.iframeAllowed).toBe(false);
    expect(result.reason).toContain('not permitted in Orion Browser for security reasons');
  });

  // Test 6: file:///etc/passwd -> INVALID
  it('Test 6: Detects and rejects file: protocol as INVALID', () => {
    const result = resolveWebModePolicy('file:///etc/passwd');
    expect(result.decision).toBe('INVALID');
    expect(result.iframeAllowed).toBe(false);
    expect(result.reason).toContain('not permitted in Orion Browser for security reasons');
  });

  // Test 7: http://example.com when host is HTTPS -> Mixed content blocked
  it('Test 7: Blocks insecure HTTP example.com under HTTPS host to prevent mixed active content', () => {
    const result = resolveWebModePolicy('http://example.com', { isHttpsHost: true });
    expect(result.decision).toBe('EXTERNAL_REQUIRED');
    expect(result.iframeAllowed).toBe(false);
    expect(result.reason).toContain('Mixed Content Restriction');
  });

  // Internal Orion Schemes
  it('Recognizes internal Orion pages as INTERNAL_ORION', () => {
    const newtab = resolveWebModePolicy('orion://newtab');
    expect(newtab.decision).toBe('INTERNAL_ORION');
    expect(newtab.iframeAllowed).toBe(false);

    const blank = resolveWebModePolicy('about:blank');
    expect(blank.decision).toBe('INTERNAL_ORION');
    expect(blank.iframeAllowed).toBe(false);
  });

  // Search normalization & engine resolution
  it('Resolves "google" and search queries accurately based on configured search engine', () => {
    // 1. "google" with default duckduckgo
    const ddgNorm = normalizeUrl('google', 'duckduckgo');
    expect(ddgNorm).toBe('https://duckduckgo.com/?q=google');
    const ddgVal = validateBrowserUrl('google', 'duckduckgo');
    expect(ddgVal.normalizedUrl).toBe('https://duckduckgo.com/?q=google');
    expect(ddgVal.valid).toBe(true);

    // 2. "google" with configured google engine
    const googleNorm = normalizeUrl('google', 'google');
    expect(googleNorm).toBe('https://www.google.com/search?q=google');
    const googleVal = validateBrowserUrl('google', 'google');
    expect(googleVal.normalizedUrl).toBe('https://www.google.com/search?q=google');
    expect(googleVal.valid).toBe(true);

    // 3. Domain pattern google.com resolves to https://google.com
    expect(normalizeUrl('google.com')).toBe('https://google.com');
  });

  // External destination preservation and fallback UI
  it('Preserves exact destination URL, query, and renders copy button in fallback card', () => {
    const searchTab: BrowserTab = {
      id: 'tab-search-ddg',
      url: 'https://duckduckgo.com/?q=google',
      title: 'DuckDuckGo',
      loading: false,
      loadState: 'EXTERNAL_REQUIRED',
      contentState: 'EXTERNAL_REQUIRED',
      webNavigationState: 'EXTERNAL_REQUIRED',
      canGoBack: false,
      canGoForward: false,
      historyStack: ['https://duckduckgo.com/?q=google'],
      historyIndex: 0,
      createdAt: Date.now(),
      zoomLevel: 1.0,
      securityStatus: 'secure',
    };

    const html = renderToString(
      React.createElement(BrowserContent, {
        activeTab: searchTab,
        onNavigate: () => {},
        runtimeMode: 'WEB_EMBEDDED',
      })
    );

    // Assert preserved target URL and search query label
    expect(html).toContain('data-testid="browser-target-url"');
    expect(html).toContain('https://duckduckgo.com/?q=google');
    expect(html).toContain('data-testid="browser-copy-url-btn"');
    expect(html).toContain('Search Query: &quot;google&quot;');
    expect(html).toContain('Open Externally');
  });

  // openExternally security verification
  it('openExternally rejects dangerous URL protocols and handles window context safely', () => {
    const jsRes = openExternally('javascript:alert(1)');
    expect(jsRes.success).toBe(false);
    expect(jsRes.error).toContain('Security Restriction');

    const fileRes = openExternally('file:///etc/passwd');
    expect(fileRes.success).toBe(false);
    expect(fileRes.error).toContain('Security Restriction');

    const validRes = openExternally('https://duckduckgo.com/?q=google');
    // In node/vitest environment without window.open, returns false without throwing
    expect(typeof validRes.popupBlocked).toBe('boolean');
  });
});
