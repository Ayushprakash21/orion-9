import { notifications, DEFAULT_ALERTS } from '../src/services/notifications';
import { storage } from '../src/storage';

describe('Orion-9 Mobile Notification Service', () => {
  beforeEach(async () => {
    await storage.clear();
  });

  it('retrieves default in-app alerts when storage is empty', async () => {
    const alerts = await notifications.getInAppAlerts();
    expect(alerts.length).toBe(DEFAULT_ALERTS.length);
    expect(alerts[0].title).toContain('Critical Inventory Risk');
  });

  it('marks an individual alert as read', async () => {
    const alerts = await notifications.getInAppAlerts();
    const targetId = alerts[0].id;
    expect(alerts[0].read).toBe(false);

    const updated = await notifications.markAsRead(targetId);
    const target = updated.find(a => a.id === targetId);
    expect(target?.read).toBe(true);
  });

  it('marks all alerts as read', async () => {
    await notifications.getInAppAlerts();
    const updated = await notifications.markAllAsRead();
    const allRead = updated.every(a => a.read === true);
    expect(allRead).toBe(true);
  });

  it('persists and restores user notification preferences', async () => {
    const defaultPrefs = await notifications.getUserPreferences('usr-1');
    expect(defaultPrefs.pushEnabled).toBe(true);
    expect(defaultPrefs.criticalAlertsOnly).toBe(false);

    const modified = {
      ...defaultPrefs,
      criticalAlertsOnly: true,
      soundEnabled: false,
    };
    await notifications.saveUserPreferences(modified, 'usr-1');

    const restored = await notifications.getUserPreferences('usr-1');
    expect(restored.criticalAlertsOnly).toBe(true);
    expect(restored.soundEnabled).toBe(false);
  });
});
