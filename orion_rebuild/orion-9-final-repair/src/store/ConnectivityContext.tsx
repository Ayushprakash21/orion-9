import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ConnectivityState = 'online-operational' | 'local-mode' | 'offline-local';

interface ConnectivityContextType {
  isOnline: boolean;
  state: ConnectivityState;
  statusLabel: string;
  isLocalMode: boolean;
  checkHealth: () => Promise<void>;
}

const ConnectivityContext = createContext<ConnectivityContextType | undefined>(undefined);

export const ConnectivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [backendAvailable, setBackendAvailable] = useState<boolean>(true);

  const checkHealth = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
      setBackendAvailable(false);
      return;
    }
    
    setIsOnline(true);
    try {
      const res = await fetch('/api/health', { method: 'GET', cache: 'no-store' }).catch(() => null);
      if (res && res.ok) {
        setBackendAvailable(true);
      } else {
        // Backend unreachable or returned non-200: seamlessly continue in Local / Demo Mode
        setBackendAvailable(false);
      }
    } catch {
      // Background ping error: silently transition to Local / Demo Mode without blocking notifications or overlays
      setBackendAvailable(false);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      checkHealth().catch(() => {});
    };

    const handleOffline = () => {
      setIsOnline(false);
      // Seamlessly switch to Local / Demo Mode without displaying blocking notifications or offline UI overlays
      setBackendAvailable(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial silent check
    checkHealth().catch(() => {});

    // Check periodically without blocking or spamming
    const interval = setInterval(() => {
      checkHealth().catch(() => {});
    }, 45000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkHealth]);

  // Determine non-blocking status:
  // If the network or backend is unreachable, the app remains fully functional in 'Local / Demo Mode'
  // without triggering any blocking 'You are currently offline' notification or offline UI overlay.
  const isLocal = !isOnline || !backendAvailable;
  const state: ConnectivityState = isLocal ? 'local-mode' : 'online-operational';
  const statusLabel = isLocal ? 'Local / Demo Mode' : 'Operational';

  return (
    <ConnectivityContext.Provider
      value={{
        isOnline,
        state,
        statusLabel,
        isLocalMode: isLocal,
        checkHealth
      }}
    >
      {/*
        The application renders children directly.
        No blocking "You are currently offline" notification or offline UI overlay is ever displayed.
        The local data engines and IndexedDB storage run with full autonomy and responsiveness.
      */}
      {children}
    </ConnectivityContext.Provider>
  );
};

export const useConnectivity = () => {
  const context = useContext(ConnectivityContext);
  if (!context) {
    // Fallback if rendered outside provider so nothing ever crashes
    return {
      isOnline: true,
      state: 'online-operational' as ConnectivityState,
      statusLabel: 'Operational',
      isLocalMode: false,
      checkHealth: async () => {}
    };
  }
  return context;
};
