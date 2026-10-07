import React, { useState } from 'react';
import { 
  Sun, Moon, Laptop, Eye, Sparkles, Check, RefreshCw, Palette, 
  Layers, ShieldCheck, Download, Upload, Sliders, Monitor, AppWindow
} from 'lucide-react';
import { useOrionTheme } from '../../os/theme/useOrionTheme';
import { ORION_THEMES, getThemeList } from '../../os/theme/OrionThemeRegistry';
import { OrionThemeId, OrionAppearanceMode, OrionCornerRadius, OrionWindowStyle } from '../../os/theme/OrionThemeTypes';
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
    <div className="w-full space-y-8 select-none">
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

            <label className="flex items-center justify-between text-xs text-[var(--orion-text-primary)] cursor-pointer">
              <span>Enable Backdrop Blur</span>
              <input 
                type="checkbox"
                checked={preferences.blurEnabled}
                onChange={(e) => setPreference('blurEnabled', e.target.checked)}
                className="w-4 h-4 rounded accent-[var(--orion-accent)]"
              />
            </label>

            <label className="flex items-center justify-between text-xs text-[var(--orion-text-primary)] cursor-pointer">
              <span>Reduce System Motion</span>
              <input 
                type="checkbox"
                checked={preferences.reduceMotion}
                onChange={(e) => setPreference('reduceMotion', e.target.checked)}
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
                onChange={(e) => setPreference('blurIntensity', Number(e.target.value))}
                className="w-full accent-[var(--orion-accent)]"
              />
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
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C96B72] inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#C6A15B] inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#5FAF8A] inline-block" />
              </div>
              <span className="text-xs font-semibold text-[var(--orion-text-primary)] ml-2">
                Supply Chain Control Tower — Live Preview
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--orion-surface)] text-[var(--orion-text-secondary)] border border-[var(--orion-border)]">
              {theme.id.toUpperCase()} • {preferences.cornerRadius.toUpperCase()}
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
