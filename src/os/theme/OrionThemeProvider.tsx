import React, { useEffect, useState, useRef, useMemo } from 'react';
import { OrionThemeEngine } from './OrionThemeEngine';
import { injectBaseTransitions } from './OrionThemeCSS';
import { OrionThemeContext } from './useOrionTheme';

export interface OrionThemeProviderProps {
  children: React.ReactNode;
}

export function OrionThemeProvider({ children }: OrionThemeProviderProps) {
  const engineRef = useRef<OrionThemeEngine | null>(null);
  
  if (!engineRef.current) {
    engineRef.current = new OrionThemeEngine();
  }
  
  const engine = engineRef.current;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    injectBaseTransitions();
    engine.apply();

    const cleanup = engine.onChange(() => {
      setTick(t => t + 1);
    });

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      if (engine.getPreferences().appearanceMode === 'auto') {
        engine.apply();
        setTick(t => t + 1);
      }
    };
    
    mql.addEventListener('change', handleMediaChange);

    return () => {
      cleanup();
      mql.removeEventListener('change', handleMediaChange);
    };
  }, [engine]);

  const contextValue = useMemo(() => ({
    theme: engine.getResolvedTheme(),
    preferences: engine.getPreferences(),
    resolvedAccent: engine.getResolvedAccent(),
    setTheme: engine.setTheme.bind(engine),
    setPreference: engine.setPreference.bind(engine),
    resetAppearance: engine.resetToDefaults.bind(engine),
    isDark: engine.isDark(),
  }), [engine, tick]);

  return (
    <OrionThemeContext.Provider value={contextValue}>
      {children}
    </OrionThemeContext.Provider>
  );
}
