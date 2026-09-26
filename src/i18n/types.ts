/**
 * ORION-9 GLOBAL LOCALIZATION & LANGUAGE SYSTEM
 * Authoritative type definitions for i18n, supported locales, and translation schema.
 */

export type SupportedLocale = 'en' | 'hi' | 'es' | 'de';
export type SupportedLanguage = SupportedLocale; // Canonical alias

export interface LocaleInfo {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  dir: 'ltr';
  bcp47: string;
}

export const SUPPORTED_LOCALES: Record<SupportedLocale, LocaleInfo> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    dir: 'ltr',
    bcp47: 'en-US',
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    dir: 'ltr',
    bcp47: 'hi-IN',
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    dir: 'ltr',
    bcp47: 'es-ES',
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    dir: 'ltr',
    bcp47: 'de-DE',
  },
};

export const SUPPORTED_LOCALE_CODES: SupportedLocale[] = ['en', 'hi', 'es', 'de'];

export interface TranslationSchema {
  common: {
    save: string;
    cancel: string;
    apply: string;
    reset: string;
    close: string;
    edit: string;
    delete: string;
    search: string;
    filter: string;
    loading: string;
    refresh: string;
    back: string;
    status: string;
    active: string;
    inactive: string;
    default: string;
    enabled: string;
    disabled: string;
    confirm: string;
    success: string;
    error: string;
    warning: string;
    info: string;
    language: string;
    selectLanguage: string;
    orionPlatform: string;
  };
  auth: {
    signInTitle: string;
    subtitle: string;
    userIdLabel: string;
    userIdPlaceholder: string;
    continueBtn: string;
    enterPassword: string;
    enterOrionBtn: string;
    identifying: string;
    userNotFound: string;
    invalidCredentials: string;
    rememberMe: string;
    forgotPassword: string;
    otherUser: string;
    switchUser: string;
    lock: string;
    signOut: string;
    restart: string;
    shutDown: string;
    selectLanguage: string;
    verifyingCredentials: string;
    enteringOrion: string;
  };
  navigation: {
    dashboard: string;
    settings: string;
    wallpaperStudio: string;
    appearance: string;
    desktopWindows: string;
    timeRegion: string;
    notifications: string;
    privacySecurity: string;
    aiAutomation: string;
    network: string;
    storage: string;
    administration: string;
    adminOverview: string;
    controlCenter: string;
    usersRbac: string;
    orgsTenants: string;
    rolesCapabilities: string;
    brandingWhitelabel: string;
    databaseControl: string;
    myAccount: string;
    organization: string;
  };
  settings: {
    title: string;
    subtitle: string;
    languageLabel: string;
    languageDescription: string;
    currentLanguage: string;
    orgDefaultLanguage: string;
    orgDefaultLanguageDesc: string;
    saveSettings: string;
    settingsSaved: string;
    resetDefaults: string;
    operatorIdentity: string;
    editProfile: string;
    fullName: string;
    displayName: string;
    email: string;
    role: string;
    tenant: string;
    currency: string;
    timezone: string;
    dateFormat: string;
    locale: string;
    liveOperatingClock: string;
    localizationParams: string;
    userPreferences: string;
  };
  wallpaper: {
    title: string;
    subtitle: string;
    targetLabel: string;
    loginWallpaper: string;
    homeDesktop: string;
    systemGallery: string;
    createWithAi: string;
    uploadImage: string;
    applyWallpaper: string;
    resetDefault: string;
    appliedSuccess: string;
    promptPlaceholder: string;
    promptLabel: string;
    generateWallpapers: string;
    generatingWallpapers: string;
    aiProvider: string;
    ready: string;
    selectCandidate: string;
    independentIsolation: string;
  };
  desktop: {
    searchPlaceholder: string;
    quickActions: string;
    systemStatus: string;
    lockScreen: string;
    sleep: string;
    restart: string;
    shutdown: string;
    allApps: string;
    notifications: string;
    noNotifications: string;
    clearAll: string;
    battery: string;
    connected: string;
    disconnected: string;
    aboutOrion: string;
    applications: string;
    recentApplications: string;
    systemSettings: string;
    activityMonitor: string;
    closeAllWindows: string;
    lockWorkstation: string;
  };
  admin: {
    orgDefaultLanguage: string;
    userLanguageOverride: string;
    preferences: string;
    branding: string;
    organizations: string;
    users: string;
    tenantAttributes: string;
    baseCurrency: string;
    systemTimezone: string;
    operationalStatus: string;
    tenantIsolationGuarantee: string;
  };
}

export type TranslationKey =
  | `common.${keyof TranslationSchema['common']}`
  | `auth.${keyof TranslationSchema['auth']}`
  | `navigation.${keyof TranslationSchema['navigation']}`
  | `settings.${keyof TranslationSchema['settings']}`
  | `wallpaper.${keyof TranslationSchema['wallpaper']}`
  | `desktop.${keyof TranslationSchema['desktop']}`
  | `admin.${keyof TranslationSchema['admin']}`;
