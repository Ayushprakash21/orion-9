import { BrandingConfig } from '../types/auth';
import localforage from 'localforage';

export const PRIMARY_BRANDING_KEY = 'applicationBranding';
export const LEGACY_BRANDING_KEY = 'orion9_branding';

// Create a dedicated localforage instance for platform configuration if desired
let brandingStore: LocalForage | null = null;
try {
  brandingStore = localforage.createInstance({
    name: 'SC_DB',
    storeName: 'branding'
  });
} catch (e) {
  console.warn('[ORION-BR] LocalForage instance creation failed, falling back to localStorage.', e);
}

export const defaultBranding: BrandingConfig = {
  osName: 'ORION-9',
  productName: 'ORION-9',
  appName: 'ORION-9',
  applicationName: 'ORION-9',
  tagline: 'AI Supply Chain Operating System',
  description: 'AI Supply Chain Operating System',
  version: '9.4.2',
  organizationName: 'Enterprise Supply Chain',
  logoUrl: '/orion-9-logo-transparent-v2.png',
  logo: '/orion-9-logo-transparent-v2.png',
  faviconUrl: null,
  logoIncludesName: true,
  logoIncludesWordmark: true,
};

export function normalizeBranding(raw: any): BrandingConfig {
  if (!raw || typeof raw !== 'object') {
    return { ...defaultBranding };
  }

  const safeStr = (val: any, fallback: string): string => {
    if (typeof val === 'string' && val.trim() && val !== '[object Object]' && val !== 'null' && val !== 'undefined') {
      return val.trim();
    }
    return fallback;
  };

  // Migrate legacy ORION SCM OS branding so stale local/session/IndexedDB values
  // from older deployments cannot override the canonical ORION-9 identity.
  const legacyNames = new Set(['ORION SCM OS', 'Orion SCM OS', 'ORION 9 OS', 'Orion 9 OS']);
  const legacyLogoPaths = new Set(['/orion-9-logo.png']);
  const cleanLegacyName = (value: any): any => legacyNames.has(String(value ?? '').trim()) ? null : value;
  const cleanLegacyLogo = (value: any): any => legacyLogoPaths.has(String(value ?? '').trim()) ? null : value;
  const source = { ...raw,
    osName: cleanLegacyName(raw.osName),
    productName: cleanLegacyName(raw.productName),
    appName: cleanLegacyName(raw.appName),
    applicationName: cleanLegacyName(raw.applicationName),
    logo: cleanLegacyLogo(raw.logo),
    logoUrl: cleanLegacyLogo(raw.logoUrl),
  };

  const osName = safeStr(source.osName || source.appName || source.productName || source.applicationName, defaultBranding.osName);
  const productName = safeStr(source.productName || source.applicationName || source.appName || source.osName, defaultBranding.productName);
  const appName = safeStr(source.appName || productName || osName, defaultBranding.appName);
  const applicationName = safeStr(source.applicationName || appName || productName, defaultBranding.applicationName);
  const tagline = safeStr(raw.tagline || raw.description, defaultBranding.tagline);
  const description = safeStr(raw.description || tagline, defaultBranding.description);
  const version = safeStr(raw.version, defaultBranding.version);
  const organizationName = safeStr(raw.organizationName, defaultBranding.organizationName);
  
  const rawLogo = source.logoUrl !== undefined ? source.logoUrl : (source.logo !== undefined ? source.logo : null);
  const logo = (typeof rawLogo === 'string' && rawLogo.trim() && rawLogo !== '[object Object]' && rawLogo !== 'null' && rawLogo !== 'undefined')
    ? rawLogo.trim()
    : null;
  const logoUrl = logo;

  const rawFavicon = raw.faviconUrl !== undefined ? raw.faviconUrl : null;
  const faviconUrl = (typeof rawFavicon === 'string' && rawFavicon.trim() && rawFavicon !== '[object Object]' && rawFavicon !== 'null' && rawFavicon !== 'undefined')
    ? rawFavicon.trim()
    : null;

  const logoIncludesWordmark = raw.logoIncludesWordmark !== undefined 
    ? Boolean(raw.logoIncludesWordmark)
    : (raw.logoIncludesName !== undefined ? Boolean(raw.logoIncludesName) : false);

  const logoIncludesName = raw.logoIncludesName !== undefined
    ? Boolean(raw.logoIncludesName)
    : logoIncludesWordmark;

  return {
    osName,
    productName,
    appName,
    applicationName,
    tagline,
    description,
    version,
    organizationName,
    logo,
    logoUrl,
    faviconUrl,
    logoIncludesName,
    logoIncludesWordmark,
  };
}

export class BrandingService {
  private cachedBranding: BrandingConfig | null = null;

