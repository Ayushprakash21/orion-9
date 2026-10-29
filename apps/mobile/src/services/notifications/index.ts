/**
 * ORION-9 NOTIFICATION & DEVICE REGISTRATION SERVICE
 * Manages push notification tokens, device registration, and in-app alerts.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { MobileAlertItem, UserNotificationPreferences } from '../../types';
import { storage } from '../../storage';
import { api } from '../api';
import { auth } from '../auth';

const PREFS_KEY_PREFIX = 'orion_notif_prefs_';
const ALERTS_STORAGE_KEY = 'orion_in_app_alerts';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const DEFAULT_ALERTS: MobileAlertItem[] = [
  {
    id: 'alt-1',
    title: 'Critical Inventory Risk: SKU-1000',
    message: 'Inventory coverage down to 2.1 days of demand at Chicago DC-01.',
    severity: 'Critical',
    timestamp: '15 mins ago',
    read: false,
    entityType: 'inventory',
    entityId: 'SKU-1000',
    actionRequired: true,
  },
  {
    id: 'alt-2',
    title: 'Maritime Congestion Delay: SHP-2026-0001',
    message: 'Maersk consignment delayed +4 days due to Port of Long Beach backlog.',
    severity: 'Critical',
    timestamp: '42 mins ago',
    read: false,
    entityType: 'shipment',
    entityId: 'SHP-2026-0001',
    actionRequired: true,
  },
  {
    id: 'alt-3',
    title: 'PO Overdue Warning: PO-2026-0042',
    message: 'Titan Microelectronics delivery overdue by 2 days.',
    severity: 'High',
    timestamp: '2 hours ago',
    read: false,
    entityType: 'po',
    entityId: 'PO-2026-0042',
    actionRequired: false,
  },
  {
    id: 'alt-4',
    title: 'ERP Ledger Telemetry Reconciled',
    message: 'Autonomous synchronization completed across all 4 distribution centers.',
    severity: 'Low',
    timestamp: '4 hours ago',
    read: true,
    actionRequired: false,
  },
];

export const notifications = {
  async registerForPushNotifications(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '8b9f018e-6701-49b0-9831-2852dc70a92f',
      });

      const token = tokenData.data;

      // Register token with backend associated with user account
      const session = await auth.getSession();
      if (session && token) {
        try {
          await api.post('/api/notifications/register-device', {
            pushToken: token,
            platform: Platform.OS,
            userId: session.user.id,
          });
        } catch {}
      }

      return token;
    } catch (e) {
      console.warn('Push notification registration warning:', e);
      return null;
    }
  },

  async getUserPreferences(userId?: string): Promise<UserNotificationPreferences> {
    const key = `${PREFS_KEY_PREFIX}${userId || 'default'}`;
    const saved = await storage.getJson<UserNotificationPreferences>(key);
    if (saved) return saved;

    const defaults: UserNotificationPreferences = {
      pushEnabled: true,
      criticalAlertsOnly: false,
      soundEnabled: true,
      shipmentDelayAlerts: true,
      inventoryStockoutAlerts: true,
      overduePoAlerts: true,
    };
    await storage.setJson(key, defaults);
    return defaults;
  },

  async saveUserPreferences(prefs: UserNotificationPreferences, userId?: string): Promise<void> {
    const key = `${PREFS_KEY_PREFIX}${userId || 'default'}`;
    await storage.setJson(key, prefs);
  },

  async getInAppAlerts(): Promise<MobileAlertItem[]> {
    const saved = await storage.getJson<MobileAlertItem[]>(ALERTS_STORAGE_KEY);
    const readMap = new Map<string, boolean>();
    if (saved && Array.isArray(saved)) {
      saved.forEach(a => {
        if (a.read) readMap.set(a.id, true);
      });
    }

    try {
      const res = await api.get<{ success: boolean; alerts: MobileAlertItem[] }>('/api/notifications/alerts');
      if (res && res.success && Array.isArray(res.alerts)) {
        const merged = res.alerts.map(a => ({
          ...a,
          read: readMap.get(a.id) ?? a.read ?? false,
        }));
        await storage.setJson(ALERTS_STORAGE_KEY, merged);
        return merged;
      }
    } catch {
      // Offline fallback
    }

    if (saved && Array.isArray(saved) && saved.length > 0) {
      return saved;
    }
    await storage.setJson(ALERTS_STORAGE_KEY, DEFAULT_ALERTS);
    return DEFAULT_ALERTS;
  },

  async markAsRead(alertId: string): Promise<MobileAlertItem[]> {
    const alerts = await this.getInAppAlerts();
    const updated = alerts.map(a => (a.id === alertId ? { ...a, read: true } : a));
    await storage.setJson(ALERTS_STORAGE_KEY, updated);
    return updated;
  },

  async markAllAsRead(): Promise<MobileAlertItem[]> {
    const alerts = await this.getInAppAlerts();
    const updated = alerts.map(a => ({ ...a, read: true }));
    await storage.setJson(ALERTS_STORAGE_KEY, updated);
    return updated;
  },

  async sendLocalAlert(title: string, body: string, data?: Record<string, any>): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null,
      });
    } catch (e) {
      console.warn('Local notification trigger warning:', e);
    }
  },
};
