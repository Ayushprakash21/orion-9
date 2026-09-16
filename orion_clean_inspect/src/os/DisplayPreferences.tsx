import React from 'react';
import { useAuth } from '../store/AuthContext';

export type OrionFontFamily = 'ROBOTO' | 'LATO' | 'ARIAL';
export type OrionDisplayScale = 100 | 125 | 150 | 175 | 200;
export type OrionTextSize = 90 | 100 | 110 | 120 | 130 | 140;

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

export const DISPLAY_SCALE_OPTIONS: OrionDisplayScale[] = [100, 125, 150, 175, 200];
export const TEXT_SIZE_OPTIONS: OrionTextSize[] = [90, 100, 110, 120, 130, 140];
export const FONT_OPTIONS: OrionFontFamily[] = ['ROBOTO', 'LATO', 'ARIAL'];

const FONT_STACKS: Record<OrionFontFamily, string> = {
  ROBOTO: 'Roboto, "Segoe UI", Arial, sans-serif',
  LATO: 'Lato, "Segoe UI", Arial, sans-serif',
  ARIAL: 'Arial, "Segoe UI", sans-serif',
};

const sanitize = (raw: Partial<OrionDisplayPreferences> | null | undefined): OrionDisplayPreferences => {
  const displayScale = DISPLAY_SCALE_OPTIONS.includes(Number(raw?.displayScale) as OrionDisplayScale)
    ? Number(raw?.displayScale) as OrionDisplayScale
    : DEFAULT_DISPLAY_PREFERENCES.displayScale;
  const textSize = TEXT_SIZE_OPTIONS.includes(Number(raw?.textSize) as OrionTextSize)
    ? Number(raw?.textSize) as OrionTextSize
    : DEFAULT_DISPLAY_PREFERENCES.textSize;
  const fontFamily = FONT_OPTIONS.includes(raw?.fontFamily as OrionFontFamily)
    ? raw!.fontFamily as OrionFontFamily
    : DEFAULT_DISPLAY_PREFERENCES.fontFamily;
  return { displayScale, textSize, fontFamily };
};

export const getDisplayPreferenceKey = (userId?: string | null) =>
  `orion_display_preferences:${userId || 'guest'}`;

export const readDisplayPreferences = (userId?: string | null): OrionDisplayPreferences => {
  if (typeof window === 'undefined') return DEFAULT_DISPLAY_PREFERENCES;
  try {
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
      window.dispatchEvent(new CustomEvent('orion-display-preferences-changed', { detail: normalized }));
    } catch {}
  }
  applyDisplayPreferences(normalized);
  return normalized;
};

