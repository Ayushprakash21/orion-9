import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export interface OrionSearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
}

const defaultSearchContext: OrionSearchContextType = {
  searchQuery: '',
  setSearchQuery: () => {},
  clearSearch: () => {},
};

export const OrionSearchContext = createContext<OrionSearchContextType>(defaultSearchContext);

export function OrionSearchProvider({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQueryState] = useState<string>('');

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query || '');
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQueryState('');
  }, []);

  const value = useMemo(() => ({
    searchQuery,
    setSearchQuery,
    clearSearch,
  }), [searchQuery, setSearchQuery, clearSearch]);

  return (
    <OrionSearchContext.Provider value={value}>
      {children}
    </OrionSearchContext.Provider>
  );
}

export function useOrionSearch(): OrionSearchContextType {
  const context = useContext(OrionSearchContext);
  return context || defaultSearchContext;
}
