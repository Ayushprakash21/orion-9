import React, { useState } from 'react';
import { 
  Image as ImageIcon, Monitor, Sliders, LayoutGrid, Check, 
  Eye, RefreshCcw, Sparkles, Layers, ArrowUpRight
} from 'lucide-react';
import { PersonalizationSettings, DesktopIconSize, DesktopIconLayout, DockPosition, DockSize } from '../../theme/themeTypes';
import { useToast } from '../../store/ToastContext';

interface PersonalizationSettingsPanelProps {
  settings: PersonalizationSettings;
  onChange: (updated: Partial<PersonalizationSettings>) => void;
}

export const PersonalizationSettingsPanel: React.FC<PersonalizationSettingsPanelProps> = ({ settings, onChange }) => {
  const { showToast } = useToast();

  const wallpapers = [
    { title: 'Graphite Mesh', value: 'linear-gradient(135deg, #0F1115 0%, #1A1F29 50%, #0F1115 100%)', type: 'gradient' },
    { title: 'Orion Midnight', value: 'linear-gradient(180deg, #0A0C10 0%, #161A22 100%)', type: 'gradient' },
    { title: 'Slate Geometry', value: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', type: 'gradient' },
    { title: 'Emerald Deep', value: 'linear-gradient(135deg, #064E3B 0%, #022C22 100%)', type: 'gradient' },
    { title: 'Solid Dark', value: '#0F1115', type: 'solid' },
    { title: 'Solid Slate', value: '#1E293B', type: 'solid' }
  ];

  return (
    <div className="w-full space-y-8">
      {/* Banner */}
      <div className="bg-[var(--orion-surface-secondary)] border border-[var(--orion-border)] rounded-xl p-5">
        <h2 className="text-xl font-bold text-[var(--orion-text)] flex items-center gap-2">
          <Monitor className="w-6 h-6 text-[var(--orion-accent)]" />
          Desktop & Dock Personalization
        </h2>
        <p className="text-sm text-[var(--orion-text-secondary)] mt-1">
          Customize desktop wallpaper, desktop icon alignment and sizing, and taskbar/dock position, size, and auto-hide behaviors.
        </p>
      </div>

      {/* 1. WALLPAPER & BACKGROUND SELECTION */}
      <div className="space-y-4 bg-[var(--orion-surface)] border border-[var(--orion-border)] rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--orion-text-muted)] flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-[var(--orion-accent)]" />
              Desktop Wallpaper
            </label>
            <p className="text-xs text-[var(--orion-text-secondary)] mt-1">
              Select a wallpaper preset or specify custom image URL/solid background.
            </p>
          </div>
        </div>

        {/* Wallpaper Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {wallpapers.map(wp => {
            const isSelected = settings.wallpaperValue === wp.value;
            return (
              <button
                key={wp.title}
                type="button"
                onClick={() => onChange({ wallpaperType: wp.type as any, wallpaperValue: wp.value })}
                className={`group relative h-24 rounded-lg border overflow-hidden transition-all flex flex-col justify-end p-2 text-left ${
                  isSelected
                    ? 'border-[var(--orion-accent)] ring-2 ring-[var(--orion-accent)]/50'
                    : 'border-[var(--orion-border)] hover:border-[var(--orion-text-secondary)]'
                }`}
                style={{ background: wp.value }}
              >
                {isSelected && (
                  <span className="absolute top-2 right-2 p-1 rounded-full bg-[var(--orion-accent)] text-[var(--orion-on-accent)] shadow-md">
                    <Check className="w-3 h-3" />
                  </span>
                )}
                <span className="text-[11px] font-semibold text-white drop-shadow-md bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-sm">
                  {wp.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Wallpaper Sliders */}
        <div className="pt-4 border-t border-[var(--orion-border)] grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-[var(--orion-text)]">Wallpaper Blur:</span>
              <span className="font-mono text-[var(--orion-text-secondary)]">{settings.wallpaperBlur}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={settings.wallpaperBlur}
              onChange={(e) => onChange({ wallpaperBlur: Number(e.target.value) })}
              className="w-full accent-[var(--orion-accent)]"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-[var(--orion-text)]">Wallpaper Dim Overlay:</span>
              <span className="font-mono text-[var(--orion-text-secondary)]">{settings.wallpaperDim}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="80"
              value={settings.wallpaperDim}
              onChange={(e) => onChange({ wallpaperDim: Number(e.target.value) })}
              className="w-full accent-[var(--orion-accent)]"
            />
          </div>
        </div>
      </div>

      {/* 2. DESKTOP ICONS SETTINGS */}
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
                  onClick={() => onChange({ iconSize: s.key as DesktopIconSize })}
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
                  onClick={() => onChange({ iconLayout: l.key as DesktopIconLayout })}
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
              onChange={(e) => onChange({ autoArrangeIcons: e.target.checked })}
              className="w-4 h-4 rounded accent-[var(--orion-accent)]"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg border border-[var(--orion-border)] bg-[var(--orion-surface-secondary)] cursor-pointer">
            <span className="text-xs font-semibold text-[var(--orion-text)]">Snap to Grid on Drop</span>
            <input
              type="checkbox"
              checked={settings.snapToGrid}
              onChange={(e) => onChange({ snapToGrid: e.target.checked })}
              className="w-4 h-4 rounded accent-[var(--orion-accent)]"
            />
          </label>
        </div>
      </div>

      {/* 3. DOCK / TASKBAR SETTINGS */}
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
                  onClick={() => onChange({ dockPosition: p.key as DockPosition })}
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
                  onClick={() => onChange({ dockSize: ds.key as DockSize })}
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
                onChange={(e) => onChange({ dockAutoHide: e.target.checked })}
                className="w-4 h-4 rounded accent-[var(--orion-accent)]"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg border border-[var(--orion-border)] bg-[var(--orion-surface-secondary)] cursor-pointer">
              <span className="text-xs font-semibold text-[var(--orion-text)]">Icon Magnification Hover</span>
              <input
                type="checkbox"
                checked={settings.dockMagnification}
                onChange={(e) => onChange({ dockMagnification: e.target.checked })}
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
              onChange={(e) => onChange({ dockTransparency: Number(e.target.value) })}
              className="w-full accent-[var(--orion-accent)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
