import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { BrandingConfig } from '../types/auth';
import { brandingRepository, defaultBranding } from '../repositories/BrandingRepository';

export interface BrandingContextType {
  branding: BrandingConfig;
  appName: string;
  description: string;
  tagline: string;
  logoUrl: string | null;
  logoIncludesName: boolean;
  isLoading: boolean;
  saveBranding: (data: Partial<BrandingConfig>) => Promise<{ success: boolean; method: 'remote' | 'local'; config: BrandingConfig }>;
  resetBranding: () => Promise<BrandingConfig>;
  refreshBranding: () => Promise<BrandingConfig>;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingConfig>(() => brandingRepository.getBrandingSync());
  const [isLoading, setIsLoading] = useState(false);

  const applyBranding = useCallback((config: BrandingConfig) => {
    setBranding(config);
    if (typeof document !== 'undefined') {
      const name = config.appName || config.productName || config.applicationName || 'ORION SCM OS';
      const tag = config.description || config.tagline || 'AI Supply Chain Operating System';
      document.title = `${name} — ${tag}`;
    }
  }, []);

  const refreshBranding = useCallback(async () => {
    try {
      const config = await brandingRepository.getBranding();
      applyBranding(config);
      return config;
    } catch (e) {
      console.warn('[BrandingProvider] Initial branding fetch fallback:', e);
      return brandingRepository.getBrandingSync();
    } finally {
      setIsLoading(false);
    }
  }, [applyBranding]);

  useEffect(() => {
    refreshBranding().catch(err => {
      console.warn('[BrandingProvider] Background branding load warning:', err);
    });

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<BrandingConfig>;
      if (customEvent.detail) {
        applyBranding(customEvent.detail);
      } else {
        const syncConfig = brandingRepository.getBrandingSync();
        applyBranding(syncConfig);
      }
    };

    window.addEventListener('orion-branding-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('orion-branding-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [refreshBranding, applyBranding]);

  const saveBranding = useCallback(async (data: Partial<BrandingConfig>) => {
    const result = await brandingRepository.saveBranding(data);
    applyBranding(result.config);
    return result;
  }, [applyBranding]);

  const resetBranding = useCallback(async () => {
    const config = await brandingRepository.resetBranding();
    applyBranding(config);
    return config;
  }, [applyBranding]);

  const appName = branding.appName || branding.productName || branding.applicationName || branding.osName || 'ORION SCM OS';
  const description = branding.description || branding.tagline || 'AI Supply Chain Operating System';
  const tagline = branding.tagline || branding.description || 'AI Supply Chain Operating System';
  const logoUrl = branding.logoUrl || branding.logo || null;
  const logoIncludesName = Boolean(branding.logoIncludesName || branding.logoIncludesWordmark);

  return (
    <BrandingContext.Provider
      value={{
        branding,
        appName,
        description,
        tagline,
        logoUrl,
        logoIncludesName,
        isLoading,
        saveBranding,
        resetBranding,
        refreshBranding,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = (): BrandingContextType => {
  const context = useContext(BrandingContext);
  if (!context) {
    const syncConfig = brandingRepository.getBrandingSync();
    const appName = syncConfig.appName || syncConfig.productName || syncConfig.applicationName || syncConfig.osName || 'ORION SCM OS';
    const description = syncConfig.description || syncConfig.tagline || 'AI Supply Chain Operating System';
    return {
      branding: syncConfig,
      appName,
      description,
      tagline: description,
      logoUrl: syncConfig.logoUrl || syncConfig.logo || null,
      logoIncludesName: Boolean(syncConfig.logoIncludesName || syncConfig.logoIncludesWordmark),
      isLoading: false,
      saveBranding: (data) => brandingRepository.saveBranding(data),
      resetBranding: () => brandingRepository.resetBranding(),
      refreshBranding: () => brandingRepository.getBranding(),
    };
  }
  return context;
};
