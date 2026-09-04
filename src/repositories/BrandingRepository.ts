import { BrandingConfig } from '../types/auth';

const BRANDING_STORAGE_KEY = 'orion9_branding';

const defaultBranding: BrandingConfig = {
  appName: 'Orion SCM OS',
  applicationName: 'Orion SCM OS',
  organizationName: 'Enterprise Supply Chain',
  description: 'AI Supply Chain Operating System',
  logoUrl: null,
  logo: null,
  faviconUrl: null,
  logoIncludesName: false,
};

export class BrandingRepository {
  private normalizeAppName(name?: string | null): string {
    if (!name || name === 'ORION-9' || name === 'ORION 9' || name === 'Orion-9') {
      return 'Orion SCM OS';
    }
    return name;
  }

  getBrandingSync(): BrandingConfig {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(BRANDING_STORAGE_KEY) : null;
    if (!raw) {
      return defaultBranding;
    }
    try {
      const parsed = JSON.parse(raw);
      const appName = this.normalizeAppName(parsed.applicationName || parsed.appName);
      const logo = parsed.logo !== undefined ? parsed.logo : (parsed.logoUrl || null);
      const logoIncludesName = parsed.logoIncludesName !== undefined ? Boolean(parsed.logoIncludesName) : false;
      return {
        ...defaultBranding,
        ...parsed,
        appName,
        applicationName: appName,
        logo,
        logoUrl: logo,
        logoIncludesName,
      };
    } catch {
      return defaultBranding;
    }
  }

  async getBranding(): Promise<BrandingConfig> {
    const raw = localStorage.getItem(BRANDING_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(defaultBranding));
      return defaultBranding;
    }
    try {
      const parsed = JSON.parse(raw);
      const appName = this.normalizeAppName(parsed.applicationName || parsed.appName);
      const logo = parsed.logo !== undefined ? parsed.logo : (parsed.logoUrl || null);
      const logoIncludesName = parsed.logoIncludesName !== undefined ? Boolean(parsed.logoIncludesName) : false;
      const config: BrandingConfig = {
        ...defaultBranding,
        ...parsed,
        appName,
        applicationName: appName,
        logo,
        logoUrl: logo,
        logoIncludesName,
      };
      return config;
    } catch {
      return defaultBranding;
    }
  }

  async updateBranding(data: Partial<BrandingConfig>): Promise<BrandingConfig> {
    const existing = await this.getBranding();
    const appName = this.normalizeAppName(data.applicationName || data.appName || existing.applicationName || existing.appName);
    const logo = data.logo !== undefined ? data.logo : (data.logoUrl !== undefined ? data.logoUrl : existing.logo);
    const logoIncludesName = data.logoIncludesName !== undefined ? Boolean(data.logoIncludesName) : (existing.logoIncludesName || false);

    const updated: BrandingConfig = {
      ...existing,
      ...data,
      appName,
      applicationName: appName,
      logo,
      logoUrl: logo,
      logoIncludesName,
    };

    localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('orion-branding-updated'));
    window.dispatchEvent(new Event('storage'));
    return updated;
  }
}

export const brandingRepository = new BrandingRepository();

export const getBranding = async (): Promise<BrandingConfig> => {
  return await brandingRepository.getBranding();
};

export const saveBranding = async (branding: Partial<BrandingConfig>): Promise<BrandingConfig> => {
  return await brandingRepository.updateBranding(branding);
};