export function OrionDisplayPreferencesProvider() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id || null;

  React.useEffect(() => {
    const apply = () => applyDisplayPreferences(readDisplayPreferences(userId));
    apply();
    window.addEventListener('orion-display-preferences-changed', apply);
    window.addEventListener('storage', apply);
    return () => {
      window.removeEventListener('orion-display-preferences-changed', apply);
      window.removeEventListener('storage', apply);
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
  const effectiveUserId = userId ?? currentUser?.id ?? null;
  const [preferences, setPreferences] = React.useState<OrionDisplayPreferences>(() => readDisplayPreferences(effectiveUserId));
  const [viewport, setViewport] = React.useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  }));

  React.useEffect(() => {
    setPreferences(readDisplayPreferences(effectiveUserId));
  }, [effectiveUserId]);

  React.useEffect(() => {
    const onResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  const update = (patch: Partial<OrionDisplayPreferences>) => {
    const next = saveDisplayPreferences(effectiveUserId, { ...preferences, ...patch });
    setPreferences(next);
  };

  const enterFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch {}
  };

  const labelClass = compact
    ? 'text-[9px] uppercase tracking-[0.16em] text-os-text-muted font-semibold'
    : 'text-[10px] uppercase tracking-[0.16em] text-os-text-muted font-semibold';
  const controlClass = compact
    ? 'h-9 rounded-md bg-os-surface border border-os-border px-3 text-xs text-os-text-primary outline-none focus:border-os-accent'
    : 'h-10 rounded-md bg-os-surface border border-os-border px-3 text-sm text-os-text-primary outline-none focus:border-os-accent';

  return (
    <div className={compact ? 'space-y-4' : 'space-y-6'}>
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
              <button type="button" onClick={enterFullscreen} className="px-3 py-1.5 rounded-md bg-os-surface border border-os-border text-xs font-medium text-os-text-primary hover:bg-os-surface-hover transition-colors">
                {typeof document !== 'undefined' && document.fullscreenElement ? 'Exit Fullscreen' : 'Fullscreen'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 p-4 rounded-lg bg-os-input-bg border border-os-border">
        <div>
          <div className="text-sm font-medium text-os-text-primary">Scale</div>
          <div className="text-xs text-os-text-muted mt-1">Windows-style interface scaling. Larger values make the entire ORION interface easier to see.</div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {DISPLAY_SCALE_OPTIONS.map(value => (
            <button
              key={value}
              type="button"
              onClick={() => update({ displayScale: value })}
              className={`h-10 rounded-md border text-xs font-medium transition-colors ${preferences.displayScale === value ? 'border-os-accent bg-os-accent/10 text-os-accent' : 'border-os-border bg-os-surface text-os-text-secondary hover:bg-os-surface-hover hover:text-os-text-primary'}`}
            >{value}%</button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 p-4 rounded-lg bg-os-input-bg border border-os-border">
        <div>
          <div className="text-sm font-medium text-os-text-primary">Text size</div>
          <div className="text-xs text-os-text-muted mt-1">Increase or decrease text independently from display scale.</div>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" aria-label="Decrease text size" onClick={() => update({ textSize: TEXT_SIZE_OPTIONS[Math.max(0, TEXT_SIZE_OPTIONS.indexOf(preferences.textSize) - 1)] })} className="w-10 h-10 rounded-md border border-os-border bg-os-surface text-lg hover:bg-os-surface-hover">A−</button>
          <input aria-label="Text size" type="range" min="90" max="140" step="10" value={preferences.textSize} onChange={e => update({ textSize: Number(e.target.value) as OrionTextSize })} className="flex-1 accent-os-accent" />
          <button type="button" aria-label="Increase text size" onClick={() => update({ textSize: TEXT_SIZE_OPTIONS[Math.min(TEXT_SIZE_OPTIONS.length - 1, TEXT_SIZE_OPTIONS.indexOf(preferences.textSize) + 1)] })} className="w-10 h-10 rounded-md border border-os-border bg-os-surface text-lg hover:bg-os-surface-hover">A+</button>
          <span className="w-14 text-right text-xs font-mono text-os-text-secondary">{preferences.textSize}%</span>
        </div>
        <div className={labelClass}>Preview</div>
        <div style={{ fontSize: `${preferences.textSize}%` }} className="p-3 rounded-md bg-os-surface border border-os-border text-os-text-primary">
          ORION-9 Supply Chain Intelligence
        </div>
      </div>

      <div className="flex flex-col gap-3 p-4 rounded-lg bg-os-input-bg border border-os-border">
        <div>
          <div className="text-sm font-medium text-os-text-primary">Font</div>
          <div className="text-xs text-os-text-muted mt-1">Choose the application typeface.</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {FONT_OPTIONS.map(font => (
            <button
              key={font}
              type="button"
              onClick={() => update({ fontFamily: font })}
              style={{ fontFamily: FONT_STACKS[font] }}
              className={`h-11 rounded-md border text-sm transition-colors ${preferences.fontFamily === font ? 'border-os-accent bg-os-accent/10 text-os-accent' : 'border-os-border bg-os-surface text-os-text-secondary hover:bg-os-surface-hover hover:text-os-text-primary'}`}
            >{font}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-os-text-muted">
        <div><span className="block mb-1">Current scale</span><strong className="text-os-text-secondary">{preferences.displayScale}%</strong></div>
        <div><span className="block mb-1">Current text</span><strong className="text-os-text-secondary">{preferences.textSize}%</strong></div>
        <div><span className="block mb-1">Current font</span><strong className="text-os-text-secondary">{preferences.fontFamily}</strong></div>
      </div>
    </div>
  );
}
