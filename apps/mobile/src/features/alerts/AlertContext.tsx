import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { MobileAlertItem } from '../../types';
import { notifications } from '../../services/notifications';

interface AlertContextType {
  alerts: MobileAlertItem[];
  filteredAlerts: MobileAlertItem[];
  unreadCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  filter: 'all' | 'critical' | 'high' | 'unread';
  setFilter: (filter: 'all' | 'critical' | 'high' | 'unread') => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshAlerts: (isPullToRefresh?: boolean) => Promise<void>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<MobileAlertItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'unread'>('all');

  const loadAlerts = useCallback(async (isPullToRefresh = false) => {
    if (isPullToRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    try {
      const items = await notifications.getInAppAlerts();
      setAlerts(items);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const markAsRead = async (id: string) => {
    const updated = await notifications.markAsRead(id);
    setAlerts(updated);
  };

  const markAllAsRead = async () => {
    const updated = await notifications.markAllAsRead();
    setAlerts(updated);
  };

  const unreadCount = alerts.filter(a => !a.read).length;

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'critical') return a.severity === 'Critical';
    if (filter === 'high') return a.severity === 'High';
    if (filter === 'unread') return !a.read;
    return true;
  });

  return (
    <AlertContext.Provider
      value={{
        alerts,
        filteredAlerts,
        unreadCount,
        isLoading,
        isRefreshing,
        filter,
        setFilter,
        markAsRead,
        markAllAsRead,
        refreshAlerts: loadAlerts,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
};
