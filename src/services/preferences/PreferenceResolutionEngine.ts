/**
 * ORION-9 AUTHORITATIVE PREFERENCE & POLICY RESOLUTION ENGINE
 *
 * Establishes strict settings ownership, 4-tier admin/org/user precedence,
 * revision + timestamp conflict resolution, and user/tenant isolation.
 */

import { DEFAULT_SETTINGS, SystemSettings } from '../../types/settings';
import { DEFAULT_PERSONALIZATION_SETTINGS } from '../../theme/themePresets';
import {
  DEFAULT_PREFERENCES,
  OrionAppearanceMode,
  OrionCornerRadius,
  OrionDockPosition,
  OrionThemeId,
  OrionWindowStyle,
} from '../../os/theme/OrionThemeTypes';

export const PREFERENCE_SCHEMA_VERSION = 3;

export type OrionFontFamily = 'ROBOTO' | 'LATO' | 'ARIAL';
export type OrionDisplayScale = 100 | 125 | 150 | 175 | 200;
export type OrionTextSize = 90 | 100 | 110 | 120 | 130 | 140;
export type DynamicIslandPreferenceMode = 'compact' | 'expanded' | 'minimal' | 'disabled';
export type PreferenceSyncStatus =
  | 'SYNCED'
  | 'LOCAL_ONLY'
  | 'PENDING'
  | 'SAVING'
  | 'CONFLICT'
  | 'FAILED';

export interface UserPreferencesRecord {
  userId: string;
  organizationId?: string;
  environment?: 'LIVE' | 'DEMO' | 'STAGING';
  schemaVersion?: number;
  revision?: number;
  updatedAt?: string;

  // Appearance & Theme
  theme?: 'dark' | 'light' | 'system' | 'os-obsidian';
  themeId?: OrionThemeId;
  appearanceMode?: OrionAppearanceMode;
  customAccentEnabled?: boolean;
  customAccent?: string;

  // Typography & Display Scaling
  displayScale?: OrionDisplayScale;
  textSize?: OrionTextSize;
  fontFamily?: OrionFontFamily;
  uiScale?: number;

  // Desktop & Dock
  showDesktopIcons?: boolean;
  iconSize?: 'small' | 'medium' | 'large';
  iconLayout?: 'grid' | 'freeform';
  dockPosition?: OrionDockPosition;
  dockSize?: 'small' | 'medium' | 'large';
  dockAutoHide?: boolean;
  dockMagnification?: boolean;
  dockTransparency?: number;
  dockBlur?: number;
  dockTint?: 'auto' | 'dark' | 'light' | 'accent';

  // Windows & Accessibility / Motion
  windowStyle?: OrionWindowStyle;
  cornerRadius?: OrionCornerRadius;
  windowControlPosition?: 'left' | 'right';
  reducedMotion?: boolean;
  reducedTransparency?: boolean;
  animationStyle?: 'premium' | 'balanced' | 'minimal' | 'reduced';
  dockBounceOnLaunch?: boolean;
  genieEffectEnabled?: boolean;
  highContrast?: boolean;
  highContrastFocusRing?: boolean;
  colorFilter?: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'grayscale';

  // Wallpaper
  wallpaperId?: string;
  wallpaperUrl?: string;
  wallpaperBlur?: number;
  wallpaperDim?: number;

  // Dynamic Island
  dynamicIslandMode?: DynamicIslandPreferenceMode;
  dynamicIslandPinned?: boolean;

  // Locale
  preferredLanguage?: string;

  // Legacy grouped layout
  desktopLayout?: {
    iconGridSize?: 'small' | 'medium' | 'large';
    dockPosition?: 'bottom' | 'top' | 'left' | 'right';
    autoHideDock?: boolean;
    soundEnabled?: boolean;
  };

  // Tracks keys explicitly customized by the user so unedited keys inherit org defaults
  explicitFields?: string[];

  // Synchronization telemetry
  lastSyncedAt?: string;
  lastLocalSavedAt?: string;
  syncedFromDevice?: string;
  localSaved?: boolean;
  cloudSynced?: boolean;
  pendingSync?: boolean;
  syncStatus?: PreferenceSyncStatus;
  syncError?: string;
  userReadableError?: string;
  isRetryable?: boolean;
  version?: number;
  conflictDetails?: {
    remoteTimestamp?: string;
    localTimestamp?: string;
    resolution?: 'LOCAL_WON' | 'REMOTE_WON' | 'MERGED';
  };
}

