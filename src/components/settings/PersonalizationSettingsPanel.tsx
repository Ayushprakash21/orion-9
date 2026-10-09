import React from 'react';
import { 
  Monitor, LayoutGrid, Layers, AppWindow, Lock, Clock, CloudSun, Bell, ArrowUp, ArrowDown
} from 'lucide-react';
import { PersonalizationSettings, DesktopIconSize, DesktopIconLayout, DockPosition, DockSize, WindowControlPosition } from '../../theme/themeTypes';
import { OrionWindowControls } from '../../os/components/OrionWindowControls';
import { useOSGeometry } from '../../os/dock/DockGeometry';
import { loadPreferences, savePreferences } from '../../os/theme/OrionThemeStorage';
import { RuntimeSettingsAuthority } from '../../os/settings/RuntimeSettingsAuthority';
import { loadLockScreenPreferences, saveLockScreenPreferences, LockScreenPreferences, LockScreenWidgetId } from '../../os/components/OrionLockScreen';

interface PersonalizationSettingsPanelProps {
  settings: PersonalizationSettings;
  onChange: (updated: Partial<PersonalizationSettings>) => void;
}

export const PersonalizationSettingsPanel: React.FC<PersonalizationSettingsPanelProps> = ({ settings, onChange }) => {
  const { previewSettings } = useOSGeometry();
  const [lockPrefs, setLockPrefs] = React.useState<LockScreenPreferences>(() => loadLockScreenPreferences());

  const handleUpdate = (updated: Partial<PersonalizationSettings>) => {
    // 1. Live preview immediately in OS Geometry & Theme Root
    previewSettings(updated);

    // 2. Synchronize to RuntimeSettingsAuthority (single authoritative runtime bus)
    try {
      const current = RuntimeSettingsAuthority.instance.settings;
      RuntimeSettingsAuthority.instance.updateSettings({
        dock: {
          ...current.dock,
          ...(updated.dockPosition ? { dockPosition: updated.dockPosition as any } : {}),
          ...(updated.dockAutoHide !== undefined ? { dockAutoHide: updated.dockAutoHide } : {}),
          ...(updated.dockSize ? { dockSize: updated.dockSize as any } : {}),
          ...(updated.dockMagnification !== undefined ? { dockMagnification: updated.dockMagnification } : {}),
          ...(updated.dockTransparency !== undefined ? { dockOpacity: updated.dockTransparency / 100 } : {}),
        },
        window: {
          ...current.window,
          ...(updated.windowControlPosition ? { windowControlPosition: updated.windowControlPosition } : {}),
        },
        desktop: {
          ...current.desktop,
          ...(updated.iconSize ? { iconSize: updated.iconSize } : (updated as any).desktopIconSize ? { iconSize: (updated as any).desktopIconSize } : {}),
        }
      });
    } catch (_) {}

    // 3. Synchronize to authoritative OrionThemeStorage
    try {
      const prefs = loadPreferences();
      let changed = false;
      if (updated.dockAutoHide !== undefined && updated.dockAutoHide !== prefs.dockAutoHide) {
        prefs.dockAutoHide = updated.dockAutoHide;
        changed = true;
      }
      if (updated.dockPosition !== undefined && updated.dockPosition !== prefs.dockPosition) {
        if (['bottom', 'left', 'right', 'top'].includes(updated.dockPosition)) {
          prefs.dockPosition = updated.dockPosition as any;
          changed = true;
        }
      }
      if (updated.dockMagnification !== undefined && updated.dockMagnification !== prefs.dockMagnification) {
        prefs.dockMagnification = updated.dockMagnification;
        changed = true;
      }
      if (updated.dockTransparency !== undefined && updated.dockTransparency !== prefs.dockOpacity) {
        prefs.dockOpacity = updated.dockTransparency;
        changed = true;
      }
      if (updated.dockBlur !== undefined && updated.dockBlur !== prefs.dockBlur) {
        prefs.dockBlur = updated.dockBlur;
        changed = true;
      }
      if (updated.dockTint !== undefined && updated.dockTint !== prefs.dockTint) {
        prefs.dockTint = updated.dockTint;
        changed = true;
      }
      if (updated.windowControlPosition !== undefined && updated.windowControlPosition !== prefs.windowControlPosition) {
        prefs.windowControlPosition = updated.windowControlPosition;
        changed = true;
      }
      if (changed) {
        savePreferences(prefs);
      }
    } catch {
      // safe fallback
    }

    // 4. Bubble up to settings editor state
    onChange(updated);
  };

  return (
    <div className="w-full space-y-8 pb-[140px] p-4 sm:p-5 md:p-6 min-w-0">
      {/* Banner */}
      <div className="bg-[var(--orion-surface-secondary)] border border-[var(--orion-border)] rounded-xl p-5">
        <h2 className="text-xl font-bold text-[var(--orion-text)] flex items-center gap-2">
          <Monitor className="w-6 h-6 text-[var(--orion-accent)]" />
          Desktop & Windows
        </h2>
        <p className="text-sm text-[var(--orion-text-secondary)] mt-1">
          Configure desktop icon arrangement and sizing, dock/taskbar position and behavior, and window controls placement.
        </p>
      </div>

      {/* 1. DESKTOP ICONS SETTINGS */}
      <div className="bg-[var(--orion-surface)] border border-[var(--orion-border)] rounded-xl p-5 space-y-4">
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--orion-text-muted)] flex items-center gap-1.5">
          <LayoutGrid className="w-4 h-4 text-[var(--orion-accent)]" />
          Desktop Icons Configuration
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Icon Size */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-[var(--orion-text)]">Icon Size</span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'small', label: 'Small' },
                { key: 'medium', label: 'Medium' },
                { key: 'large', label: 'Large' }
              ].map(s => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => handleUpdate({ iconSize: s.key as DesktopIconSize })}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                    settings.iconSize === s.key
                      ? 'border-[var(--orion-accent)] bg-[var(--orion-accent-subtle)] text-[var(--orion-text)] font-semibold'
                      : 'border-[var(--orion-border)] hover:bg-[var(--orion-surface-hover)] text-[var(--orion-text-secondary)]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Arrangement */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-[var(--orion-text)]">Arrangement Mode</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'grid', label: 'Align to Grid' },
                { key: 'freeform', label: 'Freeform Positioning' }
              ].map(l => (
                <button
                  key={l.key}
                  type="button"
                  onClick={() => handleUpdate({ iconLayout: l.key as DesktopIconLayout })}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                    settings.iconLayout === l.key
                      ? 'border-[var(--orion-accent)] bg-[var(--orion-accent-subtle)] text-[var(--orion-text)] font-semibold'
                      : 'border-[var(--orion-border)] hover:bg-[var(--orion-surface-hover)] text-[var(--orion-text-secondary)]'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="pt-3 border-t border-[var(--orion-border)] grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex items-center justify-between p-3 rounded-lg border border-[var(--orion-border)] bg-[var(--orion-surface-secondary)] cursor-pointer">
            <span className="text-xs font-semibold text-[var(--orion-text)]">Auto-Arrange Icons</span>
            <input
              type="checkbox"
              checked={settings.autoArrangeIcons}
              onChange={(e) => handleUpdate({ autoArrangeIcons: e.target.checked })}
              className="w-4 h-4 rounded accent-[var(--orion-accent)]"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg border border-[var(--orion-border)] bg-[var(--orion-surface-secondary)] cursor-pointer">
            <span className="text-xs font-semibold text-[var(--orion-text)]">Snap to Grid on Drop</span>
            <input
              type="checkbox"
              checked={settings.snapToGrid}
              onChange={(e) => handleUpdate({ snapToGrid: e.target.checked })}
              className="w-4 h-4 rounded accent-[var(--orion-accent)]"
            />
          </label>
        </div>
      </div>

      {/* 2. TASKBAR & LIQUID GLASS SETTINGS */}
      <div className="bg-[var(--orion-surface)] border border-[var(--orion-border)] rounded-xl p-5 space-y-5">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--orion-text-muted)] flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[var(--orion-accent)]" />
            Taskbar & Liquid Glass
          </label>
          <p className="text-xs text-[var(--orion-text-secondary)] mt-1">
            Configure the macOS-inspired translucent Liquid Glass taskbar/dock, including edge placement, glass opacity, blur radius, tint material, and interactive behaviors.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Edge Placement */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-[var(--orion-text)]">Edge Placement</span>
            <div className="grid grid-cols-4 gap-2">
              {[
                { key: 'bottom', label: 'Bottom' },
                { key: 'left', label: 'Left' },
                { key: 'right', label: 'Right' },
                { key: 'top', label: 'Top' }
              ].map(p => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handleUpdate({ dockPosition: p.key as DockPosition })}
                  className={`py-2 px-2 rounded-lg text-xs font-medium border text-center transition-colors ${
                    settings.dockPosition === p.key
                      ? 'border-[var(--orion-accent)] bg-[var(--orion-accent-subtle)] text-[var(--orion-text)] font-semibold shadow-xs'
                      : 'border-[var(--orion-border)] hover:bg-[var(--orion-surface-hover)] text-[var(--orion-text-secondary)]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dock Size */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-[var(--orion-text)]">Taskbar Size</span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'small', label: 'Small' },
                { key: 'medium', label: 'Medium' },
                { key: 'large', label: 'Large' }
              ].map(ds => (
                <button
                  key={ds.key}
                  type="button"
                  onClick={() => handleUpdate({ dockSize: ds.key as DockSize })}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-colors ${
                    settings.dockSize === ds.key
                      ? 'border-[var(--orion-accent)] bg-[var(--orion-accent-subtle)] text-[var(--orion-text)] font-semibold shadow-xs'
                      : 'border-[var(--orion-border)] hover:bg-[var(--orion-surface-hover)] text-[var(--orion-text-secondary)]'
                  }`}
                >
                  {ds.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Liquid Glass Sliders: Opacity & Blur */}
        <div className="pt-3 border-t border-[var(--orion-border)] grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Opacity Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-[var(--orion-text)]">Glass Opacity</span>
              <span className="font-mono text-[var(--orion-text-secondary)]">{settings.dockTransparency ?? 85}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.dockTransparency ?? 85}
              onChange={(e) => handleUpdate({ dockTransparency: Number(e.target.value) })}
              className="w-full accent-[var(--orion-accent)] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[var(--orion-text-muted)] font-mono">
              <span>0% (Clear)</span>
              <span>100% (Solid)</span>
            </div>
          </div>

          {/* Blur Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-[var(--orion-text)]">Blur Strength</span>
              <span className="font-mono text-[var(--orion-text-secondary)]">
                {settings.dockBlur ?? 80}% ({Math.round(((settings.dockBlur ?? 80) / 100) * 40)}px)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.dockBlur ?? 80}
              onChange={(e) => handleUpdate({ dockBlur: Number(e.target.value) })}
              className="w-full accent-[var(--orion-accent)] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[var(--orion-text-muted)] font-mono">
              <span>0% (Sharp)</span>
              <span>100% (Deep Frosted)</span>
            </div>
          </div>
        </div>

        {/* Material Tint Selector */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-[var(--orion-text)]">Material Tint</span>
          <div className="grid grid-cols-4 gap-2">
            {[
              { key: 'auto', label: 'Auto (System)' },
              { key: 'dark', label: 'Dark Obsidian' },
              { key: 'light', label: 'Light Quartz' },
              { key: 'accent', label: 'Accent Glow' }
            ].map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => handleUpdate({ dockTint: t.key as any })}
                className={`py-2 px-2 rounded-lg text-xs font-medium border text-center transition-colors ${
                  (settings.dockTint || 'auto') === t.key
                    ? 'border-[var(--orion-accent)] bg-[var(--orion-accent-subtle)] text-[var(--orion-text)] font-semibold shadow-xs'
                    : 'border-[var(--orion-border)] hover:bg-[var(--orion-surface-hover)] text-[var(--orion-text-secondary)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex items-center justify-between p-3 rounded-lg border border-[var(--orion-border)] bg-[var(--orion-surface-secondary)] cursor-pointer">
            <div>
              <span className="text-xs font-semibold text-[var(--orion-text)] block">Dock Auto-Hide</span>
              <span className="text-[11px] text-[var(--orion-text-muted)]">
                {settings.dockAutoHide ? 'Enabled (reveal on edge hover)' : 'Disabled (fixed in place)'}
              </span>
            </div>
            <input
              type="checkbox"
              data-testid="dock-autohide-toggle"
              aria-label="Dock Auto-Hide"
              checked={settings.dockAutoHide}
              onChange={(e) => handleUpdate({ dockAutoHide: e.target.checked })}
              className="w-4 h-4 rounded accent-[var(--orion-accent)] cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg border border-[var(--orion-border)] bg-[var(--orion-surface-secondary)] cursor-pointer">
            <div>
              <span className="text-xs font-semibold text-[var(--orion-text)] block">Icon Magnification</span>
              <span className="text-[11px] text-[var(--orion-text-muted)]">
                {settings.dockMagnification ? 'Smooth zoom on hover' : 'Static icon size'}
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.dockMagnification}
              onChange={(e) => handleUpdate({ dockMagnification: e.target.checked })}
              className="w-4 h-4 rounded accent-[var(--orion-accent)] cursor-pointer"
            />
          </label>
        </div>

        {/* Live Liquid Glass Material Preview */}
        <div className="p-4 rounded-xl border border-[var(--orion-border)] bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-slate-900/40 relative overflow-hidden flex flex-col items-center justify-center min-h-[100px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(56,189,248,0.25),transparent_70%)] pointer-events-none" />
          <span className="text-[10px] font-mono tracking-wider uppercase text-white/50 mb-2">Live Liquid Glass Material</span>
          <div
            className="flex items-center gap-3 px-5 py-2 rounded-2xl border border-white/20 shadow-xl transition-all duration-300"
            style={{
              backgroundColor: settings.dockTint === 'light'
                ? `rgba(255, 255, 255, ${(settings.dockTransparency ?? 85) / 100})`
                : settings.dockTint === 'accent'
                ? `color-mix(in srgb, var(--orion-accent, #38BDF8) 25%, rgba(20, 24, 32, ${(settings.dockTransparency ?? 85) / 100}))`
                : settings.dockTint === 'dark'
                ? `rgba(10, 12, 16, ${(settings.dockTransparency ?? 85) / 100})`
                : `rgba(20, 24, 32, ${(settings.dockTransparency ?? 85) / 100})`,
              backdropFilter: `blur(${Math.round(((settings.dockBlur ?? 80) / 100) * 40)}px) saturate(180%)`,
              WebkitBackdropFilter: `blur(${Math.round(((settings.dockBlur ?? 80) / 100) * 40)}px) saturate(180%)`,
              boxShadow: 'inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.35), 0 16px 36px rgba(0,0,0,0.45)'
            }}
          >
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-white text-[11px] font-bold shadow-xs">
              O
            </div>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/30 flex items-center justify-center text-emerald-300 text-[11px] font-bold shadow-xs">
              CT
            </div>
            <div className="w-7 h-7 rounded-lg bg-blue-500/30 flex items-center justify-center text-blue-300 text-[11px] font-bold shadow-xs">
              AI
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
            <div className="w-7 h-7 rounded-lg bg-purple-500/30 flex items-center justify-center text-purple-300 text-[11px] font-bold shadow-xs">
              SC
            </div>
          </div>
        </div>
      </div>

      {/* 3. WINDOW CONTROLS POSITION */}
      <div className="bg-[var(--orion-surface)] border border-[var(--orion-border)] rounded-xl p-5 space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--orion-text-muted)] flex items-center gap-1.5">
            <AppWindow className="w-4 h-4 text-[var(--orion-accent)]" />
            Window Controls Position
          </label>
          <p className="text-xs text-[var(--orion-text-secondary)] mt-1">
            Choose whether window traffic-light controls appear on the left (Mac style) or right (Windows style) side of application windows.
          </p>
        </div>

        <div 
          role="radiogroup" 
          aria-label="Window control position"
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {/* Card 1: LEFT — Mac Style */}
          <div
            role="radio"
            aria-checked={(settings.windowControlPosition || 'left') === 'left'}
            tabIndex={0}
            onClick={() => handleUpdate({ windowControlPosition: 'left' })}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                handleUpdate({ windowControlPosition: 'left' });
              }
            }}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative space-y-3 flex flex-col justify-between ${
              (settings.windowControlPosition || 'left') === 'left'
                ? 'border-[var(--orion-accent)] bg-[var(--orion-surface-hover)] ring-2 ring-[var(--orion-accent)]/30'
                : 'border-[var(--orion-border)] bg-[var(--orion-surface)] hover:border-[var(--orion-border-strong)] hover:bg-[var(--orion-surface-hover)]'
            }`}
          >
            <div className="border border-[var(--orion-border)] rounded-lg overflow-hidden bg-[var(--orion-surface-elevated)] shadow-sm">
              <div className="h-8 px-3 flex items-center justify-between border-b border-[var(--orion-border)] bg-[var(--orion-surface)]">
                <div className="flex items-center gap-2">
                  <OrionWindowControls appName="Preview" position="left" />
                  <span className="text-[11px] font-semibold text-[var(--orion-text-primary)] pl-1">Application</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-white/10" />
              </div>
              <div className="h-10 p-2 flex items-center justify-center bg-[var(--orion-surface)]/50">
                <span className="text-[10px] text-[var(--orion-text-muted)] font-mono">Yellow • Green • Red</span>
              </div>
            </div>

            <div className="flex items-start justify-between gap-3 pt-1">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--orion-text-primary)]">Left — Mac style</span>
                  {(settings.windowControlPosition || 'left') === 'left' && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[var(--orion-accent)] text-[var(--os-text-primary-inverse)] font-bold">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[var(--orion-text-secondary)]">
                  Minimize (Yellow), Maximize (Green), Close (Red) grouped on top-left.
                </p>
              </div>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                (settings.windowControlPosition || 'left') === 'left'
                  ? 'border-[var(--orion-accent)] bg-[var(--orion-accent)]'
                  : 'border-[var(--orion-border-strong)] bg-transparent'
              }`}>
                {(settings.windowControlPosition || 'left') === 'left' && (
                  <div className="w-1.5 h-1.5 rounded-full bg-black" />
                )}
              </div>
            </div>
          </div>

          {/* Card 2: RIGHT — Windows Position */}
          <div
            role="radio"
            aria-checked={settings.windowControlPosition === 'right'}
            tabIndex={0}
            onClick={() => handleUpdate({ windowControlPosition: 'right' })}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                handleUpdate({ windowControlPosition: 'right' });
              }
            }}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative space-y-3 flex flex-col justify-between ${
              settings.windowControlPosition === 'right'
                ? 'border-[var(--orion-accent)] bg-[var(--orion-surface-hover)] ring-2 ring-[var(--orion-accent)]/30'
                : 'border-[var(--orion-border)] bg-[var(--orion-surface)] hover:border-[var(--orion-border-strong)] hover:bg-[var(--orion-surface-hover)]'
            }`}
          >
            <div className="border border-[var(--orion-border)] rounded-lg overflow-hidden bg-[var(--orion-surface-elevated)] shadow-sm">
              <div className="h-8 px-3 flex items-center justify-between border-b border-[var(--orion-border)] bg-[var(--orion-surface)]">
                <span className="text-[11px] font-semibold text-[var(--orion-text-primary)]">Application</span>
                <div className="flex items-center gap-2">
                  <OrionWindowControls appName="Preview" position="right" />
                </div>
              </div>
              <div className="h-10 p-2 flex items-center justify-center bg-[var(--orion-surface)]/50">
                <span className="text-[10px] text-[var(--orion-text-muted)] font-mono">Yellow • Green • Red</span>
              </div>
            </div>

            <div className="flex items-start justify-between gap-3 pt-1">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--orion-text-primary)]">Right — Windows style</span>
                  {settings.windowControlPosition === 'right' && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[var(--orion-accent)] text-[var(--os-text-primary-inverse)] font-bold">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[var(--orion-text-secondary)]">
                  Minimize (Yellow), Maximize (Green), Close (Red) grouped on top-right.
                </p>
              </div>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                settings.windowControlPosition === 'right'
                  ? 'border-[var(--orion-accent)] bg-[var(--orion-accent)]'
                  : 'border-[var(--orion-border-strong)] bg-transparent'
              }`}>
                {settings.windowControlPosition === 'right' && (
                  <div className="w-1.5 h-1.5 rounded-full bg-black" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. LOCK SCREEN WIDGETS CONFIGURATION */}
      <div className="bg-[var(--orion-surface)] border border-[var(--orion-border)] rounded-xl p-5 space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--orion-text-muted)] flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-[var(--orion-accent)]" />
            Lock Screen Widgets
          </label>
          <p className="text-xs text-[var(--orion-text-secondary)] mt-1">
            Configure up to 3 lock-screen widgets (Time & Date, Weather, System Notifications), change their display sequence, and protect sensitive notifications on the locked desktop.
          </p>
        </div>

        <div className="space-y-3">
          {[...lockPrefs.widgets].sort((a, b) => a.order - b.order).map((w, idx) => {
            const label = w.id === 'time-date' 
              ? 'Time & Date (Digital clock & timezone)' 
              : w.id === 'weather' 
              ? 'Weather (Local conditions & temperature)' 
              : 'System Notifications (Alert badges & exception counts)';

            const IconComp = w.id === 'time-date' ? Clock : w.id === 'weather' ? CloudSun : Bell;

            const handleToggle = () => {
              const currentEnabled = lockPrefs.widgets.filter(item => item.enabled).length;
              if (!w.enabled && currentEnabled >= 3) return; // max 3
              const next = lockPrefs.widgets.map(item => item.id === w.id ? { ...item, enabled: !item.enabled } : item);
              const updated = { ...lockPrefs, widgets: next };
              setLockPrefs(updated);
              saveLockScreenPreferences(updated);
            };

            const handleMove = (direction: 'up' | 'down') => {
              const list = [...lockPrefs.widgets].sort((a, b) => a.order - b.order);
              const curIdx = list.findIndex(item => item.id === w.id);
              if (curIdx === -1) return;
              const targetIdx = direction === 'up' ? curIdx - 1 : curIdx + 1;
              if (targetIdx < 0 || targetIdx >= list.length) return;
              const tmp = list[curIdx].order;
              list[curIdx].order = list[targetIdx].order;
              list[targetIdx].order = tmp;
              const updated = { ...lockPrefs, widgets: list };
              setLockPrefs(updated);
              saveLockScreenPreferences(updated);
            };

            return (
              <div 
                key={w.id} 
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                  w.enabled 
                    ? 'border-[var(--orion-accent)] bg-[var(--orion-surface-secondary)]' 
                    : 'border-[var(--orion-border)] bg-[var(--orion-surface)] opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={w.enabled}
                    onChange={handleToggle}
                    className="w-4 h-4 rounded accent-[var(--orion-accent)] cursor-pointer"
                  />
                  <IconComp className="w-4 h-4 text-[var(--orion-accent)] shrink-0" />
                  <span className="text-xs font-semibold text-[var(--orion-text)]">{label}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMove('up')}
                    className="p-1 rounded bg-[var(--orion-surface)] hover:bg-[var(--orion-surface-hover)] border border-[var(--orion-border)] disabled:opacity-30 transition-colors"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5 text-[var(--orion-text)]" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === lockPrefs.widgets.length - 1}
                    onClick={() => handleMove('down')}
                    className="p-1 rounded bg-[var(--orion-surface)] hover:bg-[var(--orion-surface-hover)] border border-[var(--orion-border)] disabled:opacity-30 transition-colors"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5 text-[var(--orion-text)]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Privacy Toggle */}
        <label className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--orion-border)] bg-[var(--orion-surface-secondary)] cursor-pointer">
          <div>
            <span className="text-xs font-semibold text-[var(--orion-text)] block">Lock Screen Privacy Mode</span>
            <span className="text-[11px] text-[var(--orion-text-muted)]">
              Prevent confidential shipment numbers, credentials, and notification contents from displaying while workstation is locked
            </span>
          </div>
          <input
            type="checkbox"
            checked={lockPrefs.privacyMode}
            onChange={(e) => {
              const updated = { ...lockPrefs, privacyMode: e.target.checked };
              setLockPrefs(updated);
              saveLockScreenPreferences(updated);
            }}
            className="w-4 h-4 rounded accent-[var(--orion-accent)] cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
};
