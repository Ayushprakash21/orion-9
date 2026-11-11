import React from 'react';
import { useAuth } from '../store/AuthContext';
import { useOptionalSupplyChain } from '../store/SupplyChainContext';
import { dbManager } from '../core/database/DatabaseConnectionManager';
import {
  userPersistenceService,
  UserPreferencesRecord,
} from '../services/userPersistenceService';
import {
  DISPLAY_SCALE_VALUES,
  DOCK_POSITION_VALUES,
  DynamicIslandPreferenceMode,
  FONT_FAMILY_VALUES,
  ISLAND_MODE_VALUES,
  OrionDisplayScale,
  OrionFontFamily,
  OrionTextSize,
  PreferenceSyncStatus,
  TEXT_SIZE_VALUES,
  normalizeUserPreferenceRecord,
  resolveEffectivePreferences,
} from '../services/preferences/PreferenceResolutionEngine';
import {
  applyResolvedPreferencesToDOMAndRuntime,
} from '../services/preferences/PreferenceRuntimeApplier';
import { CheckCircle2, Cloud, CloudOff, AlertTriangle, Loader2, RefreshCw, Lock } from 'lucide-react';

export type { OrionFontFamily, OrionDisplayScale, OrionTextSize };

export interface OrionDisplayPreferences {
  displayScale: OrionDisplayScale;
  textSize: OrionTextSize;
  fontFamily: OrionFontFamily;
}

export const DEFAULT_DISPLAY_PREFERENCES: OrionDisplayPreferences = {
  displayScale: 100,
  textSize: 100,
  fontFamily: 'ROBOTO',
};

export const DISPLAY_SCALE_OPTIONS: OrionDisplayScale[] = [...DISPLAY_SCALE_VALUES];
export const TEXT_SIZE_OPTIONS: OrionTextSize[] = [...TEXT_SIZE_VALUES];
export const FONT_OPTIONS: OrionFontFamily[] = [...FONT_FAMILY_VALUES];

const FONT_STACKS: Record<OrionFontFamily, string> = {
  ROBOTO: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "Segoe UI", Arial, sans-serif',
  LATO: '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
  ARIAL: 'Arial, Helvetica, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const sanitize = (raw: Partial<OrionDisplayPreferences> | null | undefined): OrionDisplayPreferences => {
  const displayScale = DISPLAY_SCALE_OPTIONS.includes(Number(raw?.displayScale) as OrionDisplayScale)
    ? (Number(raw?.displayScale) as OrionDisplayScale)
    : DEFAULT_DISPLAY_PREFERENCES.displayScale;
  const textSize = TEXT_SIZE_OPTIONS.includes(Number(raw?.textSize) as OrionTextSize)
    ? (Number(raw?.textSize) as OrionTextSize)
    : DEFAULT_DISPLAY_PREFERENCES.textSize;
  const fontFamily = FONT_OPTIONS.includes(raw?.fontFamily as OrionFontFamily)
    ? (raw!.fontFamily as OrionFontFamily)
    : DEFAULT_DISPLAY_PREFERENCES.fontFamily;
  return { displayScale, textSize, fontFamily };
};

export const getDisplayPreferenceKey = (userId?: string | null) =>
  `orion_display_preferences:${userId || 'guest'}`;

export const readDisplayPreferences = (userId?: string | null): OrionDisplayPreferences => {
  if (typeof window === 'undefined') return DEFAULT_DISPLAY_PREFERENCES;
  try {
    if (userId) {
      const env = dbManager.getEnvironment();
      const orgId = 'ORION_PLATFORM';
      const cloudCached = userPersistenceService.getUserPreferencesLocalSync(userId, env);
      const orgPolicy = userPersistenceService.getOrganizationPolicyLocalSync(orgId, env);
      if (cloudCached || orgPolicy) {
        const resolved = resolveEffectivePreferences(userId, cloudCached, orgPolicy);
        return sanitize({
          displayScale: resolved.effective.displayScale,
          textSize: resolved.effective.textSize,
          fontFamily: resolved.effective.fontFamily,
        });
      }
    }
    const raw = localStorage.getItem(getDisplayPreferenceKey(userId));
    return sanitize(raw ? JSON.parse(raw) : null);
  } catch {
    return DEFAULT_DISPLAY_PREFERENCES;
  }
};