  /**
   * Synchronously retrieves the effective branding configuration from cache, localStorage, sessionStorage, or defaults.
   */
  getEffectiveBranding(): BrandingConfig {
    if (this.cachedBranding) return this.cachedBranding;
    if (typeof window === 'undefined') return { ...defaultBranding };
    try {
      // Check primary key first, fallback to legacy key or sessionStorage
      const raw = localStorage.getItem(PRIMARY_BRANDING_KEY) || 
                  localStorage.getItem(LEGACY_BRANDING_KEY) ||
                  (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(PRIMARY_BRANDING_KEY) : null) ||
                  (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(LEGACY_BRANDING_KEY) : null);
      if (!raw) return { ...defaultBranding };
      const parsed = JSON.parse(raw);
      const normalized = normalizeBranding(parsed);
      this.cachedBranding = normalized;
      return normalized;
    } catch (err) {
      return { ...defaultBranding };
    }
  }

  /**
   * Alias to getEffectiveBranding for backward compatibility.
   */
  getBrandingSync(): BrandingConfig {
    return this.getEffectiveBranding();
  }

  /**
   * Validates branding data before persisting.
   */
  validateBranding(data: Partial<BrandingConfig>): void {
    if (data.logo && typeof data.logo === 'string') {
      // Check if image data exceeds ~4MB data URL (approximates 2.5-3MB raw image)
      if (data.logo.length > 4 * 1024 * 1024) {
        throw new Error('Logo image is too large. Maximum size is 2MB.');
      }
    }
    if (data.logoUrl && typeof data.logoUrl === 'string') {
      if (data.logoUrl.length > 4 * 1024 * 1024) {
        throw new Error('Logo image is too large. Maximum size is 2MB.');
      }
    }
  }

  /**
   * Asynchronously loads branding configuration from remote API, falling back to local stores.
   */
  async getBranding(): Promise<BrandingConfig> {
    // 1. Try remote fetch if available
    try {
      const apiUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/branding` : '/api/branding';
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 2500) : null;

      const res = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller ? controller.signal : undefined,
      });

      if (timeoutId) clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json && json.success && json.data && typeof json.data === 'object') {
          const normalized = normalizeBranding(json.data);
          
          // Cache locally to both keys
          try {
            localStorage.setItem(PRIMARY_BRANDING_KEY, JSON.stringify(normalized));
            localStorage.setItem(LEGACY_BRANDING_KEY, JSON.stringify(normalized));
          } catch (e) {}

          if (brandingStore) {
            try {
              await brandingStore.setItem(PRIMARY_BRANDING_KEY, JSON.stringify(normalized));
              await brandingStore.setItem(LEGACY_BRANDING_KEY, JSON.stringify(normalized));
            } catch (e) {}
          }

          return normalized;
        }
      }
    } catch (err) {
      // Non-fatal: remote backend route may be absent or offline in demo/hosted mode
      console.warn('[ORION-BR] Remote branding fetch unavailable, using local persistence.', err);
    }

    // 2. Fallback to LocalForage (IndexedDB)
    try {
      if (brandingStore) {
        const raw = await brandingStore.getItem<string>(PRIMARY_BRANDING_KEY) || 
                    await brandingStore.getItem<string>(LEGACY_BRANDING_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return normalizeBranding(parsed);
        }
      }
    } catch (err) {
      console.warn('[ORION-BR] Failed to read branding from localforage', err);
    }

    // 3. Fallback to localStorage / defaults
    return this.getEffectiveBranding();
  }

  /**
   * Persists branding configuration across remote API and local storage mechanisms.
   */
  async saveBranding(data: Partial<BrandingConfig>): Promise<{ success: boolean; method: 'remote' | 'local'; config: BrandingConfig }> {
    this.validateBranding(data);

    const existing = await this.getBranding();
    const updated = normalizeBranding({
      ...existing,
      ...data,
      // Ensure matching synchronized names & taglines
      appName: data.appName || data.productName || data.applicationName || data.osName || existing.appName,
      applicationName: data.applicationName || data.appName || data.productName || existing.applicationName,
      productName: data.productName || data.appName || existing.productName,
      osName: data.osName || data.appName || existing.osName,
      tagline: data.tagline || data.description || existing.tagline,
      description: data.description || data.tagline || existing.description,
      logo: data.logo !== undefined ? data.logo : (data.logoUrl !== undefined ? data.logoUrl : existing.logo),
      logoUrl: data.logoUrl !== undefined ? data.logoUrl : (data.logo !== undefined ? data.logo : existing.logoUrl),
      logoIncludesWordmark: data.logoIncludesWordmark !== undefined 
        ? Boolean(data.logoIncludesWordmark)
        : (data.logoIncludesName !== undefined ? Boolean(data.logoIncludesName) : Boolean(existing.logoIncludesWordmark)),
      logoIncludesName: data.logoIncludesName !== undefined 
        ? Boolean(data.logoIncludesName)
        : (data.logoIncludesWordmark !== undefined ? Boolean(data.logoIncludesWordmark) : Boolean(existing.logoIncludesName)),
    });

    let localSaved = false;
    let localForageError: any = null;
    let localStorageError: any = null;

    // 1. Perform Local Persistence (LocalForage / IndexedDB)
    try {
      if (brandingStore) {
        await brandingStore.setItem(PRIMARY_BRANDING_KEY, JSON.stringify(updated));
        await brandingStore.setItem(LEGACY_BRANDING_KEY, JSON.stringify(updated));
        localSaved = true;
      }
    } catch (err) {
      localForageError = err;
      console.warn('[ORION-BR] LocalForage branding save failed:', err);
    }

    // 2. Perform Local Persistence (localStorage)
    try {
      localStorage.setItem(PRIMARY_BRANDING_KEY, JSON.stringify(updated));
      localStorage.setItem(LEGACY_BRANDING_KEY, JSON.stringify(updated));
      localSaved = true;
    } catch (err) {
      localStorageError = err;
      console.warn('[ORION-BR] LocalStorage branding save failed:', err);

      // Handle QuotaExceededError by storing metadata without large image in localStorage
      // while IndexedDB retains the full asset
      try {
        const lightweightConfig = { ...updated, logo: null, logoUrl: null };
        localStorage.setItem(PRIMARY_BRANDING_KEY, JSON.stringify(lightweightConfig));
        localStorage.setItem(LEGACY_BRANDING_KEY, JSON.stringify(lightweightConfig));
        localSaved = true;
      } catch (innerErr) {
        console.warn('[ORION-BR] Fallback lightweight localStorage save failed:', innerErr);
      }
    }

    // 2b. Perform Local Persistence (sessionStorage)
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(PRIMARY_BRANDING_KEY, JSON.stringify(updated));
        sessionStorage.setItem(LEGACY_BRANDING_KEY, JSON.stringify(updated));
        localSaved = true;
      }
    } catch (sessionErr) {}

    // Always update in-memory active cache
    this.cachedBranding = updated;

    // 3. Perform Remote Persistence (if server endpoint available)
    let remoteSaved = false;
    try {
      const apiUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/branding` : '/api/branding';
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 3500) : null;

      const res = await fetch(apiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
        signal: controller ? controller.signal : undefined,
      });