export interface OrganizationSettingsPolicy {
  organizationId: string;
  tenantId: string;
  schemaVersion: number;
  revision: number;
  updatedAt: string;
  updatedBy?: string;

  // Organization Defaults
  defaultTheme?: 'dark' | 'light' | 'system';
  defaultThemeId?: OrionThemeId;
  defaultAppearanceMode?: OrionAppearanceMode;
  defaultFontFamily?: OrionFontFamily;
  defaultTextSize?: OrionTextSize;
  defaultDisplayScale?: OrionDisplayScale;
  defaultDockPosition?: OrionDockPosition;
  defaultDockAutoHide?: boolean;
  defaultShowDesktopIcons?: boolean;
  defaultDynamicIslandMode?: DynamicIslandPreferenceMode;
  defaultReducedMotion?: boolean;
  defaultReducedTransparency?: boolean;
  defaultLanguage?: string;

  // Enforced Policy Flags (when true, overrides personal user choice)
  enforceTheme?: boolean;
  enforceFont?: boolean;
  enforceScale?: boolean;
  enforceDock?: boolean;
  enforceAccessibility?: boolean;
  enforceLanguage?: boolean;
}

export interface ResolvedPreferencesResult {
  effective: UserPreferencesRecord;
  lockedFields: Set<string>;
  orgPolicy: OrganizationSettingsPolicy | null;
}

export const DISPLAY_SCALE_VALUES: readonly OrionDisplayScale[] = [100, 125, 150, 175, 200];
export const TEXT_SIZE_VALUES: readonly OrionTextSize[] = [90, 100, 110, 120, 130, 140];
export const FONT_FAMILY_VALUES: readonly OrionFontFamily[] = ['ROBOTO', 'LATO', 'ARIAL'];
export const DOCK_POSITION_VALUES: readonly OrionDockPosition[] = ['bottom', 'top', 'left', 'right'];
export const ISLAND_MODE_VALUES: readonly DynamicIslandPreferenceMode[] = ['compact', 'expanded', 'minimal', 'disabled'];

export function sanitizeDisplayScale(val: unknown): OrionDisplayScale {
  const num = Number(val);
  return DISPLAY_SCALE_VALUES.includes(num as OrionDisplayScale) ? (num as OrionDisplayScale) : 100;
}

export function sanitizeTextSize(val: unknown): OrionTextSize {
  const num = Number(val);
  return TEXT_SIZE_VALUES.includes(num as OrionTextSize) ? (num as OrionTextSize) : 100;
}

export function sanitizeFontFamily(val: unknown): OrionFontFamily {
  const upper = typeof val === 'string' ? val.toUpperCase().trim() : '';
  return FONT_FAMILY_VALUES.includes(upper as OrionFontFamily) ? (upper as OrionFontFamily) : 'ROBOTO';
}

