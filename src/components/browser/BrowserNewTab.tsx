import React, { useState } from 'react';
import { 
  Globe2, Search, LayoutDashboard, FileText, 
  Sparkles, Settings, Clock, ArrowUpRight, Trash2,
  Compass
} from 'lucide-react';
import { BrowserHistoryEntry } from './BrowserTypes';
import { cn } from '../../lib/utils';

export interface BrowserNewTabProps {
  onNavigate: (url: string) => void;
  recentHistory: BrowserHistoryEntry[];
  onRemoveHistoryItem?: (id: string) => void;
}

export const BrowserNewTab: React.FC<BrowserNewTabProps> = ({
  onNavigate,
  recentHistory,
  onRemoveHistoryItem,
}) => {
  const [searchInput, setSearchInput] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onNavigate(searchInput.trim());
    }
  };

  const quickAccessItems = [
    {
      title: 'Mission Control',
      subtitle: 'Executive KPIs',
      url: '/executive',
      icon: LayoutDashboard,
      color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      title: 'Control Tower',
      subtitle: 'Operations Map',
      url: '/',
      icon: Compass,
      color: 'from-blue-500/20 to-cyan-500/10 text-blue-400 border-blue-500/20',
    },
    {
      title: 'Orion Files',
      subtitle: 'Virtual Storage',
      url: '/files',
      icon: FileText,
      color: 'from-sky-500/20 to-blue-500/10 text-sky-400 border-sky-500/20',
    },
    {
      title: 'AI Copilot',
      subtitle: 'Cognitive Assistant',
      url: '/ai-copilot',
      icon: Sparkles,
      color: 'from-purple-500/20 to-indigo-500/10 text-purple-400 border-purple-500/20',
    },
    {
      title: 'Settings',
      subtitle: 'Preferences & Themes',
      url: '/settings',
      icon: Settings,
      color: 'from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/20',
    },
    {
      title: 'Wikipedia',
      subtitle: 'Open Knowledge',
      url: 'https://en.wikipedia.org',
      icon: Globe2,
      color: 'from-slate-500/20 to-zinc-500/10 text-zinc-300 border-zinc-500/20',
    },
  ];

  return (
    <div className="flex-1 h-full overflow-y-auto bg-gradient-to-b from-os-bg via-os-bg to-os-surface/40 p-6 flex flex-col items-center custom-scrollbar select-none">
      <div className="w-full max-w-3xl flex flex-col items-center mt-8 mb-10">
        {/* Orion Browser Logo & Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Globe2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-os-text-primary">
            Orion Browser
          </h1>
        </div>
        <p className="text-xs text-os-text-muted mb-8 text-center max-w-md">
          Explore the web, enterprise workspaces, and live operational registries inside Orion OS.
        </p>

        {/* Central Omnibox Search Bar */}
        <form onSubmit={handleSearchSubmit} className="w-full max-w-xl relative">
          <div className="relative flex items-center w-full bg-os-surface border border-os-border focus-within:border-os-accent rounded-2xl shadow-xl transition-all overflow-hidden p-1.5">
            <Search className="w-5 h-5 text-os-text-muted ml-3 shrink-0" />
            <input
              type="text"
              data-testid="browser-newtab-search"
              aria-label="Search the web or enter URL"
              value={searchInput}
              placeholder="Search with DuckDuckGo or enter web address..."
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1 bg-transparent px-3 py-2 text-sm text-os-text-primary placeholder:text-os-text-muted focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-os-accent hover:opacity-90 text-os-bg text-xs font-medium transition-all cursor-pointer shrink-0"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Quick Access Section */}
      <div className="w-full max-w-3xl mb-10">
        <h2 className="text-xs font-semibold text-os-text-muted uppercase tracking-wider mb-3 px-1">
          Quick Access
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {quickAccessItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                type="button"
                onClick={() => onNavigate(item.url)}
                className="group flex items-center gap-3 p-3 rounded-xl bg-os-surface border border-os-border hover:border-os-border-strong hover:bg-os-surface-hover transition-all text-left cursor-pointer shadow-xs"
              >
                <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center border shrink-0 transition-transform group-hover:scale-105", item.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium text-os-text-primary truncate">{item.title}</span>
                    <ArrowUpRight className="w-3 h-3 text-os-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                  <span className="text-[11px] text-os-text-muted truncate block">{item.subtitle}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recently Visited History Section */}
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-semibold text-os-text-muted uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Recently Visited
          </h2>
        </div>

        {recentHistory.length === 0 ? (
          <div className="p-6 rounded-xl bg-os-surface border border-os-border/50 text-center text-xs text-os-text-muted">
            No browsing history recorded yet. Enter a web address or search above to begin.
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 bg-os-surface border border-os-border rounded-xl p-2 shadow-xs">
            {recentHistory.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-os-surface-hover transition-colors text-left"
              >
                <button
                  type="button"
                  onClick={() => onNavigate(entry.url)}
                  className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer text-left"
                >
                  <Globe2 className="w-3.5 h-3.5 text-os-text-muted shrink-0" />
                  <span className="text-xs font-medium text-os-text-primary truncate">
                    {entry.title || entry.url}
                  </span>
                  <span className="text-[11px] text-os-text-muted truncate hidden sm:inline">
                    {entry.url}
                  </span>
                </button>

                {onRemoveHistoryItem && (
                  <button
                    type="button"
                    aria-label="Remove from history"
                    onClick={() => onRemoveHistoryItem(entry.id)}
                    className="p-1 rounded-md text-os-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
