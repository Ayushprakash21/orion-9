import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { RuntimeSettings } from './RuntimeSettingsModel';
import { runtimeSettingsAuthority } from './RuntimeSettingsAuthority';

/** Context exposing the runtime settings API */
interface RuntimeSettingsContextValue {
  /** Current snapshot */
  settings: RuntimeSettings;
  /** Update a subset of settings */
  updateSettings: (partial: Partial<RuntimeSettings>) => void;
  /** Replace the whole settings object */
  replaceSettings: (newSettings: RuntimeSettings) => void;
  /** Reset to defaults */
  reset: () => void;
}

const RuntimeSettingsContext = createContext<RuntimeSettingsContextValue | undefined>(undefined);

export const RuntimeSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<RuntimeSettings>(runtimeSettingsAuthority.settings);

  useEffect(() => {
    // Subscribe to authority changes and update local state.
    const unsubscribe = runtimeSettingsAuthority.subscribe(setSettings);
    return unsubscribe;
  }, []);

  const updateSettings = (partial: Partial<RuntimeSettings>) => {
    runtimeSettingsAuthority.updateSettings(partial);
    // No need to setState here – subscription will update.
  };

  const replaceSettings = (newSettings: RuntimeSettings) => {
    runtimeSettingsAuthority.replaceSettings(newSettings);
  };

  const reset = () => {
    runtimeSettingsAuthority.reset();
  };

  const value: RuntimeSettingsContextValue = {
    settings,
    updateSettings,
    replaceSettings,
    reset,
  };

  return (
    <RuntimeSettingsContext.Provider value={value}>
      {children}
    </RuntimeSettingsContext.Provider>
  );
};

/** Hook for components to consume the settings and API */
export const useRuntimeSettings = (): RuntimeSettingsContextValue => {
  const ctx = useContext(RuntimeSettingsContext);
  if (!ctx) {
    throw new Error('useRuntimeSettings must be used within a RuntimeSettingsProvider');
  }
  return ctx;
};
