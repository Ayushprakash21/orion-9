import React from 'react';
import { 
  Monitor, LayoutGrid, Layers, AppWindow
} from 'lucide-react';
import { PersonalizationSettings, DesktopIconSize, DesktopIconLayout, DockPosition, DockSize, WindowControlPosition } from '../../theme/themeTypes';
import { OrionWindowControls } from '../../os/components/OrionWindowControls';
import { useOSGeometry } from '../../os/dock/DockGeometry';
import { loadPreferences, savePreferences } from '../../os/theme/OrionThemeStorage';
import { RuntimeSettingsAuthority } from '../../os/settings/RuntimeSettingsAuthority';

interface PersonalizationSettingsPanelProps {
  settings: PersonalizationSettings;
  onChange: (updated: Partial<PersonalizationSettings>) => void;
}

export const PersonalizationSettingsPanel: React.FC<PersonalizationSettingsPanelProps> = ({ settings, onChange }) => {
  const { previewSettings } = useOSGeometry();

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
      if (updated.dockTransparency !== undefined) {
        prefs.transparencyIntensity = updated.dockTransparency;
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

      {/* 2. DOCK / TASKBAR SETTINGS */}
      <div className="bg-[var(--orion-surface)] border border-[var(--orion-border)] rounded-xl p-5 space-y-4">
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--orion-text-muted)] flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-[var(--orion-accent)]" />
          Dock & Taskbar Settings
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Dock Position */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-[var(--orion-text)]">Dock Screen Position</span>
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
                      ? 'border-[var(--orion-accent)] bg-[var(--orion-accent-subtle)] text-[var(--orion-text)] font-semibold'
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
            <span className="text-xs font-semibold text-[var(--orion-text)]">Dock Size</span>
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
                      ? 'border-[var(--orion-accent)] bg-[var(--orion-accent-subtle)] text-[var(--orion-text)] font-semibold'
                      : 'border-[var(--orion-border)] hover:bg-[var(--orion-surface-hover)] text-[var(--orion-text-secondary)]'
                  }`}
                >
                  {ds.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dock Toggles & Transparency */}
        <div className="pt-3 border-t border-[var(--orion-border)] space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center justify-between p-3 rounded-lg border border-[var(--orion-border)] bg-[var(--orion-surface-secondary)] cursor-pointer">
              <span className="text-xs font-semibold text-[var(--orion-text)]">Auto-Hide Dock</span>
              <input
                type="checkbox"
                checked={settings.dockAutoHide}
                onChange={(e) => handleUpdate({ dockAutoHide: e.target.checked })}
                className="w-4 h-4 rounded accent-[var(--orion-accent)]"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg border border-[var(--orion-border)] bg-[var(--orion-surface-secondary)] cursor-pointer">
              <span className="text-xs font-semibold text-[var(--orion-text)]">Icon Magnification Hover</span>
              <input
                type="checkbox"
                checked={settings.dockMagnification}
                onChange={(e) => handleUpdate({ dockMagnification: e.target.checked })}
                className="w-4 h-4 rounded accent-[var(--orion-accent)]"
              />
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-[var(--orion-text)]">Dock Surface Opacity:</span>
              <span className="font-mono text-[var(--orion-text-secondary)]">{settings.dockTransparency}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={settings.dockTransparency}
              onChange={(e) => handleUpdate({ dockTransparency: Number(e.target.value) })}
              className="w-full accent-[var(--orion-accent)]"
            />
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
                <span className="text-[10px] text-[var(--orion-text-muted)] font-mono">Red • Yellow • Green</span>
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
                  Close (Red), Minimize (Yellow), Maximize (Green) grouped on top-left.
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

          {/* Card 2: RIGHT — Windows Style */}
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
                <span className="text-[10px] text-[var(--orion-text-muted)] font-mono">Green • Yellow • Red</span>
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
                  Maximize (Green), Minimize (Yellow), Close (Red) grouped on top-right.
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
    </div>
  );
};
