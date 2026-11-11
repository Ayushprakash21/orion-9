import React, { useMemo, useState } from 'react';
import {
  ORION_ICON_REGISTRY,
  ORION_ICON_ALIASES,
  getIconCoverageReport,
} from './OrionIconRegistry';
import { OrionAppIcon } from '../../components/brand/OrionAppIcon';
import { useOrionTheme } from '../theme/useOrionTheme';
import { Search, Sun, Moon, Layers, AlertTriangle, CheckCircle2, Columns2 } from 'lucide-react';
import { cn } from '../../lib/utils';

type GallerySurfaceMode = 'split' | 'dark' | 'light';

export const OrionIconGallery: React.FC = () => {
  const { isDark } = useOrionTheme();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [surfaceMode, setSurfaceMode] = useState<GallerySurfaceMode>(() =>
    isDark ? 'split' : 'light'
  );
  const [selectedDemo, setSelectedDemo] = useState<string>('command-center');
  const [showBadges, setShowBadges] = useState<boolean>(false);

  const registryEntries = useMemo(() => Object.values(ORION_ICON_REGISTRY), []);
  const coverage = useMemo(() => getIconCoverageReport(), []);

  const categories = useMemo(() => {
    const set = new Set<string>(['ALL']);
    registryEntries.forEach(entry => set.add(entry.category));
    return Array.from(set);
  }, [registryEntries]);

  const filteredIcons = useMemo(() => {
    const q = search.trim().toLowerCase();
    return registryEntries.filter(entry => {
      if (categoryFilter !== 'ALL' && entry.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        entry.name.toLowerCase().includes(q) ||
        entry.appId.toLowerCase().includes(q) ||
        entry.category.toLowerCase().includes(q) ||
        entry.iconId.toLowerCase().includes(q)
      );
    });
  }, [registryEntries, categoryFilter, search]);

  const activeDef = ORION_ICON_REGISTRY[selectedDemo] || registryEntries[0];
  const mappedAliasesForSelected = useMemo(
    () =>
      Object.entries(ORION_ICON_ALIASES)
        .filter(([, target]) => target === activeDef?.appId)
        .map(([alias]) => alias),
    [activeDef]
  );

  const effectiveShellDark = surfaceMode === 'dark' || (surfaceMode === 'split' && isDark);

  return (
    <div
      data-testid="orion-icon-gallery"
      className={cn(
        'w-full h-full overflow-y-auto p-6 space-y-5 transition-colors',
        effectiveShellDark ? 'bg-[#0B0E14] text-white' : 'bg-[#F5F6F8] text-slate-900'
      )}
    >
      {/* Header & Coverage Diagnostics */}
      <div
        className={cn(
          'rounded-2xl border p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4',
          effectiveShellDark
            ? 'bg-white/[0.03] border-white/[0.08]'
            : 'bg-white border-slate-200 shadow-sm'
        )}
      >
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-lg font-bold tracking-tight">Orion-9 Icon System Workbench</h1>
            <span
              data-testid="icon-gallery-coverage-badge"
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold border',
                coverage.missingFromIconRegistry.length === 0
                  ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-500 border-amber-500/30'
              )}
            >
              <CheckCircle2 className="w-3 h-3" />
              {coverage.coveredCount}/{coverage.totalAppRegistryCount} Registry Mapped •{' '}
              {coverage.aliasCount} Aliases
            </span>

            {coverage.unresolvedFallbackHits.length > 0 ? (
              <span
                data-testid="icon-gallery-fallback-warning"
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-rose-500/15 text-rose-500 border border-rose-500/30"
              >
                <AlertTriangle className="w-3 h-3" />
                {coverage.unresolvedFallbackHits.length} Fallback Hit(s):{' '}
                {coverage.unresolvedFallbackHits.slice(0, 3).join(', ')}
              </span>
            ) : (
              <span
                data-testid="icon-gallery-zero-fallbacks"
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono border',
                  effectiveShellDark
                    ? 'bg-white/[0.04] border-white/10 text-slate-300'
                    : 'bg-slate-100 border-slate-200 text-slate-600'
                )}
              >
                0 Unresolved Fallbacks
              </span>
            )}
          </div>
          <p className={cn('text-xs', effectiveShellDark ? 'text-slate-400' : 'text-slate-600')}>
            Visual QC inspector for all {registryEntries.length} Orion OS 128×128 artwork tiles at Dock (40px), Standard (48px), Spotlight (80px), and Dark/Light surfaces.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search apps, IDs, categories..."
              aria-label="Filter icons"
              className={cn(
                'pl-8 pr-3 py-1.5 rounded-xl text-xs border outline-none transition-colors w-52',
                effectiveShellDark
                  ? 'bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-500 focus:border-sky-400'
                  : 'bg-slate-100 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-sky-600'
              )}
            />
          </div>

          <div
            className={cn(
              'inline-flex rounded-xl p-0.5 border text-xs',
              effectiveShellDark ? 'bg-white/[0.04] border-white/[0.1]' : 'bg-slate-100 border-slate-300'
            )}
            role="group"
            aria-label="Gallery Surface Mode"
          >
            <button
              type="button"
              onClick={() => setSurfaceMode('split')}
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors',
                surfaceMode === 'split'
                  ? 'bg-sky-500 text-white'
                  : effectiveShellDark
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-700 hover:text-slate-900'
              )}
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span>Dark + Light</span>
            </button>
            <button
              type="button"
              onClick={() => setSurfaceMode('dark')}
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors',
                surfaceMode === 'dark'
                  ? 'bg-slate-800 text-white'
                  : effectiveShellDark
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-700 hover:text-slate-900'
              )}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Dark</span>
            </button>
            <button
              type="button"
              onClick={() => setSurfaceMode('light')}
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors',
                surfaceMode === 'light'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : effectiveShellDark
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-700 hover:text-slate-900'
              )}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Light</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowBadges(prev => !prev)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer',
              showBadges
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                : effectiveShellDark
                  ? 'bg-white/[0.06] border-white/[0.12] hover:bg-white/[0.12]'
                  : 'bg-white border-slate-300 hover:bg-slate-100'
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{showBadges ? 'Badges On' : 'Preview Badges'}</span>
          </button>
        </div>
      </div>

      {/* Category Filter Strip */}
      <div className="flex flex-wrap items-center gap-1.5">
        {categories.map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border',
              categoryFilter === cat
                ? 'bg-sky-500 text-white border-sky-400'
                : effectiveShellDark
                  ? 'bg-white/[0.03] border-white/[0.08] text-slate-300 hover:text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900'
            )}
          >
            {cat}
          </button>
        ))}
        <span className="ml-auto text-xs font-mono opacity-70">
          Showing {filteredIcons.length} / {registryEntries.length}
        </span>
      </div>

      {/* Detailed Specimen Inspector: Dock (40px), 48px, 80px across Dark & Light Backdrops */}
      {activeDef && (
        <div
          data-testid="icon-gallery-specimen-inspector"
          className={cn(
            'rounded-2xl border p-5 grid grid-cols-1 xl:grid-cols-12 gap-5 items-center',
            effectiveShellDark
              ? 'bg-white/[0.03] border-white/[0.08]'
              : 'bg-white border-slate-200 shadow-sm'
          )}
        >
          <div className="xl:col-span-5 space-y-2">
            <div className="text-base font-bold">{activeDef.name}</div>
            <div className={cn('text-xs font-mono', effectiveShellDark ? 'text-slate-400' : 'text-slate-500')}>
              appId: <span className="font-semibold">{activeDef.appId}</span> • iconId: {activeDef.iconId} • {activeDef.category}
            </div>
            <p className={cn('text-xs leading-relaxed', effectiveShellDark ? 'text-slate-300' : 'text-slate-600')}>
              {activeDef.description}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-current/15">
                <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: activeDef.palette.from }} />
                From: {activeDef.palette.from}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-current/15">
                <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: activeDef.palette.to }} />
                To: {activeDef.palette.to}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-current/15">
                <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: activeDef.palette.accent }} />
                Accent: {activeDef.palette.accent}
              </span>
              {mappedAliasesForSelected.length > 0 && (
                <span className="opacity-75">
                  Aliases: {mappedAliasesForSelected.join(', ')}
                </span>
              )}
            </div>
          </div>

          <div className="xl:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Dark Surface Preview */}
            <div className="rounded-xl bg-[#0F131A] text-white border border-white/10 p-3.5 flex items-end justify-around">
              <div className="flex flex-col items-center gap-1">
                <OrionAppIcon app={activeDef.appId} size={40} theme="dark" active notificationCount={showBadges ? 2 : 0} />
                <span className="text-[10px] font-mono text-slate-400">Dock 40px</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <OrionAppIcon app={activeDef.appId} size={48} theme="dark" notificationCount={showBadges ? 5 : 0} />
                <span className="text-[10px] font-mono text-slate-400">48px Dark</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <OrionAppIcon app={activeDef.appId} size={80} theme="dark" />
                <span className="text-[10px] font-mono text-slate-400">80px Dark</span>
              </div>
            </div>

            {/* Light Surface Preview */}
            <div className="rounded-xl bg-[#F5F5F3] text-slate-900 border border-slate-300 p-3.5 flex items-end justify-around">
              <div className="flex flex-col items-center gap-1">
                <OrionAppIcon app={activeDef.appId} size={40} theme="light" active notificationCount={showBadges ? 2 : 0} />
                <span className="text-[10px] font-mono text-slate-600">Dock 40px</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <OrionAppIcon app={activeDef.appId} size={48} theme="light" notificationCount={showBadges ? 5 : 0} />
                <span className="text-[10px] font-mono text-slate-600">48px Light</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <OrionAppIcon app={activeDef.appId} size={80} theme="light" />
                <span className="text-[10px] font-mono text-slate-600">80px Light</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {filteredIcons.map(entry => {
          const isSelected = selectedDemo === entry.appId;
          return (
            <button
              key={entry.appId}
              type="button"
              data-testid={`icon-gallery-item-${entry.appId}`}
              onClick={() => setSelectedDemo(entry.appId)}
              className={cn(
                'p-3.5 rounded-2xl border flex flex-col gap-3 text-left transition-all cursor-pointer',
                isSelected
                  ? 'border-sky-400 bg-sky-500/10 ring-1 ring-sky-400/50'
                  : effectiveShellDark
                    ? 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/[0.16]'
                    : 'border-slate-200 bg-white hover:bg-slate-50 shadow-2xs'
              )}
            >
              <div className="flex items-center justify-between gap-2 w-full">
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">{entry.name}</div>
                  <div className={cn('text-[10px] font-mono truncate', effectiveShellDark ? 'text-slate-400' : 'text-slate-500')}>
                    {entry.appId} • {entry.category}
                  </div>
                </div>
                <OrionAppIcon
                  app={entry.appId}
                  size={20}
                  theme={surfaceMode === 'light' ? 'light' : 'dark'}
                  showContainer={false}
                />
              </div>

              {surfaceMode === 'split' ? (
                <div className="grid grid-cols-2 gap-2 w-full">
                  <div className="rounded-xl bg-[#0F131A] border border-white/10 p-2.5 flex items-end justify-around">
                    <OrionAppIcon app={entry.appId} size={40} theme="dark" />
                    <OrionAppIcon
                      app={entry.appId}
                      size={48}
                      theme="dark"
                      selected={isSelected}
                      notificationCount={showBadges ? 1 : 0}
                    />
                  </div>
                  <div className="rounded-xl bg-[#F5F5F3] border border-slate-200 p-2.5 flex items-end justify-around">
                    <OrionAppIcon app={entry.appId} size={40} theme="light" />
                    <OrionAppIcon
                      app={entry.appId}
                      size={48}
                      theme="light"
                      selected={isSelected}
                      notificationCount={showBadges ? 1 : 0}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-end justify-around py-1 w-full">
                  <OrionAppIcon app={entry.appId} size={40} theme={surfaceMode} />
                  <OrionAppIcon
                    app={entry.appId}
                    size={48}
                    theme={surfaceMode}
                    selected={isSelected}
                    notificationCount={showBadges ? 1 : 0}
                  />
                  <OrionAppIcon app={entry.appId} size={80} theme={surfaceMode} active={isSelected} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default OrionIconGallery;
