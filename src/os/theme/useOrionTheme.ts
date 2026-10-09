import React, { createContext, useContext } from 'react';
import { DEFAULT_PREFERENCES, OrionThemeContextValue } from './OrionThemeTypes';
import { ORION_THEMES } from './OrionThemeRegistry';

export const OrionThemeContext = createContext<OrionThemeContextValue | null>(null);

const FALLBACK_THEME_CONTEXT: OrionThemeContextValue = {
  theme: ORION_THEMES.graphite,
  preferences: DEFAULT_PREFERENCES,
  resolvedAccent: ORION_THEMES.graphite.colors.accent,
  setTheme: () => {},
  setPreference: () => {},
  resetAppearance: () => {},
  isDark: true,
};

/**
 * Hook to access the Orion theme system
 */
export function useOrionTheme(): OrionThemeContextValue {
  const context = useContext(OrionThemeContext);
  return context || FALLBACK_THEME_CONTEXT;
}