export function normalizeUserPreferenceRecord(
  userId: string,
  raw?: Partial<UserPreferencesRecord> | null
): UserPreferencesRecord {
  const src = raw && typeof raw === 'object' ? raw : {};
  const dockPosition =
    DOCK_POSITION_VALUES.includes(src.dockPosition as OrionDockPosition)
      ? (src.dockPosition as OrionDockPosition)
      : DOCK_POSITION_VALUES.includes(src.desktopLayout?.dockPosition as OrionDockPosition)
        ? (src.desktopLayout!.dockPosition as OrionDockPosition)
        : DEFAULT_PREFERENCES.dockPosition;

  const dockAutoHide =
    src.dockAutoHide !== undefined
      ? Boolean(src.dockAutoHide)
      : src.desktopLayout?.autoHideDock !== undefined
        ? Boolean(src.desktopLayout.autoHideDock)
        : true;

  const normalizedTheme: 'dark' | 'light' | 'system' | 'os-obsidian' =
    src.theme === 'light' || src.theme === 'dark' || src.theme === 'system' || src.theme === 'os-obsidian'
      ? src.theme
      : src.appearanceMode === 'light'
        ? 'light'
        : src.appearanceMode === 'dark'
          ? 'dark'
          : (DEFAULT_SETTINGS.theme as 'dark' | 'light' | 'system') || 'system';

  const resolvedAppearanceMode: OrionAppearanceMode =
    src.appearanceMode === 'light' || src.appearanceMode === 'dark' || src.appearanceMode === 'auto'
      ? src.appearanceMode
      : normalizedTheme === 'light'
        ? 'light'
        : normalizedTheme === 'dark'
          ? 'dark'
          : 'auto';

  const resolvedThemeId: OrionThemeId =
    src.themeId && ['graphite', 'silver', 'midnight', 'forest', 'warm'].includes(src.themeId)
      ? src.themeId
      : resolvedAppearanceMode === 'light'
        ? 'silver'
        : DEFAULT_PREFERENCES.themeId;

  const dynamicIslandMode: DynamicIslandPreferenceMode =
    ISLAND_MODE_VALUES.includes(src.dynamicIslandMode as DynamicIslandPreferenceMode)
      ? (src.dynamicIslandMode as DynamicIslandPreferenceMode)
      : 'compact';

  return {
    ...src,
    userId,
    schemaVersion: PREFERENCE_SCHEMA_VERSION,
    version: typeof src.version === 'number' ? src.version : 1,
    revision: typeof src.revision === 'number' ? src.revision : (typeof src.version === 'number' ? src.version : 0),
    displayScale: sanitizeDisplayScale(src.displayScale),
    textSize: sanitizeTextSize(src.textSize),
    fontFamily: sanitizeFontFamily(src.fontFamily),
    theme: normalizedTheme,
    themeId: resolvedThemeId,
    appearanceMode: resolvedAppearanceMode,
    showDesktopIcons: src.showDesktopIcons !== undefined ? Boolean(src.showDesktopIcons) : true,
    iconSize: src.iconSize || src.desktopLayout?.iconGridSize || DEFAULT_PERSONALIZATION_SETTINGS.iconSize,
    iconLayout: src.iconLayout || DEFAULT_PERSONALIZATION_SETTINGS.iconLayout,
    dockPosition,
    dockSize: src.dockSize || DEFAULT_PERSONALIZATION_SETTINGS.dockSize,
    dockAutoHide,
    dockMagnification: src.dockMagnification !== undefined ? Boolean(src.dockMagnification) : true,
    dockTransparency: typeof src.dockTransparency === 'number' ? Math.max(0, Math.min(100, src.dockTransparency)) : 85,
    dockBlur: typeof src.dockBlur === 'number' ? Math.max(0, Math.min(100, src.dockBlur)) : 80,
    dockTint: src.dockTint || 'auto',
    windowControlPosition: src.windowControlPosition === 'right' ? 'right' : 'left',
    windowStyle: src.windowStyle || 'standard',
    cornerRadius: src.cornerRadius || 'standard',
    reducedMotion: Boolean(src.reducedMotion),
    reducedTransparency: Boolean(src.reducedTransparency),
    animationStyle: src.animationStyle || (src.reducedMotion ? 'reduced' : 'premium'),
    dockBounceOnLaunch: src.dockBounceOnLaunch !== undefined ? Boolean(src.dockBounceOnLaunch) : true,
    genieEffectEnabled: src.genieEffectEnabled !== undefined ? Boolean(src.genieEffectEnabled) : true,
    dynamicIslandMode,
    dynamicIslandPinned: Boolean(src.dynamicIslandPinned),
    explicitFields: Array.isArray(src.explicitFields) ? Array.from(new Set(src.explicitFields)) : [],
  };
}

