import React, { useState } from 'react';
import { 
  Sun, Moon, Laptop, Eye, Sparkles, Check, RefreshCw, Palette, 
  Layers, ShieldCheck, Download, Upload, Sliders, Monitor, AppWindow
} from 'lucide-react';
import { useOrionTheme } from '../../os/theme/useOrionTheme';
import { ORION_THEMES, getThemeList } from '../../os/theme/OrionThemeRegistry';
import { OrionThemeId, OrionAppearanceMode, OrionCornerRadius, OrionWindowStyle, OrionMorphismMode } from '../../os/theme/OrionThemeTypes';
import { OrionWindowControls } from '../../os/components/OrionWindowControls';
import { useToast } from '../../store/ToastContext';

export const AppearanceSettingsPanel: React.FC = () => {
  const { theme, preferences, resolvedAccent, setTheme, setPreference, resetAppearance, isDark } = useOrionTheme();
  const { showToast } = useToast();
  const [customHex, setCustomHex] = useState(preferences.customAccent || '#D8DDE3');
  const [importError, setImportError] = useState('');

  const themes = getThemeList();

  // Mode Cards Configuration
  const modes: { key: OrionAppearanceMode; title: string; desc: string; icon: React.ReactNode }[] = [
    { key: 'dark', title: 'Dark Mode', desc: 'Deep graphite foundation with subdued contrast and minimal eye strain.', icon: <Moon className="w-5 h-5" /> },
    { key: 'light', title: 'Light Mode', desc: 'Crisp porcelain slate palette designed for high-ambient workstations.', icon: <Sun className="w-5 h-5" /> },
    { key: 'auto', title: 'System Auto', desc: 'Dynamically adapts in real time to your operating system appearance schedule.', icon: <Laptop className="w-5 h-5" /> },
  ];

  // Curated Accent Presets matching macOS and Windows 11 elegance
  const curatedAccents = [
    { hex: '#D8DDE3', name: 'Graphite Slate' },
    { hex: '#A7AAA8', name: 'Silver Mist' },
    { hex: '#7FA58D', name: 'Muted Forest' },
    { hex: '#C7B7A4', name: 'Warm Cashmere' },
    { hex: '#7BA3C9', name: 'Steel Blue' },
    { hex: '#B07DA3', name: 'Dusty Plum' },
    { hex: '#C6A15B', name: 'Amber Gold' },
    { hex: '#5FAF8A', name: 'Sage Green' },
  ];

  const handleCustomHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomHex(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      setPreference('customAccentEnabled', true);
      setPreference('customAccent', val);
    }
  };

  const handleExportTheme = () => {
    const jsonStr = JSON.stringify(preferences, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orion-appearance-${preferences.themeId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Appearance profile exported successfully', 'success');
  };

  const handleImportThemeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.version === 1 && parsed.themeId) {
          if (parsed.themeId in ORION_THEMES) {
            setTheme(parsed.themeId);
          }
          if (parsed.appearanceMode) setPreference('appearanceMode', parsed.appearanceMode);
          if (typeof parsed.customAccentEnabled === 'boolean') setPreference('customAccentEnabled', parsed.customAccentEnabled);
          if (parsed.customAccent) setPreference('customAccent', parsed.customAccent);
          if (typeof parsed.transparencyEnabled === 'boolean') setPreference('transparencyEnabled', parsed.transparencyEnabled);
          if (typeof parsed.transparencyIntensity === 'number') setPreference('transparencyIntensity', parsed.transparencyIntensity);
          if (typeof parsed.blurEnabled === 'boolean') setPreference('blurEnabled', parsed.blurEnabled);
          if (typeof parsed.blurIntensity === 'number') setPreference('blurIntensity', parsed.blurIntensity);
          if (typeof parsed.reduceMotion === 'boolean') setPreference('reduceMotion', parsed.reduceMotion);
          if (parsed.cornerRadius) setPreference('cornerRadius', parsed.cornerRadius);
          if (parsed.windowStyle) setPreference('windowStyle', parsed.windowStyle);
          if (parsed.windowControlPosition) setPreference('windowControlPosition', parsed.windowControlPosition);
          if (parsed.morphismMode) setPreference('morphismMode', parsed.morphismMode);
          showToast('Appearance preferences imported successfully!', 'success');
        } else {
          setImportError('Invalid configuration schema or missing version.');
        }
      } catch (err) {
        setImportError('Failed to parse appearance JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full space-y-8 select-none pb-24 p-4 sm:p-5 md:p-6">
      {/* Header Banner */}
      <div className="bg-[var(--orion-surface)] border border-[var(--orion-border)] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-[var(--orion-text-primary)] flex items-center gap-2.5">
            <Palette className="w-5 h-5 text-[var(--orion-accent)]" />
            Personalization & Appearance Engine
          </h2>
          <p className="text-xs text-[var(--orion-text-secondary)] mt-1.5 leading-relaxed">
            Centralized operating system visual styling. Seamless real-time transitions across desktop, windows, dock, and apps without page reload.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={resetAppearance}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--orion-surface-hover)] text-[var(--orion-text-primary)] border border-[var(--orion-border)] hover:bg-[var(--orion-surface-active)] transition-colors cursor-pointer"
            title="Reset appearance to Orion Graphite defaults"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleExportTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--orion-surface-hover)] text-[var(--orion-text-primary)] border border-[var(--orion-border)] hover:bg-[var(--orion-surface-active)] transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Profile
          </button>
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--orion-accent)] text-[var(--os-text-primary-inverse)] hover:opacity-90 transition-opacity cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            Import Profile
            <input type="file" accept=".json" onChange={handleImportThemeFile} className="hidden" />
          </label>
        </div>
      </div>

      {importError && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
          {importError}
        </div>
      )}

      {/* 1. FIVE BUILT-IN SYSTEM THEMES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--orion-text-muted)] flex items-center gap-1.5">
            <Monitor className="w-4 h-4 text-[var(--orion-accent)]" />
            System Themes (5 First-Class Foundations)
          </label>
          <span className="text-[11px] font-mono text-[var(--orion-text-secondary)]">
            Active: <span className="font-bold text-[var(--orion-text-primary)]">{theme.name}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {themes.map(t => {
            const isSelected = preferences.themeId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between overflow-hidden cursor-pointer ${
                  isSelected 
                    ? 'border-[var(--orion-accent)] ring-2 ring-[var(--orion-accent)]/30 shadow-md' 
                    : 'border-[var(--orion-border)] bg-[var(--orion-surface)] hover:bg-[var(--orion-surface-hover)]'
                }`}
                style={{
                  backgroundColor: isSelected ? t.colors.surface : undefined
                }}
              >
                <div>
                  {/* Theme Swatch Preview Bar */}
                  <div className="flex items-center gap-1.5 p-2 rounded-xl mb-3 border border-white/5" style={{ backgroundColor: t.colors.background }}>
                    <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: t.colors.surface }} />
                    <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: t.colors.surfaceElevated }} />
                    <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: t.colors.accent }} />
                    <div className="w-2.5 h-2.5 rounded-full ml-auto" style={{ backgroundColor: t.colors.success }} />
                  </div>

                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-bold text-[var(--orion-text-primary)]">{t.name}</h4>
                    {isSelected && (
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[var(--orion-accent)] text-[var(--os-text-primary-inverse)]">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--orion-text-secondary)] leading-relaxed">{t.description}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[var(--orion-border)] flex items-center justify-between text-[10px] font-mono text-[var(--orion-text-muted)]">
                  <span>{t.appearance.mode.toUpperCase()}</span>
                  <span className="font-semibold" style={{ color: t.colors.accent }}>{t.colors.accent}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. APPEARANCE MODE SELECTION (LIGHT / DARK / AUTO) */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--orion-text-muted)]">
          Appearance Mode
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {modes.map(mode => {
            const isSelected = preferences.appearanceMode === mode.key;
            return (
              <button
                key={mode.key}
                type="button"
                onClick={() => setPreference('appearanceMode', mode.key)}
                className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                  isSelected 
                    ? 'border-[var(--orion-accent)] bg-[var(--orion-surface-hover)] ring-2 ring-[var(--orion-accent)]/30' 
                    : 'border-[var(--orion-border)] bg-[var(--orion-surface)] hover:bg-[var(--orion-surface-hover)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-xl ${isSelected ? 'bg-[var(--orion-accent)] text-[var(--os-text-primary-inverse)]' : 'bg-[var(--orion-surface-active)] text-[var(--orion-text-primary)]'}`}>
                      {mode.icon}
                    </div>
                    {isSelected && (
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[var(--orion-accent)] text-[var(--os-text-primary-inverse)]">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-[var(--orion-text-primary)]">{mode.title}</h4>
                  <p className="text-xs text-[var(--orion-text-secondary)] mt-1 leading-relaxed">{mode.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. ACCENT COLOR HIGHLIGHTS */}
      <div className="space-y-4 bg-[var(--orion-surface)] border border-[var(--orion-border)] rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--orion-text-muted)]">
              Accent Highlight Color
            </label>
            <p className="text-xs text-[var(--orion-text-secondary)] mt-1">
              Select a system accent or specify a custom HEX value for buttons, active tabs, and focus rings.
            </p>
          </div>
          {preferences.customAccentEnabled && (
            <button
              type="button"
              onClick={() => setPreference('customAccentEnabled', false)}
              className="text-[11px] font-semibold text-[var(--orion-accent)] hover:underline cursor-pointer"
            >
              Revert to Theme Default ({theme.colors.accent})
            </button>
          )}
        </div>

        {/* Swatch Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {curatedAccents.map(accent => {
            const isSelected = !preferences.customAccentEnabled 
              ? (theme.colors.accent.toLowerCase() === accent.hex.toLowerCase())
              : (preferences.customAccent?.toLowerCase() === accent.hex.toLowerCase());
            return (
              <button
                key={accent.hex}
                type="button"
                onClick={() => {
                  setPreference('customAccentEnabled', true);
                  setPreference('customAccent', accent.hex);
                  setCustomHex(accent.hex);
                }}
                className={`group flex flex-col items-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected 
                    ? 'border-[var(--orion-accent)] bg-[var(--orion-surface-hover)] ring-2 ring-[var(--orion-accent)]/40' 
                    : 'border-[var(--orion-border)] hover:bg-[var(--orion-surface-hover)]'
                }`}
                title={accent.name}
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm border border-white/10"
                  style={{ backgroundColor: accent.hex }}
                >
                  {isSelected && <Check className="w-4 h-4 text-black drop-shadow-sm" />}
                </div>
                <span className="text-[10px] font-medium text-[var(--orion-text-secondary)] mt-1.5 truncate max-w-full">
                  {accent.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom HEX Picker Row */}
        <div className="pt-4 border-t border-[var(--orion-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-[var(--orion-text-primary)]">Custom Accent HEX:</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={resolvedAccent}
                onChange={handleCustomHexChange}
                className="w-8 h-8 rounded-lg cursor-pointer border border-[var(--orion-border)] bg-transparent p-0"
              />
              <input
                type="text"
                value={customHex}
                onChange={handleCustomHexChange}
                placeholder="#D8DDE3"
                className="w-28 px-2.5 py-1 text-xs rounded-lg bg-[var(--orion-surface-hover)] border border-[var(--orion-border)] text-[var(--orion-text-primary)] uppercase font-mono focus:outline-none focus:border-[var(--orion-accent)]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--orion-text-secondary)] bg-[var(--orion-surface-hover)] px-3 py-1.5 rounded-xl border border-[var(--orion-border)]">
            <ShieldCheck className="w-4 h-4 text-[var(--orion-accent)]" />
            <span>Active Operating System Highlight: </span>
            <span 
              className="px-2 py-0.5 rounded font-mono font-bold text-[10px]"
              style={{ backgroundColor: resolvedAccent, color: '#000000' }}
            >
              {resolvedAccent}
            </span>
          </div>
        </div>
      </div>

      {/* 4. WINDOW & GEOMETRY CONTROLS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Corner Radius Preset */}
        <div className="bg-[var(--orion-surface)] border border-[var(--orion-border)] rounded-2xl p-5 space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--orion-text-muted)] flex items-center gap-1.5">
            <AppWindow className="w-4 h-4 text-[var(--orion-accent)]" />
            Corner Geometry
          </label>
          <div className="space-y-2">
            {[
              { key: 'compact', label: 'Compact (4px)', desc: 'High-density sharp enterprise geometry' },
              { key: 'standard', label: 'Standard (10px)', desc: 'Balanced modern operating system corners' },
              { key: 'rounded', label: 'Rounded (18px)', desc: 'Contemporary soft organic radii' },
            ].map(r => (
              <button
                key={r.key}
                type="button"
                onClick={() => setPreference('cornerRadius', r.key as OrionCornerRadius)}
                className={`w-full p-2.5 rounded-xl text-left text-xs font-medium border transition-colors cursor-pointer ${
                  preferences.cornerRadius === r.key
                    ? 'border-[var(--orion-accent)] bg-[var(--orion-surface-hover)] text-[var(--orion-text-primary)]'
                    : 'border-[var(--orion-border)] hover:bg-[var(--orion-surface-hover)] text-[var(--orion-text-secondary)]'
                }`}
              >
                <div className="font-semibold text-[var(--orion-text-primary)]">{r.label}</div>
                <div className="text-[11px] opacity-80 mt-0.5">{r.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Window Chrome Style */}
        <div className="bg-[var(--orion-surface)] border border-[var(--orion-border)] rounded-2xl p-5 space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--orion-text-muted)] flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[var(--orion-accent)]" />
            Window Header Style
          </label>
          <div className="space-y-2">
            {[
              { key: 'standard', label: 'Standard Opaque', desc: 'Crisp high-clarity solid titlebar surface' },
              { key: 'glass', label: 'Glass Translucent', desc: 'Subtle translucent backdrop blur header' },
              { key: 'compact', label: 'Compact Header', desc: 'Reduced height for high-density displays' },
            ].map(w => (
              <button
                key={w.key}
                type="button"
                onClick={() => setPreference('windowStyle', w.key as OrionWindowStyle)}
                className={`w-full p-2.5 rounded-xl text-left text-xs font-medium border transition-colors cursor-pointer ${
                  preferences.windowStyle === w.key
                    ? 'border-[var(--orion-accent)] bg-[var(--orion-surface-hover)] text-[var(--orion-text-primary)]'
                    : 'border-[var(--orion-border)] hover:bg-[var(--orion-surface-hover)] text-[var(--orion-text-secondary)]'
                }`}
              >
                <div className="font-semibold text-[var(--orion-text-primary)]">{w.label}</div>
                <div className="text-[11px] opacity-80 mt-0.5">{w.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Visual Effects & Performance */}
        <div className="bg-[var(--orion-surface)] border border-[var(--orion-border)] rounded-2xl p-5 space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--orion-text-muted)] flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-[var(--orion-accent)]" />
            Effects & Performance
          </label>
          <div className="space-y-3 pt-1">
            <label className="flex items-center justify-between text-xs text-[var(--orion-text-primary)] cursor-pointer">
              <span>Enable Glass Transparency</span>
              <input 
                type="checkbox"
                checked={preferences.transparencyEnabled}
                onChange={(e) => setPreference('transparencyEnabled', e.target.checked)}
                className="w-4 h-4 rounded accent-[var(--orion-accent)]"
              />
            </label>

            {/* Dedicated Global UI Transparency Slider (0-100%) */}
            <div className="pt-2 border-t border-[var(--orion-border)] space-y-1.5">
              <div className="flex justify-between text-[11px] text-[var(--orion-text-secondary)]">
                <span>Global UI Transparency:</span>
                <span className="font-mono font-bold text-[var(--orion-text-primary)]">{preferences.transparencyIntensity}%</span>
              </div>
              <input 
                type="range"
                min="0"
                max="100"
                value={preferences.transparencyIntensity}
                disabled={!preferences.transparencyEnabled}
                onChange={(e) => setPreference('transparencyIntensity', Number(e.target.value))}
                className="w-full accent-[var(--orion-accent)] disabled:opacity-40 cursor-pointer"
                aria-label="Global UI Transparency"
              />
              <div className="flex justify-between text-[10px] text-[var(--orion-text-muted)] font-mono">
                <span>0% (Near-Opaque)</span>
                <span>100% (Maximum Glass)</span>
              </div>
            </div>

            <label className="flex items-center justify-between text-xs text-[var(--orion-text-primary)] cursor-pointer pt-2 border-t border-[var(--orion-border)]">
              <span>Enable Backdrop Blur</span>
              <input 
                type="checkbox"
                checked={preferences.blurEnabled}
                onChange={(e) => setPreference('blurEnabled', e.target.checked)}
                className="w-4 h-4 rounded accent-[var(--orion-accent)]"
              />
            </label>

            <div className="pt-2 border-t border-[var(--orion-border)] space-y-1.5">
              <div className="flex justify-between text-[11px] text-[var(--orion-text-secondary)]">
                <span>Blur Intensity:</span>
                <span className="font-mono">{preferences.blurIntensity}%</span>
              </div>
              <input 
                type="range"
                min="0"
                max="100"
                value={preferences.blurIntensity}
                disabled={!preferences.blurEnabled}
                onChange={(e) => setPreference('blurIntensity', Number(e.target.value))}
                className="w-full accent-[var(--orion-accent)] disabled:opacity-40 cursor-pointer"
                aria-label="Blur Intensity"
              />
            </div>

            <label className="flex items-center justify-between text-xs text-[var(--orion-text-primary)] cursor-pointer pt-2 border-t border-[var(--orion-border)]">
              <span>Reduce System Motion</span>
              <input 
                type="checkbox"
                checked={preferences.reduceMotion}
                onChange={(e) => setPreference('reduceMotion', e.target.checked)}
                className="w-4 h-4 rounded accent-[var(--orion-accent)]"
              />
            </label>
          </div>
        </div>
      </div>

      {/* 4.5 INTERFACE MATERIAL MODE (MORPHIC UI ENGINE) */}
      <div className="bg-[var(--orion-surface)] border border-[var(--orion-border)] rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--orion-text-muted)] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[var(--orion-accent)]" />
              Interface Material System (Morphism Engine)
            </label>
            <p className="text-xs text-[var(--orion-text-secondary)] mt-1">
              Select the global tactile material physics applied across cards, windows, dock, inputs, and interactive surfaces.
            </p>
          </div>
          <span className="text-[11px] font-mono text-[var(--orion-text-secondary)]">
            Active Material: <span className="font-bold text-[var(--orion-text-primary)] capitalize">{preferences.morphismMode || 'glass'}</span>
          </span>
        </div>

        {/* 3 Morphic Modes Cards */}
        <div 
          role="radiogroup" 
          aria-label="Interface Material Mode"
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {/* 1. GLASSMORPHISM */}
          <div
            role="radio"
            aria-checked={(preferences.morphismMode || 'glass') === 'glass'}
            tabIndex={0}
            onClick={() => setPreference('morphismMode', 'glass')}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                setPreference('morphismMode', 'glass');
              }
            }}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative space-y-3 flex flex-col justify-between ${
              (preferences.morphismMode || 'glass') === 'glass'
                ? 'border-[var(--orion-accent)] bg-[var(--orion-surface-hover)] ring-2 ring-[var(--orion-accent)]/30'
                : 'border-[var(--orion-border)] bg-[var(--orion-surface)] hover:border-[var(--orion-border-strong)] hover:bg-[var(--orion-surface-hover)]'
            }`}
          >
            {/* Visual Micro Preview */}
            <div className="p-3 rounded-lg border border-white/10 bg-white/[0.04] backdrop-blur-md shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-white/90 font-semibold">Glassmorphic Layer</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/80 font-mono">blur: 16px</span>
              </div>
              <div className="h-6 rounded bg-white/[0.06] border border-white/10 flex items-center px-2 text-[10px] text-white/70">
                Translucent Surface
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--orion-text-primary)]">Glassmorphism</span>
                {(preferences.morphismMode || 'glass') === 'glass' && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--orion-accent)] text-[var(--os-text-primary-inverse)] font-bold">
                    DEFAULT
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--orion-text-secondary)] leading-relaxed">
                Translucent, layered, backdrop-blurred surfaces with subtle specular border reflections and atmospheric depth.
              </p>
            </div>
          </div>

          {/* 2. CLAYMORPHISM */}
          <div
            role="radio"
            aria-checked={preferences.morphismMode === 'clay'}
            tabIndex={0}
            onClick={() => setPreference('morphismMode', 'clay')}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                setPreference('morphismMode', 'clay');
              }
            }}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative space-y-3 flex flex-col justify-between ${
              preferences.morphismMode === 'clay'
                ? 'border-[var(--orion-accent)] bg-[var(--orion-surface-hover)] ring-2 ring-[var(--orion-accent)]/30'
                : 'border-[var(--orion-border)] bg-[var(--orion-surface)] hover:border-[var(--orion-border-strong)] hover:bg-[var(--orion-surface-hover)]'
            }`}
          >
            {/* Visual Micro Preview */}
            <div 
              className="p-3 rounded-xl border space-y-2"
              style={{
                backgroundColor: 'var(--orion-surface-elevated)',
                borderColor: 'rgba(255, 255, 255, 0.12)',
                boxShadow: '0 8px 16px -4px rgba(0,0,0,0.4), inset 1px 1px 2px rgba(255,255,255,0.18)',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-semibold text-[var(--orion-text-primary)]">Tactile Clay</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--orion-accent-soft)] text-[var(--orion-accent)] font-mono">3D depth</span>
              </div>
              <div 
                className="h-6 rounded-lg flex items-center px-2 text-[10px] text-[var(--orion-text-secondary)]"
                style={{
                  backgroundColor: 'var(--orion-surface)',
                  boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.12), 0 3px 6px rgba(0,0,0,0.25)'
                }}
              >
                Physical Floating Card
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--orion-text-primary)]">Claymorphism</span>
                {preferences.morphismMode === 'clay' && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--orion-accent)] text-[var(--os-text-primary-inverse)] font-bold">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--orion-text-secondary)] leading-relaxed">
                Soft, tactile, friendly dimensional surfaces featuring inner rim specular highlights and rounded volumetric drop shadows.
              </p>
            </div>
          </div>

          {/* 3. NEUMORPHISM */}
          <div
            role="radio"
            aria-checked={preferences.morphismMode === 'neumorphic'}
            tabIndex={0}
            onClick={() => setPreference('morphismMode', 'neumorphic')}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                setPreference('morphismMode', 'neumorphic');
              }
            }}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative space-y-3 flex flex-col justify-between ${
              preferences.morphismMode === 'neumorphic'
                ? 'border-[var(--orion-accent)] bg-[var(--orion-surface-hover)] ring-2 ring-[var(--orion-accent)]/30'
                : 'border-[var(--orion-border)] bg-[var(--orion-surface)] hover:border-[var(--orion-border-strong)] hover:bg-[var(--orion-surface-hover)]'
            }`}
          >
            {/* Visual Micro Preview */}
            <div 
              className="p-3 rounded-xl border border-transparent space-y-2"
              style={{
                backgroundColor: 'var(--orion-surface)',
                boxShadow: '-3px -3px 8px rgba(255,255,255,0.06), 4px 4px 10px rgba(0,0,0,0.5)',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-semibold text-[var(--orion-text-primary)]">Extruded Surface</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-[var(--orion-text-muted)] font-mono">embossed</span>
              </div>
              <div 
                className="h-6 rounded-lg flex items-center px-2 text-[10px] text-[var(--orion-text-muted)]"
                style={{
                  backgroundColor: 'var(--orion-surface)',
                  boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.5), inset -2px -2px 4px rgba(255,255,255,0.05)'
                }}
              >
                Recessed Input Track
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--orion-text-primary)]">Neumorphism</span>
                {preferences.morphismMode === 'neumorphic' && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--orion-accent)] text-[var(--os-text-primary-inverse)] font-bold">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--orion-text-secondary)] leading-relaxed">
                Seamless monochromatic extrusion from the parent canvas with coupled dual-axis highlights and recessed interactive tracks.
              </p>
            </div>
          </div>
        </div>

        {/* Live Material Controls Preview Strip */}
        <div 
          className="p-4 rounded-xl border transition-all space-y-3"
          style={{
            backgroundColor: 'var(--orion-morph-surface)',
            borderColor: 'var(--orion-morph-border)',
            boxShadow: 'var(--orion-morph-shadow-soft)',
            backdropFilter: 'blur(var(--orion-morph-blur))',
            WebkitBackdropFilter: 'blur(var(--orion-morph-blur))',
          }}
        >
          <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--orion-morph-border)' }}>
            <span className="text-xs font-semibold text-[var(--orion-text-primary)] flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-[var(--orion-accent)]" />
              Live Interactive Primitives Preview ({preferences.morphismMode?.toUpperCase() || 'GLASS'})
            </span>
            <span className="text-[10px] font-mono text-[var(--orion-text-muted)]">
              Real-time CSS Custom Properties
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Preview Button */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-mono text-[var(--orion-text-muted)]">Interactive Button</span>
              <button
                type="button"
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-[var(--os-text-primary-inverse)] transition-all cursor-pointer active:scale-95"
                style={{
                  backgroundColor: 'var(--orion-accent)',
                  boxShadow: 'var(--orion-morph-shadow)',
                }}
              >
                Execute Pipeline
              </button>
            </div>

            {/* Preview Input */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-mono text-[var(--orion-text-muted)]">Recessed Input</span>
              <input
                type="text"
                readOnly
                value="SKU-8492-INVENTORY"
                className="w-full py-1.5 px-3 rounded-lg text-xs font-mono text-[var(--orion-text-primary)] border outline-none"
                style={{
                  backgroundColor: 'var(--orion-morph-surface-subtle)',
                  borderColor: 'var(--orion-morph-border)',
                  boxShadow: 'var(--orion-morph-shadow-inset)',
                }}
              />
            </div>

            {/* Preview Elevated Card */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-mono text-[var(--orion-text-muted)]">Elevated Card</span>
              <div 
                className="w-full py-1.5 px-3 rounded-lg text-xs font-medium text-[var(--orion-text-primary)] flex items-center justify-between border"
                style={{
                  backgroundColor: 'var(--orion-morph-surface-elevated)',
                  borderColor: 'var(--orion-morph-border-strong)',
                  boxShadow: 'var(--orion-morph-shadow-soft)',
                }}
              >
                <span>Stock Fill Rate</span>
                <span className="font-bold text-[#5FAF8A]">99.2%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. INTERACTIVE LIVE WINDOW PREVIEW BOX */}
      <div className="bg-[var(--orion-surface)] border border-[var(--orion-border)] rounded-2xl p-5 sm:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--orion-text-muted)] flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-[var(--orion-accent)]" />
            Live Operating System Window Preview
          </label>
          <span className="text-[11px] text-[var(--orion-text-secondary)] font-mono">
            Active Theme: <span className="text-[var(--orion-text-primary)] font-bold">{theme.name}</span> ({isDark ? 'Dark' : 'Light'})
          </span>
        </div>

        {/* Mock Window Container */}
        <div 
          className="border shadow-lg overflow-hidden transition-all"
          style={{
            backgroundColor: 'var(--orion-surface)',
            borderColor: 'var(--orion-border)',
            borderRadius: 'var(--orion-radius)'
          }}
        >
          {/* Title Bar */}
          <div 
            className="px-4 py-2.5 flex items-center justify-between border-b"
            style={{
              backgroundColor: 'var(--orion-surface-elevated)',
              borderColor: 'var(--orion-border)'
            }}
          >
            {preferences.windowControlPosition === 'right' ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[var(--orion-text-primary)]">
                    Supply Chain Control Tower — Live Preview
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--orion-surface)] text-[var(--orion-text-secondary)] border border-[var(--orion-border)]">
                    {theme.id.toUpperCase()} • {preferences.cornerRadius.toUpperCase()} • {preferences.morphismMode?.toUpperCase() || 'GLASS'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <OrionWindowControls
                    appName="Live Preview"
                    position="right"
                    onClose={() => showToast('Close clicked in preview', 'info')}
                    onMinimize={() => showToast('Minimize clicked in preview', 'info')}
                    onMaximize={() => showToast('Maximize clicked in preview', 'info')}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <OrionWindowControls
                    appName="Live Preview"
                    position="left"
                    onClose={() => showToast('Close clicked in preview', 'info')}
                    onMinimize={() => showToast('Minimize clicked in preview', 'info')}
                    onMaximize={() => showToast('Maximize clicked in preview', 'info')}
                  />
                  <span className="text-xs font-semibold text-[var(--orion-text-primary)]">
                    Supply Chain Control Tower — Live Preview
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--orion-surface)] text-[var(--orion-text-secondary)] border border-[var(--orion-border)]">
                  {theme.id.toUpperCase()} • {preferences.cornerRadius.toUpperCase()} • {preferences.morphismMode?.toUpperCase() || 'GLASS'}
                </span>
              </>
            )}
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
                    color: 'var(--os-text-primary-inverse)'
                  }}
                >
                  Primary Action
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                  style={{
                    backgroundColor: 'var(--orion-surface-hover)',
                    borderColor: 'var(--orion-border)',
                    color: 'var(--orion-text-primary)'
                  }}
                >
                  Secondary Action
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span 
                  className="px-2.5 py-1 rounded-full text-[11px] font-bold"
                  style={{
                    backgroundColor: 'var(--orion-accent-soft)',
                    color: 'var(--orion-accent)'
                  }}
                >
                  Active Accent Highlight
                </span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#5FAF8A]/10 text-[#5FAF8A] border border-[#5FAF8A]/20">
                  Operational Nominal
                </span>
              </div>
            </div>

            {/* Mock Telemetry Data Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div 
                className="p-3.5 rounded-xl border flex items-center justify-between"
                style={{
                  backgroundColor: 'var(--orion-surface-elevated)',
                  borderColor: 'var(--orion-border)'
                }}
              >
                <div className="space-y-1">
                  <div className="text-xs font-bold text-[var(--orion-text-primary)]">
                    SKU-4902 In-Transit Inventory
                  </div>
                  <div className="text-[11px] text-[var(--orion-text-secondary)]">
                    Stock Level: 14,200 units • Target: 12,000 units
                  </div>
                </div>
                <div className="w-16 h-2 rounded-full overflow-hidden bg-[var(--orion-surface-hover)]">
                  <div className="h-full w-3/4" style={{ backgroundColor: 'var(--orion-chart-1)' }} />
                </div>
              </div>

              <div 
                className="p-3.5 rounded-xl border flex items-center justify-between"
                style={{
                  backgroundColor: 'var(--orion-surface-elevated)',
                  borderColor: 'var(--orion-border)'
                }}
              >
                <div className="space-y-1">
                  <div className="text-xs font-bold text-[var(--orion-text-primary)]">
                    Supplier Fulfillment SLA
                  </div>
                  <div className="text-[11px] text-[var(--orion-text-secondary)]">
                    Global Network On-Time: 98.4%
                  </div>
                </div>
                <div className="w-16 h-2 rounded-full overflow-hidden bg-[var(--orion-surface-hover)]">
                  <div className="h-full w-5/6" style={{ backgroundColor: 'var(--orion-chart-2)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
