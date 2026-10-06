import React, { useState } from 'react';
import { 
  Sun, Moon, Laptop, Eye, Sparkles, Check, RefreshCw, Palette, 
  Square, Layers, Sliders, ShieldCheck, Download, Upload, Info
} from 'lucide-react';
import { PersonalizationSettings, AppearanceMode, AccentPresetKey, WindowStyle, CornerStyle, DensityMode } from '../../theme/themeTypes';
import { ACCENT_PRESETS, APPEARANCE_PRESETS } from '../../theme/themePresets';
import { calculateContrastColor, exportThemeJSON, importThemeJSON } from '../../theme/themeResolver';
import { useToast } from '../../store/ToastContext';

interface AppearanceSettingsPanelProps {
  settings: PersonalizationSettings;
  onChange: (updated: Partial<PersonalizationSettings>) => void;
}

export const AppearanceSettingsPanel: React.FC<AppearanceSettingsPanelProps> = ({ settings, onChange }) => {
  const { showToast } = useToast();
  const [customHex, setCustomHex] = useState(settings.customAccentHex || '#64748B');
  const [importError, setImportError] = useState('');

  // Mode Cards Configuration
  const modes: { key: AppearanceMode; title: string; desc: string; icon: React.ReactNode }[] = [
    { key: 'dark', title: 'Orion Dark (Graphite)', desc: 'Neutral dark graphite foundation. Professional & calm.', icon: <Moon className="w-5 h-5" /> },
    { key: 'light', title: 'Orion Light (Slate)', desc: 'Clean high-clarity porcelain slate palette.', icon: <Sun className="w-5 h-5" /> },
    { key: 'auto', title: 'System Auto', desc: 'Syncs automatically with system dark/light preference.', icon: <Laptop className="w-5 h-5" /> },
    { key: 'oled', title: 'OLED Black', desc: 'Pure zero-pixel #000000 black for maximum contrast.', icon: <Sparkles className="w-5 h-5" /> },
    { key: 'monochrome', title: 'Monochrome', desc: 'Grayscale architecture with high-contrast elements.', icon: <Eye className="w-5 h-5" /> }
  ];

  // Accent Colors Preset List
  const accentPresets = Object.values(ACCENT_PRESETS).filter(a => a.key !== 'custom');

  const currentAccentHex = settings.accentKey === 'custom' 
    ? customHex 
    : (ACCENT_PRESETS[settings.accentKey]?.hex || '#64748B');

  const textContrastOnAccent = calculateContrastColor(currentAccentHex);

  const handleCustomHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomHex(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      onChange({ accentKey: 'custom', customAccentHex: val });
    }
  };

  const handleExportTheme = () => {
    const jsonStr = exportThemeJSON(settings, 'My Custom Orion Theme');
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orion-theme-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Orion theme exported successfully', 'success');
  };

  const handleImportThemeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const imported = importThemeJSON(content);
      if (imported) {
        onChange(imported);
        showToast('Theme imported successfully!', 'success');
      } else {
        setImportError('Invalid or corrupted theme file JSON.');
        showToast('Failed to import theme file', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full space-y-8">
      {/* Header Banner */}
      <div className="bg-[var(--orion-surface-secondary)] border border-[var(--orion-border)] rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--orion-text)] flex items-center gap-2">
            <Palette className="w-6 h-6 text-[var(--orion-accent)]" />
            Appearance & System Theme
          </h2>
          <p className="text-sm text-[var(--orion-text-secondary)] mt-1">
            Personalize your operating system visual foundation, window styles, accent highlights, and density.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--orion-surface)] text-[var(--orion-text)] border border-[var(--orion-border)] hover:bg-[var(--orion-surface-hover)] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export Theme
          </button>
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--orion-accent)] text-[var(--orion-on-accent)] hover:opacity-90 transition-opacity cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            Import Theme
            <input type="file" accept=".json" onChange={handleImportThemeFile} className="hidden" />
          </label>
        </div>
      </div>

      {importError && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
          {importError}
        </div>
      )}

      {/* 1. APPEARANCE MODE SELECTION */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--orion-text-muted)]">
          Appearance Mode
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {modes.map(mode => {
            const isSelected = settings.appearanceMode === mode.key;
            return (
              <button
                key={mode.key}
                type="button"
                onClick={() => onChange({ appearanceMode: mode.key })}
                className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  isSelected 
                    ? 'border-[var(--orion-accent)] bg-[var(--orion-accent-subtle)] ring-2 ring-[var(--orion-accent)]/30' 
                    : 'border-[var(--orion-border)] bg-[var(--orion-surface)] hover:bg-[var(--orion-surface-hover)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-[var(--orion-accent)] text-[var(--orion-on-accent)]' : 'bg-[var(--orion-surface-secondary)] text-[var(--orion-text)]'}`}>
                      {mode.icon}
                    </div>
                    {isSelected && (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--orion-accent)] text-[var(--orion-on-accent)]">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-[var(--orion-text)]">{mode.title}</h4>
                  <p className="text-xs text-[var(--orion-text-secondary)] mt-1">{mode.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. ACCENT COLOR SELECTION */}
      <div className="space-y-4 bg-[var(--orion-surface)] border border-[var(--orion-border)] rounded-xl p-5">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--orion-text-muted)]">
            Accent Highlight Color
          </label>
          <p className="text-xs text-[var(--orion-text-secondary)] mt-1">
            Accent colors apply to interactive buttons, active navigation, focus indicators, and selected states.
          </p>
        </div>

        {/* Swatch Matrix */}
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-3">
          {accentPresets.map(preset => {
            const isSelected = settings.accentKey === preset.key;
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => onChange({ accentKey: preset.key as AccentPresetKey })}
                className={`group flex flex-col items-center p-2 rounded-lg border transition-all ${
                  isSelected 
                    ? 'border-[var(--orion-accent)] bg-[var(--orion-surface-secondary)] ring-2 ring-[var(--orion-accent)]/40' 
                    : 'border-[var(--orion-border)] hover:bg-[var(--orion-surface-hover)]'
                }`}
                title={preset.name}
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm"
                  style={{ backgroundColor: preset.hex }}
                >
                  {isSelected && <Check className="w-4 h-4" style={{ color: preset.textOnAccent }} />}
                </div>
                <span className="text-[10px] font-medium text-[var(--orion-text-secondary)] mt-1 truncate max-w-full">
                  {preset.name.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom HEX Picker Row */}
        <div className="pt-3 border-t border-[var(--orion-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-[var(--orion-text)]">Custom HEX Color:</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentAccentHex}
                onChange={handleCustomHexChange}
                className="w-8 h-8 rounded cursor-pointer border border-[var(--orion-border)] bg-transparent p-0"
              />
              <input
                type="text"
                value={customHex}
                onChange={handleCustomHexChange}
                placeholder="#3B82F6"
                className="w-28 px-2.5 py-1 text-xs rounded-md bg-[var(--orion-surface-secondary)] border border-[var(--orion-border)] text-[var(--orion-text)] uppercase font-mono focus:outline-none focus:border-[var(--orion-accent)]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--orion-text-secondary)] bg-[var(--orion-surface-secondary)] px-3 py-1.5 rounded-lg border border-[var(--orion-border)]">
            <ShieldCheck className="w-4 h-4 text-[var(--orion-accent)]" />
            <span>WCAG AA Contrast Text: </span>
            <span 
              className="px-2 py-0.5 rounded font-bold text-[10px]"
              style={{ backgroundColor: currentAccentHex, color: textContrastOnAccent }}
            >
              Sample Text ({textContrastOnAccent === '#FFFFFF' ? 'White' : 'Dark'})
            </span>
          </div>
        </div>
      </div>

      {/* 3. WINDOW & CORNER STYLES & DENSITY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Window Style */}
        <div className="bg-[var(--orion-surface)] border border-[var(--orion-border)] rounded-xl p-5 space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--orion-text-muted)] flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            Window Style
          </label>
          <div className="space-y-2">
            {[
              { key: 'standard', label: 'Standard Opaque', desc: 'Crisp high-performance solid surface' },
              { key: 'soft', label: 'Soft Surface', desc: 'Subtle elevation elevation boundaries' },
              { key: 'glass', label: 'Glass Translucency', desc: 'Backdrop blur (subject to transparency toggle)' },
              { key: 'compact', label: 'Compact Header', desc: 'Reduced titlebar height for maximum space' }
            ].map(w => (
              <button
                key={w.key}
                type="button"
                onClick={() => onChange({ windowStyle: w.key as WindowStyle })}
                className={`w-full p-2.5 rounded-lg text-left text-xs font-medium border transition-colors ${
                  settings.windowStyle === w.key
                    ? 'border-[var(--orion-accent)] bg-[var(--orion-accent-subtle)] text-[var(--orion-text)]'
                    : 'border-[var(--orion-border)] hover:bg-[var(--orion-surface-hover)] text-[var(--orion-text-secondary)]'
                }`}
              >
                <div className="font-semibold text-[var(--orion-text)]">{w.label}</div>
                <div className="text-[11px] opacity-80 mt-0.5">{w.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Corner Style */}
        <div className="bg-[var(--orion-surface)] border border-[var(--orion-border)] rounded-xl p-5 space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--orion-text-muted)] flex items-center gap-1.5">
            <Square className="w-4 h-4" />
            Corner Rounding
          </label>
          <div className="space-y-2">
            {[
              { key: 'square', label: 'Square (4px)', desc: 'Sharp technical borders' },
              { key: 'subtle', label: 'Subtle (8px)', desc: 'Balanced OS standard radius' },
              { key: 'rounded', label: 'Rounded (12px)', desc: 'Smooth modern corner profile' }
            ].map(c => (
              <button
                key={c.key}
                type="button"
                onClick={() => onChange({ cornerStyle: c.key as CornerStyle })}
                className={`w-full p-2.5 rounded-lg text-left text-xs font-medium border transition-colors ${
                  settings.cornerStyle === c.key
                    ? 'border-[var(--orion-accent)] bg-[var(--orion-accent-subtle)] text-[var(--orion-text)]'
                    : 'border-[var(--orion-border)] hover:bg-[var(--orion-surface-hover)] text-[var(--orion-text-secondary)]'
                }`}
              >
                <div className="font-semibold text-[var(--orion-text)]">{c.label}</div>
                <div className="text-[11px] opacity-80 mt-0.5">{c.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Interface Density */}
        <div className="bg-[var(--orion-surface)] border border-[var(--orion-border)] rounded-xl p-5 space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--orion-text-muted)] flex items-center gap-1.5">
            <Sliders className="w-4 h-4" />
            Interface Density
          </label>
          <div className="space-y-2">
            {[
              { key: 'compact', label: 'Compact Density', desc: 'Maximum information per screen area' },
              { key: 'comfortable', label: 'Comfortable', desc: 'Standard balanced spacing (Default)' },
              { key: 'spacious', label: 'Spacious', desc: 'Generous padding for high-DPI displays' }
            ].map(d => (
              <button
                key={d.key}
                type="button"
                onClick={() => onChange({ density: d.key as DensityMode })}
                className={`w-full p-2.5 rounded-lg text-left text-xs font-medium border transition-colors ${
                  settings.density === d.key
                    ? 'border-[var(--orion-accent)] bg-[var(--orion-accent-subtle)] text-[var(--orion-text)]'
                    : 'border-[var(--orion-border)] hover:bg-[var(--orion-surface-hover)] text-[var(--orion-text-secondary)]'
                }`}
              >
                <div className="font-semibold text-[var(--orion-text)]">{d.label}</div>
                <div className="text-[11px] opacity-80 mt-0.5">{d.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. INTERACTIVE LIVE PREVIEW BOX */}
      <div className="bg-[var(--orion-surface)] border border-[var(--orion-border)] rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--orion-text-muted)] flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-[var(--orion-accent)]" />
            Live Interface Interactive Preview
          </label>
          <span className="text-[11px] text-[var(--orion-text-muted)] font-mono">
            Active Accent: {currentAccentHex}
          </span>
        </div>

        {/* Mock Window Container */}
        <div 
          className="border rounded-xl shadow-lg overflow-hidden transition-all"
          style={{
            backgroundColor: 'var(--orion-surface-secondary)',
            borderColor: 'var(--orion-border)',
            borderRadius: settings.cornerStyle === 'square' ? '4px' : settings.cornerStyle === 'rounded' ? '12px' : '8px'
          }}
        >
          {/* Title Bar */}
          <div 
            className="px-4 py-2.5 flex items-center justify-between border-b"
            style={{
              backgroundColor: 'var(--orion-window-header-bg)',
              borderColor: 'var(--orion-border)'
            }}
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block" />
              </div>
              <span className="text-xs font-semibold text-[var(--orion-text)] ml-2">
                Supply Chain Control Center — Preview Window
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--orion-surface)] text-[var(--orion-text-muted)]">
              {settings.appearanceMode.toUpperCase()} MODE
            </span>
          </div>

          {/* Window Body */}
          <div className="p-4 space-y-4" style={{ backgroundColor: 'var(--orion-surface)' }}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm"
                  style={{
                    backgroundColor: 'var(--orion-accent)',
                    color: 'var(--orion-on-accent)'
                  }}
                >
                  Primary Action Button
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                  style={{
                    backgroundColor: 'var(--orion-surface-secondary)',
                    borderColor: 'var(--orion-border)',
                    color: 'var(--orion-text)'
                  }}
                >
                  Secondary Action
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span 
                  className="px-2.5 py-1 rounded-full text-[11px] font-bold"
                  style={{
                    backgroundColor: 'var(--orion-accent-subtle)',
                    color: 'var(--orion-accent)'
                  }}
                >
                  Active Status Badge
                </span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400">
                  Operational
                </span>
              </div>
            </div>

            {/* Mock Content Card */}
            <div 
              className="p-3.5 rounded-lg border flex items-center justify-between"
              style={{
                backgroundColor: 'var(--orion-card-bg)',
                borderColor: 'var(--orion-border)'
              }}
            >
              <div className="space-y-1">
                <div className="text-xs font-bold text-[var(--orion-text)]">
                  SKU-4902 Inventory Status
                </div>
                <div className="text-[11px] text-[var(--orion-text-secondary)]">
                  Stock On Hand: 14,200 units • Reorder point reached in 3 days
                </div>
              </div>
              <div className="w-24 h-2 rounded-full overflow-hidden bg-[var(--orion-surface-secondary)]">
                <div className="h-full w-3/4" style={{ backgroundColor: 'var(--orion-accent)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
