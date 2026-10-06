import React from 'react';
import { 
  Eye, Zap, ShieldAlert, Sparkles, Sliders, CheckCircle2, 
  Contrast, Maximize2, Monitor
} from 'lucide-react';
import { PersonalizationSettings, ColorFilterMode } from '../../theme/themeTypes';

interface AccessibilitySettingsPanelProps {
  settings: PersonalizationSettings;
  onChange: (updated: Partial<PersonalizationSettings>) => void;
}

export const AccessibilitySettingsPanel: React.FC<AccessibilitySettingsPanelProps> = ({ settings, onChange }) => {
  const colorFilters: { key: ColorFilterMode; title: string; desc: string }[] = [
    { key: 'none', title: 'None (Standard Display)', desc: 'Full range original color reproduction' },
    { key: 'protanopia', title: 'Protanopia (Red-Blind)', desc: 'Adjusts red spectrum for enhanced differentiation' },
    { key: 'deuteranopia', title: 'Deuteranopia (Green-Blind)', desc: 'Adjusts green spectrum contrast' },
    { key: 'tritanopia', title: 'Tritanopia (Blue-Blind)', desc: 'Adjusts blue spectrum contrast' },
    { key: 'grayscale', title: 'Grayscale', desc: 'Converts entire OS rendering to pure high-contrast grayscale' }
  ];

  return (
    <div className="space-y-8 p-6 max-w-5xl">
      {/* Banner */}
      <div className="bg-[var(--orion-surface-secondary)] border border-[var(--orion-border)] rounded-xl p-5">
        <h2 className="text-xl font-bold text-[var(--orion-text)] flex items-center gap-2">
          <Eye className="w-6 h-6 text-[var(--orion-accent)]" />
          Accessibility & Display Scaling
        </h2>
        <p className="text-sm text-[var(--orion-text-secondary)] mt-1">
          Adjust display zoom, motion preferences, transparency filters, color blind assistance, and focus indicator contrast.
        </p>
      </div>

      {/* 1. UI SCALING */}
      <div className="bg-[var(--orion-surface)] border border-[var(--orion-border)] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--orion-text-muted)] flex items-center gap-1.5">
            <Maximize2 className="w-4 h-4 text-[var(--orion-accent)]" />
            UI Display Scaling
          </label>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-[var(--orion-accent-subtle)] text-[var(--orion-accent)]">
            {settings.uiScale || 100}% Scale
          </span>
        </div>

        <div className="space-y-3">
          <input
            type="range"
            min="80"
            max="150"
            step="5"
            value={settings.uiScale || 100}
            onChange={(e) => onChange({ uiScale: Number(e.target.value) })}
            className="w-full accent-[var(--orion-accent)]"
          />

          <div className="flex justify-between text-[11px] text-[var(--orion-text-muted)] font-mono">
            <span>80% (Compact)</span>
            <span>100% (Standard OS)</span>
            <span>125% (Large)</span>
            <span>150% (High-DPI Zoom)</span>
          </div>
        </div>
      </div>

      {/* 2. MOTION & TRANSPARENCY TOGGLES */}
      <div className="bg-[var(--orion-surface)] border border-[var(--orion-border)] rounded-xl p-5 space-y-4">
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--orion-text-muted)] flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-[var(--orion-accent)]" />
          Motion & Visual Effects Controls
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex items-start justify-between p-4 rounded-xl border border-[var(--orion-border)] bg-[var(--orion-surface-secondary)] cursor-pointer hover:bg-[var(--orion-surface-hover)] transition-colors">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[var(--orion-text)] block">Reduced Motion</span>
              <span className="text-[11px] text-[var(--orion-text-secondary)] block">
                Disables CSS transitions, window opening animations, and dock bounce effects.
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.reducedMotion}
              onChange={(e) => onChange({ reducedMotion: e.target.checked })}
              className="w-4 h-4 rounded accent-[var(--orion-accent)] mt-0.5"
            />
          </label>

          <label className="flex items-start justify-between p-4 rounded-xl border border-[var(--orion-border)] bg-[var(--orion-surface-secondary)] cursor-pointer hover:bg-[var(--orion-surface-hover)] transition-colors">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[var(--orion-text)] block">Reduced Transparency</span>
              <span className="text-[11px] text-[var(--orion-text-secondary)] block">
                Disables backdrop blur and glass translucency for maximum readability.
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.reducedTransparency}
              onChange={(e) => onChange({ reducedTransparency: e.target.checked })}
              className="w-4 h-4 rounded accent-[var(--orion-accent)] mt-0.5"
            />
          </label>
        </div>
      </div>

      {/* 3. HIGH CONTRAST & FOCUS INDICATORS */}
      <div className="bg-[var(--orion-surface)] border border-[var(--orion-border)] rounded-xl p-5 space-y-4">
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--orion-text-muted)] flex items-center gap-1.5">
          <Contrast className="w-4 h-4 text-[var(--orion-accent)]" />
          High Contrast & Keyboard Focus
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex items-start justify-between p-4 rounded-xl border border-[var(--orion-border)] bg-[var(--orion-surface-secondary)] cursor-pointer hover:bg-[var(--orion-surface-hover)] transition-colors">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[var(--orion-text)] block">High Contrast Mode</span>
              <span className="text-[11px] text-[var(--orion-text-secondary)] block">
                Forces maximum contrast borders and monochrome elements across all views.
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.highContrast}
              onChange={(e) => onChange({ highContrast: e.target.checked })}
              className="w-4 h-4 rounded accent-[var(--orion-accent)] mt-0.5"
            />
          </label>

          <label className="flex items-start justify-between p-4 rounded-xl border border-[var(--orion-border)] bg-[var(--orion-surface-secondary)] cursor-pointer hover:bg-[var(--orion-surface-hover)] transition-colors">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[var(--orion-text)] block">High Visibility Focus Ring</span>
              <span className="text-[11px] text-[var(--orion-text-secondary)] block">
                Uses vibrant amber focus outline for keyboard navigation.
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.highContrastFocusRing}
              onChange={(e) => onChange({ highContrastFocusRing: e.target.checked })}
              className="w-4 h-4 rounded accent-[var(--orion-accent)] mt-0.5"
            />
          </label>
        </div>
      </div>

      {/* 4. COLOR FILTERS */}
      <div className="bg-[var(--orion-surface)] border border-[var(--orion-border)] rounded-xl p-5 space-y-4">
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--orion-text-muted)] flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[var(--orion-accent)]" />
          Color Vision Assistance Filters
        </label>

        <div className="space-y-2">
          {colorFilters.map(filter => {
            const isSelected = settings.colorFilter === filter.key;
            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => onChange({ colorFilter: filter.key })}
                className={`w-full p-3 rounded-lg text-left border flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'border-[var(--orion-accent)] bg-[var(--orion-accent-subtle)] text-[var(--orion-text)] font-semibold'
                    : 'border-[var(--orion-border)] bg-[var(--orion-surface-secondary)] text-[var(--orion-text-secondary)] hover:bg-[var(--orion-surface-hover)]'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-[var(--orion-text)]">{filter.title}</div>
                  <div className="text-[11px] opacity-80 mt-0.5">{filter.desc}</div>
                </div>
                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-[var(--orion-accent)] shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
