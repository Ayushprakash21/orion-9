import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { EnvironmentSettingsPanel } from '../../components/settings/EnvironmentSettingsPanel';
import { ToastProvider } from '../../store/ToastContext';
import { 
  getBrowserEngine, 
  createBrowserEngine, 
  WebBrowserEngine, 
  NativeBrowserEngine,
} from '../../components/browser/BrowserEngine';
import { OrionSystemBar } from '../../os/components/OrionSystemBar';
import { OrionWindowManager } from '../../os/WindowManagerContext';
import { SupplyChainProvider } from '../../store/SupplyChainContext';
import { AuthProvider } from '../../store/AuthContext';
import { LanguageProvider } from '../../store/LanguageContext';
import { NotificationProvider } from '../../store/NotificationContext';
import { ConnectivityProvider } from '../../store/ConnectivityContext';
import { BrandingProvider } from '../../store/BrandingContext';
import { OrionThemeProvider } from '../../os/theme/OrionThemeProvider';
import { Login } from '../../components/auth/Login';

describe('ORION-9 OS Shell, Login, Environment & Browser Architecture Verification', () => {

  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
    dbManager.setEnvironment('DEMO');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 1. LOGIN SCREEN HAS NO ENVIRONMENT BADGE / SWITCHER
  describe('Login Screen Architectural Cleanliness', () => {
    it('renders enterprise Login screen WITHOUT environment badge or switch button', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/login']}>
          <AuthProvider>
            <LanguageProvider>
              <Login />
            </LanguageProvider>
          </AuthProvider>
        </MemoryRouter>
      );

      // Verify no environment badge or switch button exists
      expect(html).not.toContain('data-testid="environment-badge"');
      expect(html).not.toContain('Switch to LIVE');
      expect(html).not.toContain('Switch to DEMO');
      expect(html).not.toContain('DEMO SANDBOX');
      expect(html).not.toContain('LIVE ENVIRONMENT');

      // Verify enterprise login form exists
      expect(html).toContain('id="username"');
    });
  });

  // 2. ENVIRONMENT SETTINGS IN ORION OS SETTINGS
  describe('Environment Control in System Settings', () => {
    it('renders the EnvironmentSettingsPanel with LIVE and DEMO options', () => {
      const html = renderToString(
        <SupplyChainProvider>
          <ToastProvider>
            <EnvironmentSettingsPanel />
          </ToastProvider>
        </SupplyChainProvider>
      );

      expect(html).toContain('data-testid="environment-active-banner"');
      expect(html).toContain('data-testid="env-option-live"');
      expect(html).toContain('data-testid="env-option-demo"');
      expect(html).toContain('switch-to-live-btn');
      expect(html).toContain('switch-to-demo-btn');
      expect(html).toContain('Active OS Environment');
      expect(html).toContain('LIVE Environment');
      expect(html).toContain('DEMO Sandbox');
    });

    it('dbManager supports programmatic environment switching with event dispatch', () => {
      const targetWin = typeof window !== 'undefined' ? window : (global as any);
      const eventsDispatched: string[] = [];
      const listener = () => {
        eventsDispatched.push(dbManager.getEnvironment());
      };
      if (targetWin?.addEventListener) {
        targetWin.addEventListener('orion-database-environment-changed', listener);
      }

      try {
        dbManager.setEnvironment('LIVE');
        expect(dbManager.getEnvironment()).toBe('LIVE');
        if (targetWin?.addEventListener) {
          expect(eventsDispatched).toContain('LIVE');
        }

        dbManager.setEnvironment('DEMO');
        expect(dbManager.getEnvironment()).toBe('DEMO');
        if (targetWin?.addEventListener) {
          expect(eventsDispatched).toContain('DEMO');
        }
      } finally {
        if (targetWin?.removeEventListener) {
          targetWin.removeEventListener('orion-database-environment-changed', listener);
        }
      }
    });
  });

  // 3. BROWSER RUNTIME ARCHITECTURE & GOOGLE / DOMAIN UNBLOCKING
  describe('Browser Engine Architecture', () => {
    it('creates WebBrowserEngine for WEB_EMBEDDED mode without artificial domain blocklists', async () => {
      const engine = getBrowserEngine('WEB_EMBEDDED');
      expect(engine).toBeInstanceOf(WebBrowserEngine);

      // Google, GitHub navigation attempts are NOT preemptively rejected
      const googleRes = await engine.navigate('https://google.com');
      expect(googleRes.state).toBe('PAGE_LOADED');
      expect(googleRes.url).toBe('https://google.com');

      const githubRes = await engine.navigate('https://github.com');
      expect(githubRes.state).toBe('PAGE_LOADED');
      expect(githubRes.url).toBe('https://github.com');
    });

    it('creates NativeBrowserEngine for NATIVE_WEBVIEW mode supporting native browsing', async () => {
      const engine = getBrowserEngine('NATIVE_WEBVIEW');
      expect(engine).toBeInstanceOf(NativeBrowserEngine);

      const res = await engine.navigate('https://google.com');
      expect(res.state).toBe('PAGE_LOADED');
      expect(res.url).toBe('https://google.com');
      expect(engine.getTitle()).toBe('google.com');
    });

    it('createBrowserEngine factory handles auto mode correctly', () => {
      const engine = createBrowserEngine('auto');
      expect(engine).toBeDefined();
      expect(engine.getCurrentUrl()).toBe('orion://newtab');
    });
  });

  // 4. TOP-LEFT BRAND INDICATOR (LOGO ONLY, NO "Orion OS" TEXT)
  describe('OrionSystemBar Brand Indicator', () => {
    it('renders logo mark without "Orion OS" text string in top-left button', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/']}>
          <BrandingProvider>
            <ConnectivityProvider>
              <SupplyChainProvider>
                <NotificationProvider>
                  <OrionWindowManager>
                    <OrionSystemBar />
                  </OrionWindowManager>
                </NotificationProvider>
              </SupplyChainProvider>
            </ConnectivityProvider>
          </BrandingProvider>
        </MemoryRouter>
      );

      // Top bar contains system menu button
      expect(html).toContain('aria-label="Open ORION System Menu"');

      // Ensure the top-left button does NOT render the text string "Orion OS"
      // Find the slice containing the button:
      const buttonStart = html.indexOf('aria-label="Open ORION System Menu"');
      const buttonEnd = html.indexOf('</button>', buttonStart);
      const buttonSlice = html.substring(buttonStart, buttonEnd);

      expect(buttonSlice).not.toContain('Orion OS');
      // Contains the logo
      expect(buttonSlice).toContain('orion-brand-image');
      // Contains the active environment badge
      expect(buttonSlice).toContain('DEMO');
    });
  });
});