function getRecordTimestampMs(rec?: { updatedAt?: string; lastSyncedAt?: string; lastLocalSavedAt?: string } | null): number {
  if (!rec) return 0;
  const iso = rec.updatedAt || rec.lastSyncedAt || rec.lastLocalSavedAt;
  if (!iso) return 0;
  const parsed = Date.parse(iso);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Deterministically reconciles local cached user preferences with remote cloud preferences
 * using user identity matching, monotonic revision numbers, timestamps, and pending-offline flags.
 */
export function reconcileUserPreferences(
  expectedUserId: string,
  localRecord?: UserPreferencesRecord | null,
  remoteRecord?: UserPreferencesRecord | null
): UserPreferencesRecord | null {
  const validLocal = localRecord && localRecord.userId === expectedUserId ? localRecord : null;
  const validRemote = remoteRecord && remoteRecord.userId === expectedUserId ? remoteRecord : null;

  if (!validLocal && !validRemote) return null;
  if (validLocal && !validRemote) return normalizeUserPreferenceRecord(expectedUserId, validLocal);
  if (!validLocal && validRemote) return normalizeUserPreferenceRecord(expectedUserId, validRemote);

  const local = validLocal!;
  const remote = validRemote!;

  const localRev = local.revision ?? local.version ?? 0;
  const remoteRev = remote.revision ?? remote.version ?? 0;
  const localTs = getRecordTimestampMs(local);
  const remoteTs = getRecordTimestampMs(remote);

  // If local has unsynchronized offline modifications, preserve local overrides on top of newer remote fields
  if (local.pendingSync || local.syncStatus === 'LOCAL_ONLY' || local.syncStatus === 'PENDING') {
    const mergedExplicit = Array.from(
      new Set([...(remote.explicitFields || []), ...(local.explicitFields || [])])
    );
    return normalizeUserPreferenceRecord(expectedUserId, {
      ...remote,
      ...local,
      explicitFields: mergedExplicit,
      revision: Math.max(localRev, remoteRev),
      pendingSync: true,
      syncStatus: local.syncStatus || 'PENDING',
    });
  }

  // Otherwise pick deterministically by higher timestamp, breaking ties with revision
  if (remoteTs > localTs || (remoteTs === localTs && remoteRev >= localRev)) {
    return normalizeUserPreferenceRecord(expectedUserId, {
      ...remote,
      cloudSynced: true,
      pendingSync: false,
      syncStatus: 'SYNCED',
    });
  }

  return normalizeUserPreferenceRecord(expectedUserId, local);
}

/**
 * Applies the 4-tier settings precedence rule:
 * 1. Enforced Admin Policy
 * 2. Organization Default (when user has no explicit permitted override)
 * 3. User Preference (when permitted)
 * 4. System Default
 */
export function resolveEffectivePreferences(
  expectedUserId: string,
  userPrefsRaw: Partial<UserPreferencesRecord> | null | undefined,
  orgPolicy: OrganizationSettingsPolicy | null | undefined
): ResolvedPreferencesResult {
  const userNorm = normalizeUserPreferenceRecord(expectedUserId, userPrefsRaw);
  const explicitSet = new Set(userNorm.explicitFields || []);
  const lockedFields = new Set<string>();
  const resolved: UserPreferencesRecord = { ...userNorm };

  if (!orgPolicy) {
    return { effective: resolved, lockedFields, orgPolicy: null };
  }

  const applyOrgField = <K extends keyof UserPreferencesRecord>(
    field: K,
    orgDefaultValue: UserPreferencesRecord[K] | undefined,
    enforced: boolean | undefined,
    lockKey: string
  ) => {
    if (enforced && orgDefaultValue !== undefined) {
      resolved[field] = orgDefaultValue;
      lockedFields.add(lockKey);
      return;
    }
    if (!explicitSet.has(String(field)) && orgDefaultValue !== undefined) {
      resolved[field] = orgDefaultValue;
    }
  };

  // Tier 1 & Tier 2: Theme
  if (orgPolicy.enforceTheme) {
    if (orgPolicy.defaultTheme) resolved.theme = orgPolicy.defaultTheme;
    if (orgPolicy.defaultThemeId) resolved.themeId = orgPolicy.defaultThemeId;
    if (orgPolicy.defaultAppearanceMode) resolved.appearanceMode = orgPolicy.defaultAppearanceMode;
    lockedFields.add('theme');
  } else {
    if (!explicitSet.has('theme') && orgPolicy.defaultTheme) {
      resolved.theme = orgPolicy.defaultTheme;
      resolved.appearanceMode =
        orgPolicy.defaultTheme === 'light' ? 'light' : orgPolicy.defaultTheme === 'dark' ? 'dark' : 'auto';
      resolved.themeId =
        orgPolicy.defaultThemeId || (resolved.appearanceMode === 'light' ? 'silver' : 'graphite');
    } else if (!explicitSet.has('themeId') && orgPolicy.defaultThemeId) {
      resolved.themeId = orgPolicy.defaultThemeId;
    }
  }

  // Font
  applyOrgField('fontFamily', orgPolicy.defaultFontFamily, orgPolicy.enforceFont, 'fontFamily');

  // Scale & Text Size
  applyOrgField('displayScale', orgPolicy.defaultDisplayScale, orgPolicy.enforceScale, 'displayScale');
  applyOrgField('textSize', orgPolicy.defaultTextSize, orgPolicy.enforceScale, 'textSize');

  // Dock & Desktop Icons
  applyOrgField('dockPosition', orgPolicy.defaultDockPosition, orgPolicy.enforceDock, 'dockPosition');
  applyOrgField('dockAutoHide', orgPolicy.defaultDockAutoHide, orgPolicy.enforceDock, 'dockAutoHide');
  applyOrgField('showDesktopIcons', orgPolicy.defaultShowDesktopIcons, orgPolicy.enforceDock, 'showDesktopIcons');
  applyOrgField('dynamicIslandMode', orgPolicy.defaultDynamicIslandMode, orgPolicy.enforceDock, 'dynamicIslandMode');

  // Accessibility
  applyOrgField('reducedMotion', orgPolicy.defaultReducedMotion, orgPolicy.enforceAccessibility, 'reducedMotion');
  applyOrgField(
    'reducedTransparency',
    orgPolicy.defaultReducedTransparency,
    orgPolicy.enforceAccessibility,
    'reducedTransparency'
  );
  if (orgPolicy.enforceAccessibility && orgPolicy.defaultReducedMotion) {
    resolved.animationStyle = 'reduced';
  }

  // Language
  applyOrgField('preferredLanguage', orgPolicy.defaultLanguage, orgPolicy.enforceLanguage, 'preferredLanguage');

  return {
    effective: normalizeUserPreferenceRecord(expectedUserId, resolved),
    lockedFields,
    orgPolicy,
  };
}

/**
 * Reconciles IndexedDB vs localStorage SystemSettings snapshots safely using
 * identity guards (userId, tenantId) + timestamp/revision comparisons.
 */
export function reconcileSystemSettingsSnapshots(
  localCached: Partial<SystemSettings> | null | undefined,
  idbCached: Partial<SystemSettings> | null | undefined,
  expectedUserId?: string | null,
  expectedTenantId?: string | null
): Partial<SystemSettings> | null {
  const isOwnerMatch = (candidate: any): boolean => {
    if (!candidate || typeof candidate !== 'object') return false;
    if (expectedUserId && candidate._ownerUserId && candidate._ownerUserId !== expectedUserId) return false;
    if (expectedTenantId && candidate._ownerTenantId && candidate._ownerTenantId !== expectedTenantId) return false;
    return true;
  };

  const validLocal = isOwnerMatch(localCached) ? (localCached as any) : null;
  const validIdb = isOwnerMatch(idbCached) ? (idbCached as any) : null;

  if (!validLocal && !validIdb) return null;
  if (validLocal && !validIdb) return validLocal;
  if (!validLocal && validIdb) return validIdb;

  const localTs = validLocal._updatedAt ? Date.parse(validLocal._updatedAt) || 0 : 0;
  const idbTs = validIdb._updatedAt ? Date.parse(validIdb._updatedAt) || 0 : 0;
  const localRev = Number(validLocal._revision || 0);
  const idbRev = Number(validIdb._revision || 0);

  if (idbTs > localTs || (idbTs === localTs && idbRev > localRev)) {
    return {
      ...validLocal,
      ...validIdb,
      personalization: {
        ...(validLocal.personalization || {}),
        ...(validIdb.personalization || {}),
      },
    };
  }

  return {
    ...validIdb,
    ...validLocal,
    personalization: {
      ...(validIdb.personalization || {}),
      ...(validLocal.personalization || {}),
    },
  };
}
