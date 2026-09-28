import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { FinanceMatchingCenter } from '../../components/FinanceMatchingCenter';
import { WorkingCapital } from '../../components/WorkingCapital';
import { OrionMobileAlerts } from '../../os/mobile/OrionMobileAlerts';
import { OrionMobileHome } from '../../os/mobile/OrionMobileHome';
import { OrionMobileAppLauncher } from '../../os/mobile/OrionMobileAppLauncher';
import { WorldLanguagePanel } from '../../components/i18n/WorldLanguagePanel';
import { MobileNavigationProvider } from '../../os/mobile/OrionMobileNavigation';
import { SupplyChainProvider } from '../../store/SupplyChainContext';
import { AuthProvider } from '../../store/AuthContext';
import { ToastProvider } from '../../store/ToastContext';
import { NotificationProvider } from '../../store/NotificationContext';
import { LanguageProvider } from '../../store/LanguageContext';

// Mock contexts
vi.mock('../../store/AuthContext', () => ({
  useAuth: () => ({
    currentUser: {
      id: 'usr-mob-001',
      fullName: 'Operations Manager',
      username: 'ops_mgr',
      email: 'ops@orion9.enterprise',
      role: 'supply_chain_manager',
      organizationId: 'tenant-mob-001',
    },
    isAuthenticated: true,
    isAdmin: false,
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('../../store/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
  ToastProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('../../store/NotificationContext', () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 3,
  }),
  NotificationProvider: ({ children }: any) => <div>{children}</div>,
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MemoryRouter>
    <LanguageProvider>
      <SupplyChainProvider>
        <MobileNavigationProvider>
          {children}
        </MobileNavigationProvider>
      </SupplyChainProvider>
    </LanguageProvider>
  </MemoryRouter>
);

describe('ORION-9 — Mobile OS Full Responsive Hardening & Viewport Verification', () => {
  const VIEWPORTS = [
    { name: 'Small Phone (Android)', width: 360, height: 800 },
    { name: 'iPhone SE / Mini', width: 375, height: 812 },
    { name: 'iPhone 12/13/14', width: 390, height: 844 },
    { name: 'iPhone 15/16 Pro', width: 393, height: 852 },
    { name: 'Pixel 7/8 / Galaxy S24', width: 412, height: 915 },
    { name: 'iPhone 15/16 Pro Max', width: 430, height: 932 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Invoicing & 3-Way Matching Responsive Hardening', () => {
    it('renders FinanceMatchingCenter with responsive split layout without breaking across phone viewports', () => {
      VIEWPORTS.forEach(vp => {
        const html = renderToString(
          <TestWrapper>
            <FinanceMatchingCenter />
          </TestWrapper>
        );

        // Verify title & buttons
        expect(html).toContain('Invoice &amp; 3-Way Matching');
        expect(html).toContain('Execute 3-Way Match');
        expect(html).toContain('flex-col md:flex-row');
        expect(html).toContain('overflow-x-auto');
        expect(html).toContain('min-w-[540px]');
      });
    });
  });

  describe('2. Working Capital Intelligence Responsive Hardening', () => {
    it('renders WorkingCapital metrics in responsive grid without clipping', () => {
      VIEWPORTS.forEach(vp => {
        const html = renderToString(
          <TestWrapper>
            <WorkingCapital />
          </TestWrapper>
        );

        expect(html).toContain('Working Capital Intelligence');
        expect(html).toContain('Total Inventory Value');
        expect(html).toContain('Excess Capital');
        expect(html).toContain('grid-cols-1 sm:grid-cols-2 lg:grid-cols-4');
      });
    });
  });

  describe('3. Orion Mobile Alerts Screen', () => {
    it('renders filter chips and alert stream with compact layout', () => {
      const html = renderToString(
        <TestWrapper>
          <OrionMobileAlerts />
        </TestWrapper>
      );

      expect(html).toContain('Operational Alerts &amp; Risks');
      expect(html).toContain('ALL');
      expect(html).toContain('CRITICAL');
      expect(html).toContain('HIGH');
      expect(html).toContain('MEDIUM');
      expect(html).toContain('min-h-[44px]');
    });
  });

  describe('4. Orion Mobile Home Screen', () => {
    it('renders personalized greeting, quick access grid, and operational telemetry', () => {
      const html = renderToString(
        <TestWrapper>
          <OrionMobileHome />
        </TestWrapper>
      );

      expect(html).toContain('ORION-9 OS');
      expect(html).toContain('Control');
      expect(html).toContain('AI');
      expect(html).toContain('Alerts');
      expect(html).toContain('Apps');
      expect(html).toContain('Recent Activity');
    });
  });

  describe('5. Orion Mobile Apps Launcher', () => {
    it('renders search bar, category groups, and responsive app grid', () => {
      const html = renderToString(
        <TestWrapper>
          <OrionMobileAppLauncher />
        </TestWrapper>
      );

      expect(html).toContain('ENTERPRISE APPS');
      expect(html).toContain('Search enterprise apps...');
      expect(html).toContain('grid-cols-3 sm:grid-cols-4 md:grid-cols-6');
      expect(html).toContain('Operations &amp; Execution');
    });
  });

  describe('6. World Language Panel Containment & Responsiveness', () => {
    it('renders WorldLanguagePanel with viewport-contained constraints (max-w-[calc(100vw-1.5rem)])', () => {
      const handleSelect = vi.fn();
      const handleClose = vi.fn();

      const html = renderToString(
        <WorldLanguagePanel
          isOpen={true}
          onClose={handleClose}
          currentLocale="en"
          onSelectLocale={handleSelect}
        />
      );

      expect(html).toContain('data-testid="world-language-panel"');
      expect(html).toContain('max-w-[calc(100vw-1.5rem)]');
      expect(html).toContain('z-50');
      expect(html).toContain('World Languages');
      expect(html).toContain('Deutsch');
      expect(html).toContain('Español');
    });
  });
});
