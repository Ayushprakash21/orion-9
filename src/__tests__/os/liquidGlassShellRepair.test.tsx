import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { OrionSystemBar } from '../../os/components/OrionSystemBar';
import { OrionLockScreen, DEFAULT_LOCK_PREFERENCES, loadLockScreenPreferences, saveLockScreenPreferences } from '../../os/components/OrionLockScreen';
import { ToastProvider, useToast } from '../../store/ToastContext';
import { Login } from '../../components/auth/Login';
import { PersonalizationSettingsPanel } from '../../components/settings/PersonalizationSettingsPanel';
import { DEFAULT_PERSONALIZATION_SETTINGS } from '../../theme/themePresets';
import { UserProfile } from '../../types/auth';

// Mock essential contexts for headless rendering
vi.mock('../../store/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'admin', displayName: 'Admin User', role: 'ADMIN' },
    isAdmin: true,
    hasRole: () => true,
    login: vi.fn(),
    signOut: vi.fn(),
  }),
}));

vi.mock('../../os/WindowManagerContext', () => ({
  useWindowManager: () => ({
    windows: {},
    activeAppId: null,
    activeWorkspaceId: 'operations',
    dockPinnedApps: [],
    openApplication: vi.fn(),
    setLauncherOpen: vi.fn(),
    setCommandPaletteOpen: vi.fn(),
    setWorkspace: vi.fn(),
  }),
  useOptionalWindowManager: () => ({
    openApplication: vi.fn(),
  }),
  WORKSPACES: {},
}));

vi.mock('../../store/NotificationContext', () => {
  const dummy = {
    notifications: [
      { id: '1', title: 'Shipment Alert', message: 'Delayed arrival', timestamp: '1m ago', read: false, type: 'warning' }
    ],
    unreadCount: 1,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    openNotification: vi.fn(),
  };
  return {
    useNotifications: () => dummy,
    NotificationContext: React.createContext(dummy),
  };
});

vi.mock('../../store/ConnectivityContext', () => ({
  useConnectivity: () => ({ isOnline: true, statusLabel: 'Online', isLocalMode: false }),
}));

vi.mock('../../store/SupplyChainContext', () => ({
  useSupplyChain: () => ({
    exceptions: [],
    settings: { userExperienceMode: 'ADVANCED' },
    updateSettings: vi.fn(),
  }),
  useOptionalSupplyChain: () => ({
    settings: { reducedMotion: false },
  }),
}));

vi.mock('../../store/BrandingContext', () => ({
  useBranding: () => ({ branding: {} }),
}));

vi.mock('../../os/dock/DockGeometry', () => ({
  useOSGeometry: () => ({
    previewSettings: vi.fn(),
    dock: {
      position: 'bottom',
      orientation: 'horizontal',
      iconSize: 48,
      iconContainerSize: 52,
      thickness: 76,
      safeInset: 88,
      hiddenTransform: '',
      tooltipPlacement: 'top',
      magnificationOrigin: 'bottom center',
    },
    settings: DEFAULT_PERSONALIZATION_SETTINGS,
  }),
}));

describe('ORION-9 macOS Liquid Glass Shell & System Repair Suite', () => {

  describe('1. Liquid Glass Taskbar & System Bar Cleanliness', () => {
    it('removes Simple/Advanced toggle from the system taskbar', () => {
      const html = renderToString(
        <MemoryRouter>
          <OrionSystemBar />
        </MemoryRouter>
      );

      // Verify that neither Simple nor Advanced mode buttons are rendered on the taskbar
      expect(html).not.toContain('Simple Mode: Goal & action-oriented');
      expect(html).not.toContain('Advanced Mode: Full enterprise SCM');
    });

    it('removes centered ORION OS DESKTOP label when active app is null', () => {
      const html = renderToString(
        <MemoryRouter>
          <OrionSystemBar />
        </MemoryRouter>
      );

      // Verify centered desktop text is completely gone
      expect(html).not.toContain('Orion OS Desktop');
      expect(html).not.toContain('ORION OS DESKTOP');
    });
  });

  describe('2. Taskbar & Liquid Glass Personalization Settings', () => {
    it('renders edge placement, opacity, blur, tint, and auto-hide controls', () => {
      const onChange = vi.fn();
      const html = renderToString(
        <PersonalizationSettingsPanel 
          settings={DEFAULT_PERSONALIZATION_SETTINGS} 
          onChange={onChange} 
        />
      );

      expect(html).toContain('Taskbar &amp; Liquid Glass');
      expect(html).toContain('Edge Placement');
      expect(html).toContain('Glass Opacity');
      expect(html).toContain('Blur Strength');
      expect(html).toContain('Material Tint');
      expect(html).toContain('Live Liquid Glass Material');
      expect(html).toContain('Dock Auto-Hide');
    });
  });

  describe('3. Configurable Lock-Screen Widgets', () => {
    it('renders lock screen with macOS clock and configurable widgets', () => {
      const mockUser: UserProfile = {
        id: 'admin',
        username: 'admin',
        displayName: 'Operator One',
        fullName: 'Operator One',
        email: 'operator@orion.internal',
        role: 'platform_admin',
        status: 'active',
      };

      const html = renderToString(
        <OrionLockScreen onUnlock={vi.fn()} currentUser={mockUser} />
      );

      expect(html).toContain('data-testid="orion-lock-screen"');
      expect(html).toContain('data-testid="lock-screen-widgets"');
      expect(html).toContain('data-testid="customize-lock-widgets-btn"');
      expect(html).toContain('Workstation Locked');
      expect(html).toContain('Operator One');
      expect(html).toContain('UNLOCK SESSION');
    });

    it('supports loading and persisting lock screen widget preferences in localStorage', () => {
      // Mock localStorage
      const storage: Record<string, string> = {};
      const fakeStorage = {
        getItem: (k: string) => storage[k] || null,
        setItem: (k: string, v: string) => { storage[k] = v; },
        removeItem: (k: string) => { delete storage[k]; },
        clear: () => {},
        key: () => null,
        length: 0,
      };
      vi.stubGlobal('localStorage', fakeStorage);

      const modified = {
        widgets: [
          { id: 'weather' as const, enabled: true, order: 0 },
          { id: 'time-date' as const, enabled: true, order: 1 },
          { id: 'notifications' as const, enabled: false, order: 2 },
        ],
        privacyMode: true,
      };

      saveLockScreenPreferences(modified);
      const reloaded = loadLockScreenPreferences();
      expect(reloaded.widgets[0].id).toBe('weather');
      expect(reloaded.widgets[2].enabled).toBe(false);

      vi.unstubAllGlobals();
    });
  });

  describe('4. Login Input Capsule & Autofill Styling', () => {
    it('renders login credentials with orion-login-capsule and data-orion-glass-input', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/login']}>
          <Login />
        </MemoryRouter>
      );

      expect(html).toContain('orion-login-capsule');
      expect(html).toContain('data-orion-glass-input="true"');
      expect(html).toContain('selection:bg-emerald-500');
    });
  });

  describe('5. Premium macOS Liquid Glass System Notifications', () => {
    it('renders ToastProvider notification container with macOS styling in top-right', () => {
      const html = renderToString(
        <ToastProvider>
          <div>Test App</div>
        </ToastProvider>
      );

      expect(html).toContain('data-testid="toast-container"');
      expect(html).toContain('top:calc(var(--orion-os-safe-top, 48px) + 12px)');
      expect(html).toContain('right:16px');
    });
  });
});
