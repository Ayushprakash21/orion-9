import React, { useMemo, useState } from 'react';
import { ORION_ICON_REGISTRY, validateIconRegistryUniqueness } from './OrionIconRegistry';
import { ORION_REGISTRY } from '../OrionApplicationRegistry';
import { OrionAppIcon } from '../../components/brand/OrionAppIcon';
import { Search, Sun, Moon, Layers, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const PREVIEW_SIZES = [16, 24, 40, 64] as const;

export const OrionIconGallery: React.FC = () => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [surfaceTheme, setSurfaceTheme] = useState<'dark' | 'light'>('dark');
  const [selectedDemo, setSelectedDemo] = useState<string>('command-center');
  const [showBadges, setShowBadges] = useState<boolean>(false);

  const registryEntries = useMemo(() => Object.values(ORION_ICON_REGISTRY), []);
  const validation = useMemo(() => validateIconRegistryUniqueness(), []);
  const totalAppCount = useMemo(() => Object.keys(ORION_REGISTRY).length, []);

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
        entry.category.toLowerCase().includes(q)
      );
    });
  }, [registryEntries, categoryFilter, search]);

  return (
    <div
      data-testid="orion-icon-gallery"
      className={cn(
        'w-full h-full overflow-y-auto p-6 space-y-6 transition-colors',
        surfaceTheme === 'dark' ? 'bg-[#0B0E14] text-white' : 'bg-[#F3F5F8] text-slate-900'
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'rounded-2xl border p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4',
          surfaceTheme === 'dark'
            ? 'bg-white/[0.03] border-white/[0.08]'
            : 'bg-white border-slate-200 shadow-sm'
        )}
      >
        <div>
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-sky-400" />
            <h1 className="text-lg font-bold tracking-tight">Orion-9 macOS Icon System Gallery</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3" />
              {registryEntries.length}/{totalAppCount} Icons • {validation.is100PercentUnique ? '100% Unique' : 'Duplicates'}
            </span>
          </div>
          <p className={cn('text-xs mt-1', surfaceTheme === 'dark' ? 'text-slate-400' : 'text-slate-600')}>
            Vector squircle design system with unique per-instance SVG IDs, zero SVG Gaussian drop-shadow filter churn, and multi-size legibility.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter icons..."
              className={cn(
                'pl-8 pr-3 py-1.5 rounded-xl text-xs border outline-none transition-colors w-48',
                surfaceTheme === 'dark'
                  ? 'bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-500 focus:border-sky-400'
                  : 'bg-slate-100 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-sky-600'
              )}
            />
          </div>

          <button
            type="button"
            onClick={() => setSurfaceTheme(prev => (prev === 'dark' ? 'light' : 'dark'))}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer',
              surfaceTheme === 'dark'
                ? 'bg-white/[0.06] border-white/[0.12] hover:bg-white/[0.12]'
                : 'bg-white border-slate-300 hover:bg-slate-100'
            )}
          >
            {surfaceTheme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
            <span>{surfaceTheme === 'dark' ? 'Dark Surface' : 'Light Surface'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowBadges(prev => !prev)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer',
              showBadges
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                : surfaceTheme === 'dark'
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
                ? 'bg-sky-500/20 border-sky-400/50 text-sky-300'
                : surfaceTheme === 'dark'
                  ? 'bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Multi-size Spotlight Specimen */}
      {ORION_ICON_REGISTRY[selectedDemo] && (
        <div
          className={cn(
            'rounded-2xl border p-4 flex flex-wrap items-center justify-between gap-4',
            surfaceTheme === 'dark'
              ? 'bg-white/[0.03] border-white/[0.08]'
              : 'bg-white border-slate-200 shadow-sm'
          )}
        >
          <div className="flex items-center gap-4">
            <OrionAppIcon
              app={selectedDemo}
              size={64}
              theme={surfaceTheme}
              active={true}
              notificationCount={showBadges ? 3 : 0}
            />
            <div>
              <div className="text-sm font-bold">{ORION_ICON_REGISTRY[selectedDemo].name}</div>
              <div className={cn('text-xs font-mono', surfaceTheme === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                {selectedDemo} • {ORION_ICON_REGISTRY[selectedDemo].category}
              </div>
              <div className={cn('text-xs mt-1 max-w-md', surfaceTheme === 'dark' ? 'text-slate-300' : 'text-slate-600')}>
                {ORION_ICON_REGISTRY[selectedDemo].description}
              </div>
            </div>
          </div>

          <div className="flex items-end gap-5">
            {PREVIEW_SIZES.map(sz => (
              <div key={sz} className="flex flex-col items-center gap-1.5">
                <OrionAppIcon app={selectedDemo} size={sz} theme={surfaceTheme} notificationCount={showBadges && sz >= 24 ? 2 : 0} />
                <span className="text-[10px] font-mono opacity-60">{sz}px</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filteredIcons.map(entry => {
          const isSelected = selectedDemo === entry.appId;
          return (
            <button
              key={entry.appId}
              type="button"
              data-testid={`icon-gallery-item-${entry.appId}`}
              onClick={() => setSelectedDemo(entry.appId)}
              className={cn(
                'p-3.5 rounded-2xl border flex flex-col items-center text-center gap-2.5 transition-all cursor-pointer',
                isSelected
                  ? 'border-sky-400 bg-sky-500/10 ring-1 ring-sky-400/50'
                  : surfaceTheme === 'dark'
                    ? 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/[0.16]'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
              )}
            >
              <OrionAppIcon
                app={entry.appId}
                size={48}
                theme={surfaceTheme}
                selected={isSelected}
                active={isSelected}
                notificationCount={showBadges ? 1 : 0}
              />
              <div className="w-full min-w-0">
                <div className="text-xs font-semibold truncate">{entry.name}</div>
                <div className={cn('text-[10px] font-mono truncate mt-0.5', surfaceTheme === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                  {entry.category}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default OrionIconGallery;
