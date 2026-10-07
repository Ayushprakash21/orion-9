import React, { createContext, useContext } from 'react';
import { OrionThemeContextValue } from './OrionThemeTypes';

export const OrionThemeContext = createContext<OrionThemeContextValue | null>(null);

/**
 * Hook to access the Orion theme system
 */
export function useOrionTheme(): OrionThemeContextValue {
  const context = useContext(OrionThemeContext);
  if (!context) {
    throw new Error('useOrionTheme must be used within an OrionThemeProvider');
  }
  return context;
}
