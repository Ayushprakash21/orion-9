/**
 * ORION-9 GLOBAL LOCALIZATION & LANGUAGE SYSTEM
 * Authoritative type definitions for i18n, supported locales, and translation schema.
 */

export type SupportedLocale =
  | 'en' | 'hi' | 'es' | 'fr' | 'de' | 'pt' | 'it' | 'zh' | 'ja' | 'ko'
  | 'ar' | 'ru' | 'bn' | 'mr' | 'te' | 'ta' | 'gu' | 'kn' | 'ml' | 'pa'
  | 'tr' | 'nl' | 'pl' | 'uk' | 'vi' | 'th' | 'id' | 'he' | 'fa' | 'ur'
  | (string & {});

export type SupportedLanguage = SupportedLocale; // Canonical alias

export interface LocaleInfo {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
  bcp47: string;
  recommended?: boolean;
}

export const SUPPORTED_LOCALES: Record<string, LocaleInfo> = {
  en: { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr', bcp47: 'en-US', recommended: true },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr', bcp47: 'hi-IN', recommended: true },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr', bcp47: 'es-ES', recommended: true },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr', bcp47: 'fr-FR', recommended: true },
  de: { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr', bcp47: 'de-DE', recommended: true },
  pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português', dir: 'ltr', bcp47: 'pt-BR', recommended: true },
  it: { code: 'it', name: 'Italian', nativeName: 'Italiano', dir: 'ltr', bcp47: 'it-IT', recommended: true },
  zh: { code: 'zh', name: 'Chinese', nativeName: '中文', dir: 'ltr', bcp47: 'zh-CN', recommended: true },
  ja: { code: 'ja', name: 'Japanese', nativeName: '日本語', dir: 'ltr', bcp47: 'ja-JP', recommended: true },
  ko: { code: 'ko', name: 'Korean', nativeName: '한국어', dir: 'ltr', bcp47: 'ko-KR', recommended: true },
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl', bcp47: 'ar-SA', recommended: true },
  ru: { code: 'ru', name: 'Russian', nativeName: 'Русский', dir: 'ltr', bcp47: 'ru-RU', recommended: true },
  bn: { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', dir: 'ltr', bcp47: 'bn-BD' },
  mr: { code: 'mr', name: 'Marathi', nativeName: 'मराठी', dir: 'ltr', bcp47: 'mr-IN' },
  te: { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', dir: 'ltr', bcp47: 'te-IN' },
  ta: { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', dir: 'ltr', bcp47: 'ta-IN' },
  gu: { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', dir: 'ltr', bcp47: 'gu-IN' },
  kn: { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', dir: 'ltr', bcp47: 'kn-IN' },
  ml: { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', dir: 'ltr', bcp47: 'ml-IN' },
  pa: { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', dir: 'ltr', bcp47: 'pa-IN' },
  tr: { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', dir: 'ltr', bcp47: 'tr-TR' },
  nl: { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', dir: 'ltr', bcp47: 'nl-NL' },
  pl: { code: 'pl', name: 'Polish', nativeName: 'Polski', dir: 'ltr', bcp47: 'pl-PL' },
  uk: { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', dir: 'ltr', bcp47: 'uk-UA' },
  vi: { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', dir: 'ltr', bcp47: 'vi-VN' },
  th: { code: 'th', name: 'Thai', nativeName: 'ไทย', dir: 'ltr', bcp47: 'th-TH' },
  id: { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', dir: 'ltr', bcp47: 'id-ID' },
  he: { code: 'he', name: 'Hebrew', nativeName: 'עברית', dir: 'rtl', bcp47: 'he-IL' },
  fa: { code: 'fa', name: 'Persian', nativeName: 'فارسی', dir: 'rtl', bcp47: 'fa-IR' },
  ur: { code: 'ur', name: 'Urdu', nativeName: 'اردو', dir: 'rtl', bcp47: 'ur-PK' },
};

export const SUPPORTED_LOCALE_CODES: SupportedLocale[] = Object.keys(SUPPORTED_LOCALES) as SupportedLocale[];

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
