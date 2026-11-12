import React, { useState } from 'react';
import { 
  Sun, Moon, Check, RefreshCw, Palette, 
  ChevronDown, ChevronUp, Eye, Sparkles, ShieldCheck, Download, Upload, Sliders
} from 'lucide-react';
import { useOrionTheme } from '../../os/theme/useOrionTheme';
import { OrionThemeId, OrionAppearanceMode, OrionAppearancePreferences } from '../../os/theme/OrionThemeTypes';
import { calculateContrastColor } from '../../os/theme/OrionContrast';
import { useToast } from '../../store/ToastContext';
import { useAuth } from '../../store/AuthContext';
import { userPersistenceService } from '../../services/userPersistenceService';
import { ORION_OS_METADATA } from '../../os/constants/OrionOsMetadata';

// High-fidelity Windows 11 Personalization system color grid (35 shades across 15 chromatic families)
export const SYSTEM_COLOR_PALETTE = [
  // Row 1: Bright & warm tones
  { hex: '#FFB900', name: 'Yellow Gold' },
  { hex: '#FF8C00', name: 'Vibrant Orange' },
  { hex: '#F7630C', name: 'Rust Orange' },
  { hex: '#CA5010', name: 'Brick Orange' },
  { hex: '#DA3B01', name: 'Amber Red' },
  { hex: '#EF6950', name: 'Persimmon' },
  { hex: '#D13438', name: 'Crimson Red' },

  // Row 2: Rose, pink, magenta & purple
  { hex: '#FF4343', name: 'Bright Red' },
  { hex: '#E74856', name: 'Ruby Pink' },
  { hex: '#E3008C', name: 'Magenta Pink' },
  { hex: '#BF0077', name: 'Deep Magenta' },
  { hex: '#C239B3', name: 'Plum Violet' },
  { hex: '#9A0089', name: 'Purple Orchid' },
  { hex: '#0078D7', name: 'Windows Blue' },

  // Row 3: Violet, lilac, cyan & ocean blues
  { hex: '#881798', name: 'Dark Violet' },
  { hex: '#744DA9', name: 'Imperial Violet' },
  { hex: '#8764B8', name: 'Lilac' },
  { hex: '#B146C2', name: 'Lavender Rose' },
  { hex: '#0063B1', name: 'Cobalt Blue' },
  { hex: '#2D7D9A', name: 'Ocean Cyan' },
  { hex: '#00B7C3', name: 'Cyan Aqua' },

  // Row 4: Teals, emeralds, greens & olive
  { hex: '#038387', name: 'Deep Teal' },
  { hex: '#00B294', name: 'Mint Emerald' },
  { hex: '#018574', name: 'Turquoise' },
  { hex: '#00CC6A', name: 'Spring Green' },
  { hex: '#107C41', name: 'Office Green' },
  { hex: '#10893E', name: 'Forest Green' },
  { hex: '#7A7574', name: 'Neutral Taupe' },

  // Row 5: Greys, graphite, charcoal & metallics
  { hex: '#5D5A58', name: 'Graphite Stone' },
  { hex: '#68768A', name: 'Slate Grey' },
  { hex: '#515C6B', name: 'Steel Charcoal' },
  { hex: '#4C4A48', name: 'Deep Charcoal' },
  { hex: '#498205', name: 'Olive Green' },
  { hex: '#847545', name: 'Bronze Olive' },
  { hex: '#D6A65C', name: 'Golden Gate Amber' },
];

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return null;
  const num = parseInt(clean, 16);
  if (isNaN(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (h >= 0 && h < 60) {
    r1 = c; g1 = x; b1 = 0;
  } else if (h >= 60 && h < 120) {
    r1 = x; g1 = c; b1 = 0;
  } else if (h >= 120 && h < 180) {
    r1 = 0; g1 = c; b1 = x;
  } else if (h >= 180 && h < 240) {
    r1 = 0; g1 = x; b1 = c;
  } else if (h >= 240 && h < 300) {
    r1 = x; g1 = 0; b1 = c;
  } else {
    r1 = c; g1 = 0; b1 = x;
  }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

export const AppearanceSettingsPanel: React.FC = () => {
  const { theme, preferences, resolvedAccent, setTheme: setEngineTheme, setPreference: setEnginePreference, resetAppearance: resetEngineAppearance, isDark } = useOrionTheme();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const syncUserPref = React.useCallback((patch: Record<string, unknown>) => {
    if (currentUser?.id) {
      void userPersistenceService.saveUserPreferences(
        currentUser.id,
        {
          ...(patch as any),
          organizationId: currentUser.organizationId,
        }
      );
    }
  }, [currentUser?.id, currentUser?.organizationId]);

  const setPreference = React.useCallback(<K extends keyof OrionAppearancePreferences>(
    key: K,
    value: OrionAppearancePreferences[K]
  ) => {
    setEnginePreference(key, value);
    if (key === 'appearanceMode') {
      const m = value as OrionAppearanceMode;
      syncUserPref({
        appearanceMode: m,
        theme: m === 'light' ? 'light' : 'dark',
      });
    } else if (key === 'transparencyEnabled') {
      syncUserPref({ reducedTransparency: !Boolean(value) });
    } else if (key === 'customAccent') {
      syncUserPref({ customAccent: value });
    } else if (key === 'applyAccentToNavigation') {
      syncUserPref({ applyAccentToNavigation: Boolean(value) });
    } else if (key === 'recentColors') {
      syncUserPref({ recentColors: value });
    } else if (key === 'customColors') {
      syncUserPref({ customColors: value });
    }
  }, [setEnginePreference, syncUserPref]);

  // Mode Selection: Strictly DARK and LIGHT
  const handleModeChange = (mode: 'dark' | 'light') => {
    const targetTheme: OrionThemeId = mode === 'dark' ? 'graphite' : 'silver';
    setEngineTheme(targetTheme);
    setPreference('appearanceMode', mode);
    syncUserPref({
      themeId: targetTheme,
      appearanceMode: mode,
      theme: mode,
    });
    showToast(`Appearance set to ${mode === 'dark' ? 'Dark' : 'Light'} Mode`, 'info', 'Settings');
  };

  // Accent Selection & Persistence
  const applyAccentColor = (hex: string) => {
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return;
    const cleanHex = hex.toUpperCase();
    setPreference('customAccentEnabled', true);
    setPreference('customAccent', cleanHex);

    // Maintain Recent Colors FIFO (up to 6)
    const existingRecent = preferences.recentColors || ['#D6A65C', '#3B82F6', '#10B981', '#8B5CF6'];
    const updatedRecent = [cleanHex, ...existingRecent.filter((c) => c.toUpperCase() !== cleanHex)].slice(0, 6);
    setPreference('recentColors', updatedRecent);
  };

  // Custom Color Dialog State
  const [isCustomColorModalOpen, setIsCustomColorModalOpen] = useState(false);
  const [customInputMode, setCustomInputMode] = useState<'hex' | 'rgb' | 'hsl'>('hex');
  const [colorHexDraft, setColorHexDraft] = useState(resolvedAccent || '#D6A65C');
  const [colorRgbDraft, setColorRgbDraft] = useState(() => hexToRgb(resolvedAccent || '#D6A65C') || { r: 214, g: 166, b: 92 });
  const [colorHslDraft, setColorHslDraft] = useState(() => {
    const rgb = hexToRgb(resolvedAccent || '#D6A65C') || { r: 214, g: 166, b: 92 };
    return rgbToHsl(rgb.r, rgb.g, rgb.b);
  });
  const [colorInputError, setColorInputError] = useState<string | null>(null);

  const openCustomColorModal = () => {
    const active = resolvedAccent || '#D6A65C';
    setColorHexDraft(active);
    const rgb = hexToRgb(active) || { r: 214, g: 166, b: 92 };
    setColorRgbDraft(rgb);
    setColorHslDraft(rgbToHsl(rgb.r, rgb.g, rgb.b));
    setColorInputError(null);
    setIsCustomColorModalOpen(true);
  };

  const handleHexDraftChange = (raw: string) => {
    setColorHexDraft(raw);
    const clean = raw.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(clean)) {
      setColorInputError(null);
      const rgb = hexToRgb(clean);
      if (rgb) {
        setColorRgbDraft(rgb);
        setColorHslDraft(rgbToHsl(rgb.r, rgb.g, rgb.b));
      }
    } else {
      setColorInputError('Enter a valid 6-character hex code (e.g. #D6A65C)');
    }
  };

  const handleRgbDraftChange = (channel: 'r' | 'g' | 'b', valStr: string) => {
    const val = parseInt(valStr, 10);
    if (isNaN(val) || val < 0 || val > 255) {
      setColorInputError('RGB channel values must be integers between 0 and 255');
      return;
    }
    setColorInputError(null);
    const nextRgb = { ...colorRgbDraft, [channel]: val };
    setColorRgbDraft(nextRgb);
    const nextHex = rgbToHex(nextRgb.r, nextRgb.g, nextRgb.b);
    setColorHexDraft(nextHex);
    setColorHslDraft(rgbToHsl(nextRgb.r, nextRgb.g, nextRgb.b));
  };

  const handleHslDraftChange = (channel: 'h' | 's' | 'l', valStr: string) => {
    const val = parseInt(valStr, 10);
    const max = channel === 'h' ? 360 : 100;
    if (isNaN(val) || val < 0 || val > max) {
      setColorInputError(`HSL ${channel.toUpperCase()} must be between 0 and ${max}`);
      return;
    }
    setColorInputError(null);
    const nextHsl = { ...colorHslDraft, [channel]: val };
    setColorHslDraft(nextHsl);
    const nextRgb = hslToRgb(nextHsl.h, nextHsl.s, nextHsl.l);
    setColorRgbDraft(nextRgb);
    setColorHexDraft(rgbToHex(nextRgb.r, nextRgb.g, nextRgb.b));
  };

  const commitCustomColor = () => {
    if (!/^#[0-9A-Fa-f]{6}$/.test(colorHexDraft.trim())) {
      setColorInputError('Invalid HEX color value.');
      return;
    }
    const cleanHex = colorHexDraft.trim().toUpperCase();
    applyAccentColor(cleanHex);

    // Save to customColors array in preferences
    const existingCustom = preferences.customColors || [];
    if (!existingCustom.map((c) => c.toUpperCase()).includes(cleanHex)) {
      setPreference('customColors', [cleanHex, ...existingCustom].slice(0, 12));
    }

    setIsCustomColorModalOpen(false);
    showToast(`Custom accent ${cleanHex} applied`, 'success', 'Settings');
  };

  const recentColors = (preferences.recentColors && preferences.recentColors.length > 0)
    ? preferences.recentColors
    : ['#D6A65C', '#3B82F6', '#10B981', '#8B5CF6'];

  const isTransEnabled = preferences.transparencyEnabled !== false;
  const isNavAccentEnabled = preferences.applyAccentToNavigation !== false;

  return (
    <div className="w-full space-y-6 select-none pb-24 text-[var(--orion-text-primary)]">
      {/* A. Page Heading — Windows 11 Personalization Layout Reference */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[var(--orion-border)]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--orion-accent)] uppercase tracking-wider mb-1">
            <Palette className="w-3.5 h-3.5" />
            <span>{ORION_OS_METADATA.displayTitle} • {ORION_OS_METADATA.edition}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--orion-text-primary)]">
            Colors
          </h1>
          <p className="text-xs text-[var(--orion-text-secondary)] mt-0.5">
            Personalization and visual experience. Configure system theme mode, transparency effects, and accent highlights.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              resetEngineAppearance();
              showToast('Personalization reset to Orion-9 defaults', 'info', 'Settings');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-[var(--orion-border)] bg-[var(--orion-surface)] hover:bg-[var(--orion-surface-hover)] transition-colors cursor-pointer"
            title="Reset to Orion-9 Golden Gate Edition defaults"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
        </div>
      </div>

      {/* B. Theme Preview — Live Interactive Appearance Viewport */}
      <div 
        data-testid="personalization-preview-viewport"
        className="relative w-full rounded-2xl border border-[var(--orion-border)] overflow-hidden shadow-sm p-5 sm:p-7 flex flex-col gap-4 transition-all duration-300"
        style={{
          backgroundColor: isDark ? '#17191D' : '#F4F5F7',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: resolvedAccent }}
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--orion-text-secondary)]">
              Live Desktop & Window Preview
            </span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md border border-[var(--orion-border)] bg-[var(--orion-surface)] text-[var(--orion-text-secondary)]">
            Mode: <strong className="text-[var(--orion-text-primary)]">{isDark ? 'Dark' : 'Light'}</strong> • Accent: <strong className="font-mono text-[var(--orion-accent)]">{resolvedAccent}</strong>
          </span>
        </div>

        {/* Scaled OS Shell Representation */}
        <div className="relative w-full rounded-xl border border-[var(--orion-border)] overflow-hidden p-4 sm:p-6 flex flex-col items-center justify-between min-h-[220px] bg-cover bg-center"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, #101216 0%, #1c222d 50%, #12151c 100%)'
              : 'linear-gradient(135deg, #e5e9f0 0%, #ffffff 50%, #d8dfea 100%)'
          }}
        >
          {/* Top Preview Dynamic Island */}
          <div 
            className="flex items-center gap-2 px-3.5 py-1 rounded-full border shadow-sm transition-all text-xs"
            style={{
              backgroundColor: isDark 
                ? (isTransEnabled ? 'rgba(20,24,36,0.85)' : '#141824')
                : (isTransEnabled ? 'rgba(255,255,255,0.92)' : '#FFFFFF'),
              borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.12)',
              backdropFilter: isTransEnabled ? 'blur(16px)' : 'none',
              WebkitBackdropFilter: isTransEnabled ? 'blur(16px)' : 'none',
            }}
          >
            <span 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: resolvedAccent }}
            />
            <span className="text-[11px] font-medium text-[var(--orion-text-primary)]">
              Orion-9 OS 21.1
            </span>
            <span className="text-[10px] text-[var(--orion-text-muted)]">• System Ready</span>
          </div>

          {/* Sample Floating App Window */}
          <div 
            className="w-full max-w-sm rounded-xl border p-3.5 shadow-md flex flex-col gap-2 transition-all my-auto"
            style={{
              backgroundColor: isDark
                ? (isTransEnabled ? 'rgba(32,35,41,0.82)' : '#202329')
                : (isTransEnabled ? 'rgba(255,255,255,0.92)' : '#FFFFFF'),
              borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(20,25,35,0.10)',
              backdropFilter: isTransEnabled ? 'blur(20px)' : 'none',
              WebkitBackdropFilter: isTransEnabled ? 'blur(20px)' : 'none',
            }}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[var(--orion-border)]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                <span className="text-[10px] font-semibold text-[var(--orion-text-secondary)] ml-1">Control Tower</span>
              </div>
              <span className="text-[9px] font-mono text-[var(--orion-text-muted)]">v21.1</span>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-[var(--orion-text-secondary)]">Supply Chain Network</span>
              <button 
                type="button"
                className="px-2.5 py-0.5 rounded-md text-[10px] font-bold border transition-colors"
                style={{
                  backgroundColor: resolvedAccent,
                  color: calculateContrastColor(resolvedAccent),
                  borderColor: resolvedAccent,
                }}
              >
                Inspect
              </button>
            </div>
          </div>

          {/* Bottom Dock representation */}
          <div 
            className="flex items-center gap-2 px-3 py-1.5 rounded-2xl border shadow-lg transition-all"
            style={{
              backgroundColor: isDark
                ? (isTransEnabled ? 'rgba(24,28,36,0.88)' : '#181c24')
                : (isTransEnabled ? 'rgba(255,255,255,0.94)' : '#FFFFFF'),
              borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.14)',
              backdropFilter: isTransEnabled ? 'blur(24px)' : 'none',
              WebkitBackdropFilter: isTransEnabled ? 'blur(24px)' : 'none',
            }}
          >
            {['O9', 'CT', 'PO', 'AI', 'IN'].map((code, idx) => (
              <div
                key={code}
                className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[9px] border transition-transform hover:scale-105"
                style={{
                  backgroundColor: idx === 0 && isNavAccentEnabled
                    ? resolvedAccent
                    : (isDark ? '#282C32' : '#F0F2F5'),
                  color: idx === 0 && isNavAccentEnabled
                    ? calculateContrastColor(resolvedAccent)
                    : 'inherit',
                  borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.10)'
                }}
              >
                {code}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* C. Choose Your Mode — Windows 11 Full-Width Settings Row */}
      <div className="bg-[var(--orion-surface)] border border-[var(--orion-border)] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all">
        <div className="space-y-0.5">
          <div className="text-sm font-semibold text-[var(--orion-text-primary)]">
            Choose your mode
          </div>
          <p className="text-xs text-[var(--orion-text-secondary)]">
            Change the colors that appear in Orion-9 and its applications
          </p>
        </div>

        {/* Dropdown / Segmented Selector (Strictly 2 options: Dark, Light) */}
        <div className="flex items-center p-1 rounded-xl border border-[var(--orion-border)] bg-[var(--orion-surface-hover)]">
          <button
            type="button"
            data-testid="mode-select-dark"
            onClick={() => handleModeChange('dark')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isDark
                ? 'bg-[var(--orion-surface)] text-[var(--orion-text-primary)] shadow-xs border border-[var(--orion-border)]'
                : 'text-[var(--orion-text-secondary)] hover:text-[var(--orion-text-primary)]'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            Dark
          </button>
          <button
            type="button"
            data-testid="mode-select-light"
            onClick={() => handleModeChange('light')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              !isDark
                ? 'bg-[var(--orion-surface)] text-[var(--orion-text-primary)] shadow-xs border border-[var(--orion-border)]'
                : 'text-[var(--orion-text-secondary)] hover:text-[var(--orion-text-primary)]'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            Light
          </button>
        </div>
      </div>

      {/* D. Transparency Effects — Windows 11 Full-Width Settings Row */}
      <div className="bg-[var(--orion-surface)] border border-[var(--orion-border)] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all">
        <div className="space-y-0.5">
          <div className="text-sm font-semibold text-[var(--orion-text-primary)]">
            Transparency effects
          </div>
          <p className="text-xs text-[var(--orion-text-secondary)]">
            Windows and surfaces appear translucent
          </p>
        </div>

        {/* ON / OFF Toggle Switch */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-[var(--orion-text-secondary)]">
            {isTransEnabled ? 'On' : 'Off'}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={isTransEnabled}
            data-testid="transparency-effects-toggle"
            onClick={() => {
              const next = !isTransEnabled;
              setPreference('transparencyEnabled', next);
              showToast(`Transparency effects turned ${next ? 'On' : 'Off'}`, 'info', 'Settings');
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer border ${
              isTransEnabled
                ? 'bg-[var(--orion-accent)] border-[var(--orion-accent)]'
                : 'bg-[var(--orion-surface-hover)] border-[var(--orion-border)]'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isTransEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* E. Accent Color — Collapsible Accordion Header */}
      <div className="bg-[var(--orion-surface)] border border-[var(--orion-border)] rounded-2xl p-4 sm:p-6 space-y-5 transition-all">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[var(--orion-border)]">
          <div className="space-y-0.5">
            <div className="text-sm font-semibold text-[var(--orion-text-primary)]">
              Accent color
            </div>
            <p className="text-xs text-[var(--orion-text-secondary)]">
              Choose an accent color to highlight buttons, focus rings, and active controls
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs text-[var(--orion-text-secondary)]">Selection mode:</span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--orion-surface-hover)] border border-[var(--orion-border)] text-[var(--orion-text-primary)]">
              Manual
            </span>
          </div>
        </div>

        {/* F. Recent Colors */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-[var(--orion-text-secondary)] uppercase tracking-wider">
            Recent colors
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {recentColors.map((hex, idx) => {
              const isSelected = resolvedAccent?.toUpperCase() === hex.toUpperCase();
              return (
                <button
                  key={`${hex}-${idx}`}
                  type="button"
                  data-testid={`recent-color-${idx}`}
                  onClick={() => applyAccentColor(hex)}
                  className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-[var(--orion-accent)] ring-offset-2 ring-offset-[var(--orion-bg)] scale-105'
                      : 'border-[var(--orion-border)] hover:scale-105'
                  }`}
                  style={{ backgroundColor: hex }}
                  title={`Recent Color: ${hex}`}
                  aria-label={`Select recent color ${hex}`}
                >
                  {isSelected && (
                    <Check 
                      className="w-4 h-4"
                      style={{ color: calculateContrastColor(hex) }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* G. Windows System Color Palette (35 Compact Grid Swatches) */}
        <div className="space-y-2 pt-2">
          <div className="text-xs font-semibold text-[var(--orion-text-secondary)] uppercase tracking-wider">
            Windows colors
          </div>
          <div 
            data-testid="system-color-palette-grid"
            className="grid grid-cols-7 gap-2 sm:gap-2.5 max-w-xl"
          >
            {SYSTEM_COLOR_PALETTE.map((color) => {
              const isSelected = resolvedAccent?.toUpperCase() === color.hex.toUpperCase();
              return (
                <button
                  key={color.hex}
                  type="button"
                  data-testid={`palette-color-${color.hex}`}
                  onClick={() => applyAccentColor(color.hex)}
                  className={`w-full aspect-square rounded-md border flex items-center justify-center transition-transform hover:scale-105 cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--orion-bg)] shadow-md'
                      : 'border-white/10 hover:border-white/40'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={`${color.name} (${color.hex})`}
                  aria-label={`Select ${color.name}`}
                >
                  {isSelected && (
                    <Check 
                      className="w-4 h-4 stroke-[2.5]"
                      style={{ color: calculateContrastColor(color.hex) }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* H. Custom Colors — Dedicated Section with View Colors Modal Trigger */}
        <div className="pt-4 border-t border-[var(--orion-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-[var(--orion-text-primary)]">
              Custom colors
            </div>
            <p className="text-[11px] text-[var(--orion-text-secondary)]">
              Specify custom HEX, RGB, or HSL values for precision branding
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-lg border border-[var(--orion-border)] shadow-xs"
              style={{ backgroundColor: resolvedAccent }}
              title={`Current Accent: ${resolvedAccent}`}
            />
            <button
              type="button"
              data-testid="view-custom-colors-btn"
              onClick={openCustomColorModal}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold border border-[var(--orion-border)] bg-[var(--orion-surface-hover)] hover:bg-[var(--orion-surface-active)] text-[var(--orion-text-primary)] transition-colors cursor-pointer"
            >
              View colors
            </button>
          </div>
        </div>

        {/* I. Apply Accent Color to Dock and System Navigation */}
        <div className="pt-4 border-t border-[var(--orion-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-[var(--orion-text-primary)]">
              Show accent color on Start and taskbar
            </div>
            <p className="text-[11px] text-[var(--orion-text-secondary)]">
              Apply accent color to application Dock, launcher indicators, and supported navigation surfaces
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs font-medium text-[var(--orion-text-secondary)]">
              {isNavAccentEnabled ? 'On' : 'Off'}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={isNavAccentEnabled}
              data-testid="nav-accent-toggle"
              onClick={() => {
                const next = !isNavAccentEnabled;
                setPreference('applyAccentToNavigation', next);
                showToast(`Accent on navigation turned ${next ? 'On' : 'Off'}`, 'info', 'Settings');
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer border ${
                isNavAccentEnabled
                  ? 'bg-[var(--orion-accent)] border-[var(--orion-accent)]'
                  : 'bg-[var(--orion-surface-hover)] border-[var(--orion-border)]'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isNavAccentEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: Professional Custom Color Picker Dialog */}
      {isCustomColorModalOpen && (
        <div 
          className="fixed inset-0 z-[2147483640] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="custom-color-modal-title"
        >
          <div 
            className="w-full max-w-md rounded-2xl border border-[var(--orion-border)] bg-[var(--orion-surface)] p-6 shadow-2xl space-y-5 text-[var(--orion-text-primary)]"
          >
            <div className="flex items-center justify-between border-b border-[var(--orion-border)] pb-3">
              <h3 id="custom-color-modal-title" className="text-sm font-bold tracking-tight">
                Pick a custom color
              </h3>
              <div 
                className="w-6 h-6 rounded-md border border-[var(--orion-border)]"
                style={{ backgroundColor: colorHexDraft }}
              />
            </div>

            {/* Input Mode Selector */}
            <div className="flex rounded-lg border border-[var(--orion-border)] p-1 bg-[var(--orion-surface-hover)] text-xs font-medium">
              {(['hex', 'rgb', 'hsl'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setCustomInputMode(m)}
                  className={`flex-1 py-1 rounded-md transition-colors cursor-pointer uppercase ${
                    customInputMode === m
                      ? 'bg-[var(--orion-surface)] text-[var(--orion-text-primary)] shadow-xs font-bold'
                      : 'text-[var(--orion-text-secondary)] hover:text-[var(--orion-text-primary)]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Color Swatch & Native Color Element */}
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={colorHexDraft}
                onChange={(e) => handleHexDraftChange(e.target.value)}
                className="w-16 h-16 rounded-xl cursor-pointer border border-[var(--orion-border)] bg-transparent p-0"
              />
              <div className="flex-1 space-y-1">
                <div className="text-[11px] text-[var(--orion-text-secondary)]">Live Swatch Preview</div>
                <div 
                  className="w-full h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold border border-[var(--orion-border)]"
                  style={{
                    backgroundColor: colorHexDraft,
                    color: calculateContrastColor(colorHexDraft),
                  }}
                >
                  {colorHexDraft.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Parameter Inputs by Mode */}
            {customInputMode === 'hex' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--orion-text-secondary)]">
                  Hex Color Code
                </label>
                <input
                  type="text"
                  data-testid="custom-hex-input"
                  value={colorHexDraft}
                  onChange={(e) => handleHexDraftChange(e.target.value)}
                  placeholder="#D6A65C"
                  maxLength={7}
                  className="w-full px-3 py-2 rounded-xl text-sm font-mono uppercase bg-[var(--orion-surface-hover)] border border-[var(--orion-border)] text-[var(--orion-text-primary)] focus:outline-none focus:border-[var(--orion-accent)]"
                />
              </div>
            )}

            {customInputMode === 'rgb' && (
              <div className="grid grid-cols-3 gap-2">
                {(['r', 'g', 'b'] as const).map((ch) => (
                  <div key={ch} className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--orion-text-secondary)] uppercase">
                      {ch}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={255}
                      value={colorRgbDraft[ch]}
                      onChange={(e) => handleRgbDraftChange(ch, e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl text-sm font-mono bg-[var(--orion-surface-hover)] border border-[var(--orion-border)] text-[var(--orion-text-primary)] focus:outline-none focus:border-[var(--orion-accent)]"
                    />
                  </div>
                ))}
              </div>
            )}

            {customInputMode === 'hsl' && (
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--orion-text-secondary)] uppercase">H (°)</label>
                  <input
                    type="number"
                    min={0}
                    max={360}
                    value={colorHslDraft.h}
                    onChange={(e) => handleHslDraftChange('h', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl text-sm font-mono bg-[var(--orion-surface-hover)] border border-[var(--orion-border)] text-[var(--orion-text-primary)] focus:outline-none focus:border-[var(--orion-accent)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--orion-text-secondary)] uppercase">S (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={colorHslDraft.s}
                    onChange={(e) => handleHslDraftChange('s', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl text-sm font-mono bg-[var(--orion-surface-hover)] border border-[var(--orion-border)] text-[var(--orion-text-primary)] focus:outline-none focus:border-[var(--orion-accent)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--orion-text-secondary)] uppercase">L (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={colorHslDraft.l}
                    onChange={(e) => handleHslDraftChange('l', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl text-sm font-mono bg-[var(--orion-surface-hover)] border border-[var(--orion-border)] text-[var(--orion-text-primary)] focus:outline-none focus:border-[var(--orion-accent)]"
                  />
                </div>
              </div>
            )}

            {colorInputError && (
              <p className="text-xs text-rose-500 font-medium">
                {colorInputError}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--orion-border)]">
              <button
                type="button"
                onClick={() => setIsCustomColorModalOpen(false)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold border border-[var(--orion-border)] bg-[var(--orion-surface-hover)] hover:bg-[var(--orion-surface-active)] text-[var(--orion-text-primary)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="apply-custom-color-btn"
                disabled={Boolean(colorInputError)}
                onClick={commitCustomColor}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[var(--orion-accent)] text-[var(--orion-on-accent,var(--os-text-primary-inverse))] border border-[var(--orion-border-strong)] hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
