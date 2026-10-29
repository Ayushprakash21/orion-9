import { auth } from '../src/services/auth';
import { api } from '../src/services/api';
import { storage } from '../src/storage';
import { notifications } from '../src/services/notifications';

describe('Orion-9 Mobile LIVE Mode Integration & Security Guard', () => {
  beforeEach(async () => {
    await auth.signOut();
    await storage.clear();
    await auth.setEnvironment('LIVE');
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await auth.signOut();
    await auth.setEnvironment('DEMO');
  });

  it('strictly blocks client-side session forgery in LIVE environment', async () => {
    // Attempting to inject a fake DEMO token into storage under LIVE environment
    const forgedSession = {
      token: 'orion_sess:DEMO:admin:platform_admin:9999999999999:sig_demo_admin',
      user: {
        id: 'usr-admin-v2',
        username: 'admin',
        email: 'admin@orion.network',
        fullName: 'Platform Admin',
        role: 'platform_admin' as const,
        organizationId: 'org-global-corp',
        status: 'active' as const,
      },
      environment: 'DEMO' as const,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    };

    await storage.setJson('orion_auth_session', forgedSession);

    // getSession must reject this cross-environment token and clear it
    const session = await auth.getSession();
    expect(session).toBeNull();

    const storedAfterCheck = await storage.getJson('orion_auth_session');
    expect(storedAfterCheck).toBeNull();
  });

  it('rejects authentication when API endpoint is unavailable without inventing fallback', async () => {
    jest.spyOn(api, 'post').mockRejectedValueOnce(new Error('Network request failed'));

    await expect(auth.signIn('genuine-user@enterprise.com', 'Pass1234!')).rejects.toThrow(
      'Network request failed'
    );

    const stored = await storage.getJson('orion_auth_session');
    expect(stored).toBeNull();
  });

  it('synchronizes live notifications and preserves user read states', async () => {
    // 1. Initial alerts
    const initialAlerts = await notifications.getInAppAlerts();
    expect(initialAlerts.length).toBeGreaterThan(0);

    // 2. Mark first alert as read
    const alertId = initialAlerts[0].id;
    await notifications.markAsRead(alertId);

    // 3. Mock backend returning updated fresh alerts
    jest.spyOn(api, 'get').mockResolvedValueOnce({
      success: true,
      alerts: [
        {
          id: alertId,
          title: 'Critical Inventory Risk: SKU-1000',
          message: 'Coverage down to 2.1 days.',
          severity: 'Critical',
          timestamp: 'Just now',
          read: false, // Server reports false, but client read state must be preserved
          entityType: 'inventory',
          entityId: 'SKU-1000',
          actionRequired: true,
        },
        {
          id: 'alt-fresh-99',
          title: 'New PO Confirmed: PO-2026-0099',
          message: 'Supplier acknowledged delivery.',
          severity: 'Low',
          timestamp: '1 min ago',
          read: false,
          entityType: 'po',
          entityId: 'PO-2026-0099',
          actionRequired: false,
        },
      ],
    });

    const refreshed = await notifications.getInAppAlerts();
    expect(refreshed.length).toBe(2);

    // Verify previously read alert remains read
    const preserved = refreshed.find(a => a.id === alertId);
    expect(preserved?.read).toBe(true);

    // Verify fresh unread alert is unread
    const fresh = refreshed.find(a => a.id === 'alt-fresh-99');
    expect(fresh?.read).toBe(false);
  });
});
