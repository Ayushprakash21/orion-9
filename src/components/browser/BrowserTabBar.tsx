import React from 'react';
import { Plus, X, Globe, Loader2 } from 'lucide-react';
import { BrowserTab } from './BrowserTypes';
import { cn } from '../../lib/utils';

export interface BrowserTabBarProps {
  tabs: BrowserTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string, e?: React.MouseEvent) => void;
  onNewTab: () => void;
}

export const BrowserTabBar: React.FC<BrowserTabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
}) => {
  return (
    <div 
      className="flex items-center gap-1 px-2 pt-2 pb-0 bg-os-surface border-b border-os-border select-none overflow-x-auto custom-scrollbar"
      role="tablist"
      aria-label="Orion Browser tabs"
      data-testid="browser-tab-bar"
    >
      <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto custom-scrollbar">
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              role="tab"
              data-testid={`browser-tab-${tab.id}`}
              data-tab-index={index}
              aria-selected={isActive}
              tabIndex={0}
              onClick={() => onSelectTab(tab.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectTab(tab.id);
                }
              }}
              onAuxClick={(e) => {
                if (e.button === 1) { // Middle click closes tab
                  e.preventDefault();
                  onCloseTab(tab.id, e);
                }
              }}
              className={cn(
                "group relative flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs font-medium max-w-[200px] min-w-[120px] cursor-pointer transition-all border-t border-x",
                isActive
                  ? "bg-os-bg text-os-text-primary border-os-border shadow-xs z-10 -mb-[1px] pb-2"
                  : "bg-os-surface-hover/40 hover:bg-os-surface-hover text-os-text-muted hover:text-os-text-secondary border-transparent"
              )}
              title={`${tab.title} (${tab.url})`}
            >
              {/* Tab Icon / Spinner */}
              <div className="shrink-0">
                {tab.loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-os-accent" />
                ) : tab.favicon ? (
                  <img src={tab.favicon} alt="" className="w-3.5 h-3.5 rounded-xs" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                ) : (
                  <Globe className="w-3.5 h-3.5 text-os-text-muted" />
                )}
              </div>

              {/* Tab Title */}
              <span className="truncate flex-1 text-left">
                {tab.title || 'New Tab'}
              </span>

              {/* Close Button */}
              <button
                type="button"
                data-testid={`browser-close-tab-${tab.id}`}
                aria-label={`Close ${tab.title} tab`}
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id, e);
                }}
                className={cn(
                  "p-0.5 rounded-sm hover:bg-os-surface-active text-os-text-muted hover:text-os-text-primary transition-colors opacity-70 group-hover:opacity-100",
                  tabs.length === 1 && "opacity-40 hover:opacity-100"
                )}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* New Tab Button */}
      <button
        type="button"
        data-testid="browser-new-tab-btn"
        aria-label="New tab (Ctrl+T)"
        onClick={onNewTab}
        className="p-1.5 rounded-lg hover:bg-os-surface-hover text-os-text-muted hover:text-os-text-primary transition-colors cursor-pointer shrink-0 ml-1"
        title="New tab (Ctrl+T)"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};