      if (timeoutId) clearTimeout(timeoutId);

      if (res.ok) {
        remoteSaved = true;
      } else {
        console.warn('[ORION-BR] Remote branding save returned non-OK status:', res.status);
      }
    } catch (e) {
      console.warn('[ORION-BR] Remote branding save network/timeout error, falling back to local.', e);
    }

    // 4. Verify outcome: Only throw if BOTH remote and local persistence failed
    if (!remoteSaved && !localSaved) {
      throw new Error(
        `Unable to persist branding configuration. LocalForage error: ${localForageError?.message || 'none'}, LocalStorage error: ${localStorageError?.message || 'none'}`
      );
    }

    const method: 'remote' | 'local' = remoteSaved ? 'remote' : 'local';

    // 5. Update browser document title immediately
    if (typeof document !== 'undefined') {
      document.title = updated.productName || updated.appName || 'ORION-9';
    }

    // 6. Dispatch events to notify all active UI components immediately
    try {
      window.dispatchEvent(new CustomEvent('orion-branding-updated', { detail: updated }));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}

    return {
      success: true,
      method,
      config: updated,
    };
  }

  /**
   * Alias to saveBranding for backward compatibility with existing callers.
   */
  async updateBranding(data: Partial<BrandingConfig>): Promise<{ success: boolean; method: 'remote' | 'local'; config: BrandingConfig }> {
    return this.saveBranding(data);
  }

  /**
   * Resets branding configuration to defaults and persists the reset.
   */
  async resetBranding(): Promise<BrandingConfig> {
    const resetConfig = { ...defaultBranding };

    try {
      const apiUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/branding` : '/api/branding';
      await fetch(apiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resetConfig),
      });
    } catch (e) {}

    try {
      if (brandingStore) {
        await brandingStore.removeItem(PRIMARY_BRANDING_KEY);
        await brandingStore.removeItem(LEGACY_BRANDING_KEY);
      }
      localStorage.removeItem(PRIMARY_BRANDING_KEY);
      localStorage.removeItem(LEGACY_BRANDING_KEY);
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(PRIMARY_BRANDING_KEY);
        sessionStorage.removeItem(LEGACY_BRANDING_KEY);
      }
    } catch (e) {}

    this.cachedBranding = { ...defaultBranding };

    if (typeof document !== 'undefined') {
      document.title = defaultBranding.appName;
    }

    try {
      window.dispatchEvent(new CustomEvent('orion-branding-updated', { detail: defaultBranding }));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}

    return resetConfig;
  }
}

export const brandingRepository = new BrandingService();

export const getBranding = async (): Promise<BrandingConfig> => {
  return await brandingRepository.getBranding();
};

export const saveBranding = async (
  branding: Partial<BrandingConfig>
): Promise<{ success: boolean; method: 'remote' | 'local'; config: BrandingConfig }> => {
  return await brandingRepository.saveBranding(branding);
};

export const resetBranding = async (): Promise<BrandingConfig> => {
  return await brandingRepository.resetBranding();
};

export const getEffectiveBranding = (): BrandingConfig => {
  return brandingRepository.getEffectiveBranding();
};

export const validateBranding = (data: Partial<BrandingConfig>): void => {
  brandingRepository.validateBranding(data);
};