export const applyDisplayPreferences = (preferences: OrionDisplayPreferences) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--orion-text-scale', String(preferences.textSize / 100));
  root.style.setProperty('--orion-display-scale', String(preferences.displayScale / 100));
  root.style.setProperty('--orion-font-family', FONT_STACKS[preferences.fontFamily]);
  root.dataset.orionFont = preferences.fontFamily.toLowerCase();
  root.dataset.orionDisplayScale = String(preferences.displayScale);
  root.dataset.orionTextSize = String(preferences.textSize);
};

export const saveDisplayPreferences = (userId: string | null | undefined, next: OrionDisplayPreferences) => {
  const normalized = sanitize(next);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(getDisplayPreferenceKey(userId), JSON.stringify(normalized));
      window.dispatchEvent(new CustomEvent('orion-display-preferences-changed', { detail: { userId, ...normalized } }));
    } catch {}
  }
  applyDisplayPreferences(normalized);

  if (userId) {
    void userPersistenceService
      .saveUserPreferences(userId, {
        displayScale: normalized.displayScale,
        textSize: normalized.textSize,
        fontFamily: normalized.fontFamily,
      })
      .catch(() => {});
  }

  return normalized;
};

export function OrionDisplayPreferencesProvider() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id || null;

  React.useEffect(() => {
    const apply = (ev?: Event) => {
      // Ignore storage updates from unrelated user keys
      if (ev && ev instanceof StorageEvent && ev.key) {
        const activeUser = userId || 'guest';
        const isOwnKey =
          ev.key.endsWith(`:${activeUser}`) ||
          ev.key.endsWith(`_${activeUser}`) ||
          ev.key.startsWith('orion_org_os_policy_');
        if (!isOwnKey) return;
      }
      applyDisplayPreferences(readDisplayPreferences(userId));
    };

    apply();
    window.addEventListener('orion-display-preferences-changed', apply as EventListener);
    window.addEventListener('storage', apply as EventListener);
    return () => {
      window.removeEventListener('orion-display-preferences-changed', apply as EventListener);
      window.removeEventListener('storage', apply as EventListener);
    };
  }, [userId]);

  return null;
}

