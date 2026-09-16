import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useSupplyChain } from './SupplyChainContext';
import { useEntityDrawer, EntityType } from './EntityDrawerContext';

export interface AppNotification {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  entityType?: EntityType;
  entityId?: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  openNotification: (notification: AppNotification) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { exceptions, shipments, purchaseOrders } = useSupplyChain();
  const { openEntity } = useEntityDrawer();

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('orion_notifications');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return [
      {
        id: 'notif-1',
        type: 'critical',
        title: 'Critical Inventory Risk Detected',
        message: 'SKU-1000 inventory coverage is approximately 2 days of demand.',
        timestamp: '5 mins ago',
        read: false,
        entityType: 'inventory',
        entityId: 'SKU-1000'
      },
      {
        id: 'notif-2',
        type: 'warning',
        title: 'Delayed Shipment Alert',
        message: 'Shipment SHP-2026-0001 is delayed by 3 days due to port congestion.',
        timestamp: '25 mins ago',
        read: false,
        entityType: 'shipment',
        entityId: 'SHP-2026-0001'
      },
      {
        id: 'notif-3',
        type: 'info',
        title: 'Sync Completed Successfully',
        message: 'All operational data repositories synchronized without error.',
        timestamp: '1 hour ago',
        read: true
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('orion_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Synchronize exceptions into notifications if new ones appear
  useEffect(() => {
    if (exceptions.length > 0) {
      setNotifications(prev => {
        const existingIds = new Set([
          ...prev.map(p => p.entityId).filter(Boolean),
          ...prev.map(p => p.id)
        ]);
        const newNotifs: AppNotification[] = [];
        
        exceptions.slice(0, 5).forEach(exc => {
          const notifId = `exc-notif-${exc.id}`;
          if (!existingIds.has(exc.id) && !existingIds.has(notifId)) {
            newNotifs.push({
              id: notifId,
              type: exc.severity === 'Critical' ? 'critical' : exc.severity === 'High' ? 'warning' : 'info',
              title: `${exc.severity} Exception: ${exc.type}`,
              message: exc.description,
              timestamp: 'Just now',
              read: false,
              entityType: 'exception',
              entityId: exc.id
            });
          }
        });

        if (newNotifs.length > 0) {
          return [...newNotifs, ...prev];
        }
        return prev;
      });
    }
  }, [exceptions]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const addNotification = useCallback((notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      timestamp: 'Just now',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const openNotification = useCallback((notification: AppNotification) => {
    markAsRead(notification.id);
    if (notification.entityType && notification.entityId) {
      openEntity(notification.entityType, notification.entityId);
    }
  }, [markAsRead, openEntity]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, addNotification, openNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