export function DisplayPreferencesControls({
  compact = false,
  userId,
  showResolution = true,
}: {
  compact?: boolean;
  userId?: string | null;
  showResolution?: boolean;
}) {
  const { currentUser } = useAuth();
  const supplyChain = useOptionalSupplyChain();
  const effectiveUserId = userId ?? currentUser?.id ?? 'guest';
  const effectiveOrgId = currentUser?.organizationId || 'ORION_PLATFORM';
  const activeEnv = dbManager.getEnvironment();

  const loadResolvedSnapshot = React.useCallback(() => {
    const localPrefs = userPersistenceService.getUserPreferencesLocalSync(effectiveUserId, activeEnv);
    const orgPolicy = userPersistenceService.getOrganizationPolicyLocalSync(effectiveOrgId, activeEnv);
    const fallbackDisplay = readDisplayPreferences(effectiveUserId);
    const mergedSeed: Partial<UserPreferencesRecord> = localPrefs
      ? localPrefs
      : {
          userId: effectiveUserId,
          displayScale: fallbackDisplay.displayScale,
          textSize: fallbackDisplay.textSize,
          fontFamily: fallbackDisplay.fontFamily,
          theme: (supplyChain?.settings?.theme as any) || 'system',
          showDesktopIcons: supplyChain?.settings?.showDesktopIcons ?? true,
          dockPosition: (supplyChain?.settings?.personalization?.dockPosition as any) || 'bottom',
          dockAutoHide: supplyChain?.settings?.personalization?.dockAutoHide ?? true,
        };
    return resolveEffectivePreferences(effectiveUserId, mergedSeed, orgPolicy);
  }, [effectiveUserId, effectiveOrgId, activeEnv, supplyChain?.settings]);

  const [resolvedSnapshot, setResolvedSnapshot] = React.useState(() => loadResolvedSnapshot());
  const [syncStatus, setSyncStatus] = React.useState<PreferenceSyncStatus | 'IDLE'>(() => {
    const rec = userPersistenceService.getUserPreferencesLocalSync(effectiveUserId, activeEnv);
    return rec?.syncStatus || 'IDLE';
  });
  const [syncMessage, setSyncMessage] = React.useState<string | undefined>(undefined);
  const [viewport, setViewport] = React.useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  }));

  React.useEffect(() => {
    setResolvedSnapshot(loadResolvedSnapshot());
    const unsubSync = userPersistenceService.onPreferencesSyncChange((record) => {
      if (record.userId !== effectiveUserId) return;
      setSyncStatus(record.syncStatus || 'IDLE');
      setSyncMessage(record.userReadableError || record.syncError);
      const orgPolicy = userPersistenceService.getOrganizationPolicyLocalSync(effectiveOrgId, activeEnv);
      setResolvedSnapshot(resolveEffectivePreferences(effectiveUserId, record, orgPolicy));
    });
    const unsubOrg = userPersistenceService.onOrganizationPolicyChange((policy) => {
      if (policy.organizationId !== effectiveOrgId) return;
      const cur = userPersistenceService.getUserPreferencesLocalSync(effectiveUserId, activeEnv);
      setResolvedSnapshot(resolveEffectivePreferences(effectiveUserId, cur, policy));
    });
    return () => {
      unsubSync();
      unsubOrg();
    };
  }, [effectiveUserId, effectiveOrgId, activeEnv, loadResolvedSnapshot]);

  React.useEffect(() => {
    const onResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  const persistPatch = async (patch: Partial<UserPreferencesRecord>) => {
    const currentEffective = resolvedSnapshot.effective;
    const optimistic = normalizeUserPreferenceRecord(effectiveUserId, {
      ...currentEffective,
      ...patch,
      organizationId: effectiveOrgId,
      environment: activeEnv,
      explicitFields: Array.from(
        new Set([...(currentEffective.explicitFields || []), ...Object.keys(patch)])
      ),
    });

    const orgPolicy = userPersistenceService.getOrganizationPolicyLocalSync(effectiveOrgId, activeEnv);
    const resolvedNow = resolveEffectivePreferences(effectiveUserId, optimistic, orgPolicy);
    setResolvedSnapshot(resolvedNow);
    applyResolvedPreferencesToDOMAndRuntime(resolvedNow, { tenantId: effectiveOrgId, env: activeEnv });

    if (activeEnv === 'LIVE' || activeEnv === 'STAGING') {
      setSyncStatus('SAVING');
      setSyncMessage(undefined);
    }

    const saved = await userPersistenceService.saveUserPreferences(
      effectiveUserId,
      {
        ...patch,
        organizationId: effectiveOrgId,
        environment: activeEnv,
      },
      activeEnv
    );

    const postSaveResolved = resolveEffectivePreferences(effectiveUserId, saved, orgPolicy);
    setResolvedSnapshot(postSaveResolved);
    setSyncStatus(saved.syncStatus || 'LOCAL_ONLY');
    setSyncMessage(saved.userReadableError || saved.syncError);
  };

  const handleRetrySync = async () => {
    setSyncStatus('SAVING');
    setSyncMessage(undefined);
    try {
      const retried = await userPersistenceService.retrySync(effectiveUserId, activeEnv);
      setSyncStatus(retried.syncStatus || 'LOCAL_ONLY');
      setSyncMessage(retried.userReadableError || retried.syncError);
    } catch (err: any) {
      setSyncStatus('FAILED');
      setSyncMessage(err?.message || 'Retry synchronization failed');
    }
  };

  const enterFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch {}
  };

  const effective = resolvedSnapshot.effective;
  const locked = resolvedSnapshot.lockedFields;
  const labelClass = compact
    ? 'text-[9px] uppercase tracking-[0.16em] text-os-text-muted font-semibold'
    : 'text-[10px] uppercase tracking-[0.16em] text-os-text-muted font-semibold';

  const LockTag = ({ lockKey }: { lockKey: string }) =>
    locked.has(lockKey) ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 text-[10px] font-mono">
        <Lock className="w-2.5 h-2.5" />
        Enforced by Organization Policy
      </span>
    ) : null;

  return (
    <div className={compact ? 'space-y-4' : 'space-y-6'} data-testid="display-preferences-controls">
      {/* Truthful Persistence & Cloud Sync Banner */}
      <div
        data-testid="preferences-sync-status-banner"
        className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg border border-os-border bg-os-surface/80 text-xs"
      >
        <div className="flex items-center gap-2">
          {syncStatus === 'SAVING' ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
              <span className="text-sky-300 font-medium">Saving preferences...</span>
            </>
          ) : syncStatus === 'SYNCED' ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300 font-medium">Synced to cloud (`user_preferences/{effectiveUserId}`)</span>
            </>
          ) : syncStatus === 'PENDING' || (syncStatus === 'LOCAL_ONLY' && (activeEnv === 'LIVE' || activeEnv === 'STAGING')) ? (
            <>
              <CloudOff className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-300 font-medium">
                {syncMessage || 'Offline / pending cloud synchronization — saved locally'}
              </span>
            </>
          ) : syncStatus === 'FAILED' ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-rose-300 font-medium">
                {syncMessage || 'Failed to synchronize to cloud — saved locally'}
              </span>
            </>
          ) : (
            <>
              <Cloud className="w-3.5 h-3.5 text-os-text-muted" />
              <span className="text-os-text-secondary font-medium">
                {activeEnv === 'DEMO'
                  ? `Saved locally for user ${effectiveUserId} (${activeEnv} mode)`
                  : `Active preferences for user ${effectiveUserId}`}
              </span>
            </>
          )}
        </div>

        {(syncStatus === 'FAILED' || syncStatus === 'PENDING' || (syncStatus === 'LOCAL_ONLY' && activeEnv !== 'DEMO')) && (
          <button
            type="button"
            data-testid="retry-preferences-sync-btn"
            onClick={handleRetrySync}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-[11px] font-medium text-white cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            Retry Sync
          </button>
        )}
      </div>

      {/* Theme Mode Selector (LIGHT / DARK / SYSTEM) */}
      <div className="flex flex-col gap-3 p-4 rounded-lg bg-os-input-bg border border-os-border">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <div className="text-sm font-medium text-os-text-primary">Theme Mode</div>
            <div className="text-xs text-os-text-muted mt-1">Select visual theme preference across all Orion-9 applications.</div>
          </div>
          <LockTag lockKey="theme" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'light', label: 'Light', desc: 'Clean & crisp' },
            { id: 'dark', label: 'Dark', desc: 'Deep & focused' },
            { id: 'system', label: 'System', desc: 'Match OS' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              data-testid={`display-theme-${t.id}`}
              disabled={locked.has('theme')}
              onClick={() =>
                persistPatch({
                  theme: t.id as 'light' | 'dark' | 'system',
                  appearanceMode: t.id === 'light' ? 'light' : t.id === 'dark' ? 'dark' : 'auto',
                  themeId: t.id === 'light' ? 'silver' : 'graphite',
                })
              }
              className={`p-3 rounded-xl border flex flex-col items-start gap-1 transition-all ${
                locked.has('theme') ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
              } ${
                effective.theme === t.id
                  ? 'border-os-accent bg-os-accent/10 text-os-accent font-semibold shadow-sm'
                  : 'border-os-border bg-os-surface text-os-text-secondary hover:bg-os-surface-hover hover:text-os-text-primary'
              }`}
            >
              <span className="text-sm">{t.label}</span>
              <span className="text-[10px] text-os-text-muted font-normal">{t.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dock Position & Auto-Hide + Desktop Icons */}
      <div className="flex flex-col gap-3 p-4 rounded-lg bg-os-input-bg border border-os-border">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <div className="text-sm font-medium text-os-text-primary">Dock & Desktop Layout</div>
            <div className="text-xs text-os-text-muted mt-1">Dock anchor edge, auto-hide visibility, and desktop icon visibility.</div>
          </div>
          <LockTag lockKey="dockPosition" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DOCK_POSITION_VALUES.map((pos) => (
            <button
              key={pos}
              type="button"
              data-testid={`display-dock-pos-${pos}`}
              disabled={locked.has('dockPosition')}
              onClick={() => persistPatch({ dockPosition: pos })}
              className={`h-9 rounded-md border text-xs font-medium capitalize transition-colors ${
                locked.has('dockPosition') ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
              } ${
                effective.dockPosition === pos
                  ? 'border-os-accent bg-os-accent/10 text-os-accent'
                  : 'border-os-border bg-os-surface text-os-text-secondary hover:bg-os-surface-hover hover:text-os-text-primary'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="flex items-center justify-between p-3 rounded-lg bg-os-surface border border-os-border">
            <span className="text-xs font-medium text-os-text-primary">Dock Auto-Hide</span>
            <div className="flex gap-1">
              {[true, false].map((val) => (
                <button
                  key={String(val)}
                  type="button"
                  data-testid={`display-dock-autohide-${val ? 'on' : 'off'}`}
                  disabled={locked.has('dockAutoHide')}
                  onClick={() => persistPatch({ dockAutoHide: val })}
                  className={`px-2.5 py-1 rounded text-xs font-medium ${
                    effective.dockAutoHide === val
                      ? 'bg-os-accent/20 text-os-accent border border-os-accent/40'
                      : 'text-os-text-muted hover:text-os-text-primary'
                  }`}
                >
                  {val ? 'ON' : 'OFF'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-os-surface border border-os-border">
            <span className="text-xs font-medium text-os-text-primary">Desktop Icons</span>
            <div className="flex gap-1">
              {[true, false].map((val) => (
                <button
                  key={String(val)}
                  type="button"
                  data-testid={`display-desktop-icons-${val ? 'show' : 'hide'}`}
                  disabled={locked.has('showDesktopIcons')}
                  onClick={() => persistPatch({ showDesktopIcons: val })}
                  className={`px-2.5 py-1 rounded text-xs font-medium ${
                    effective.showDesktopIcons === val
                      ? 'bg-os-accent/20 text-os-accent border border-os-accent/40'
                      : 'text-os-text-muted hover:text-os-text-primary'
                  }`}
                >
                  {val ? 'SHOW' : 'HIDE'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Island Mode */}
      <div className="flex flex-col gap-3 p-4 rounded-lg bg-os-input-bg border border-os-border">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <div className="text-sm font-medium text-os-text-primary">Dynamic Island Presentation</div>
            <div className="text-xs text-os-text-muted mt-1">Default startup mode for the top telemetry island.</div>
          </div>
          <LockTag lockKey="dynamicIslandMode" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ISLAND_MODE_VALUES.map((mode) => (
            <button
              key={mode}
              type="button"
              data-testid={`display-island-mode-${mode}`}
              disabled={locked.has('dynamicIslandMode')}
              onClick={() => persistPatch({ dynamicIslandMode: mode as DynamicIslandPreferenceMode })}
              className={`h-9 rounded-md border text-xs font-medium capitalize transition-colors ${
                locked.has('dynamicIslandMode') ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
              } ${
                effective.dynamicIslandMode === mode
                  ? 'border-os-accent bg-os-accent/10 text-os-accent'
                  : 'border-os-border bg-os-surface text-os-text-secondary hover:bg-os-surface-hover hover:text-os-text-primary'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {showResolution && (
        <div className="flex flex-col gap-3 p-4 rounded-lg bg-os-input-bg border border-os-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-os-text-primary">Display resolution</div>
              <div className="text-xs text-os-text-muted mt-1">ORION uses the complete available display viewport. It does not render as a fixed-width website.</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3 py-1.5 rounded-md bg-os-surface border border-os-border text-xs font-mono text-os-text-secondary">
                {viewport.width} × {viewport.height}
              </span>
              <button type="button" onClick={enterFullscreen} className="px-3 py-1.5 rounded-md bg-os-surface border border-os-border text-xs font-medium text-os-text-primary hover:bg-os-surface-hover transition-colors cursor-pointer">
                {typeof document !== 'undefined' && document.fullscreenElement ? 'Exit Fullscreen' : 'Fullscreen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scale */}
      <div className="flex flex-col gap-3 p-4 rounded-lg bg-os-input-bg border border-os-border">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <div className="text-sm font-medium text-os-text-primary">Scale</div>
            <div className="text-xs text-os-text-muted mt-1">Windows-style interface scaling. Larger values make the entire ORION interface easier to see.</div>
          </div>
          <LockTag lockKey="displayScale" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {DISPLAY_SCALE_OPTIONS.map((value) => (
            <button
              key={value}
              type="button"
              data-testid={`display-scale-${value}`}
              disabled={locked.has('displayScale')}
              onClick={() => persistPatch({ displayScale: value })}
              className={`h-10 rounded-md border text-xs font-medium transition-colors ${
                effective.displayScale === value
                  ? 'border-os-accent bg-os-accent/10 text-os-accent'
                  : 'border-os-border bg-os-surface text-os-text-secondary hover:bg-os-surface-hover hover:text-os-text-primary'
              }`}
            >
              {value}%
            </button>
          ))}
        </div>
      </div>

      {/* Text size */}
      <div className="flex flex-col gap-3 p-4 rounded-lg bg-os-input-bg border border-os-border">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <div className="text-sm font-medium text-os-text-primary">Text size</div>
            <div className="text-xs text-os-text-muted mt-1">Increase or decrease text independently from display scale.</div>
          </div>
          <LockTag lockKey="textSize" />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Decrease text size"
            disabled={locked.has('textSize')}
            onClick={() =>
              persistPatch({
                textSize: TEXT_SIZE_OPTIONS[Math.max(0, TEXT_SIZE_OPTIONS.indexOf((effective.textSize || 100) as OrionTextSize) - 1)],
              })
            }
            className="w-10 h-10 rounded-md border border-os-border bg-os-surface text-lg hover:bg-os-surface-hover"
          >
            A−
          </button>
          <input
            aria-label="Text size"
            type="range"
            min="90"
            max="140"
            step="10"
            disabled={locked.has('textSize')}
            value={effective.textSize ?? 100}
            onChange={(e) => persistPatch({ textSize: Number(e.target.value) as OrionTextSize })}
            className="flex-1 accent-os-accent"
          />
          <button
            type="button"
            aria-label="Increase text size"
            disabled={locked.has('textSize')}
            onClick={() =>
              persistPatch({
                textSize: TEXT_SIZE_OPTIONS[Math.min(TEXT_SIZE_OPTIONS.length - 1, TEXT_SIZE_OPTIONS.indexOf((effective.textSize || 100) as OrionTextSize) + 1)],
              })
            }
            className="w-10 h-10 rounded-md border border-os-border bg-os-surface text-lg hover:bg-os-surface-hover"
          >
            A+
          </button>
          <span className="w-14 text-right text-xs font-mono text-os-text-secondary">{effective.textSize ?? 100}%</span>
        </div>
        <div className={labelClass}>Preview</div>
        <div style={{ fontSize: `${effective.textSize ?? 100}%` }} className="p-3 rounded-md bg-os-surface border border-os-border text-os-text-primary">
          ORION-9 Supply Chain Intelligence
        </div>
      </div>

      {/* Font */}
      <div className="flex flex-col gap-3 p-4 rounded-lg bg-os-input-bg border border-os-border">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <div className="text-sm font-medium text-os-text-primary">Font</div>
            <div className="text-xs text-os-text-muted mt-1">Choose the application typeface.</div>
          </div>
          <LockTag lockKey="fontFamily" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {FONT_OPTIONS.map((font) => (
            <button
              key={font}
              type="button"
              data-testid={`display-font-${font}`}
              disabled={locked.has('fontFamily')}
              onClick={() => persistPatch({ fontFamily: font })}
              style={{ fontFamily: FONT_STACKS[font] }}
              className={`h-11 rounded-md border text-sm transition-colors ${
                effective.fontFamily === font
                  ? 'border-os-accent bg-os-accent/10 text-os-accent'
                  : 'border-os-border bg-os-surface text-os-text-secondary hover:bg-os-surface-hover hover:text-os-text-primary'
              }`}
            >
              {font}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-os-text-muted">
        <div>
          <span className="block mb-1">Current scale</span>
          <strong className="text-os-text-secondary">{effective.displayScale ?? 100}%</strong>
        </div>
        <div>
          <span className="block mb-1">Current text</span>
          <strong className="text-os-text-secondary">{effective.textSize ?? 100}%</strong>
        </div>
        <div>
          <span className="block mb-1">Current font</span>
          <strong className="text-os-text-secondary">{effective.fontFamily ?? 'ROBOTO'}</strong>
        </div>
      </div>
    </div>
  );
}
