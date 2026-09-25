import React from 'react';
import { cn } from '../../lib/utils';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
}

export interface OrionTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'pills' | 'underline' | 'glass';
  size?: 'sm' | 'md';
  className?: string;
}

export const OrionTabs: React.FC<OrionTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'pills',
  size = 'md',
  className,
}) => {
  if (variant === 'underline') {
    return (
      <div className={cn('flex items-center gap-1 border-b border-os-border text-xs sm:text-sm font-medium select-none', className)}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              disabled={tab.disabled}
              onClick={() => !tab.disabled && onChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2.5 border-b-2 transition-all cursor-pointer font-medium',
                isActive
                  ? 'border-os-accent text-os-accent font-semibold'
                  : 'border-transparent text-os-text-muted hover:text-os-text-primary hover:border-os-border',
                tab.disabled && 'opacity-40 cursor-not-allowed'
              )}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge && <span className="ml-1">{tab.badge}</span>}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('inline-flex items-center p-1 rounded-xl bg-os-surface-secondary/80 border border-os-border text-xs select-none gap-1', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 rounded-lg font-medium transition-all cursor-pointer px-3',
              size === 'sm' ? 'py-1 text-[11px]' : 'py-1.5 text-xs',
              isActive
                ? 'bg-os-surface text-os-text-primary font-semibold shadow-xs border border-white/10'
                : 'text-os-text-muted hover:text-os-text-primary hover:bg-white/[0.04]',
              tab.disabled && 'opacity-40 cursor-not-allowed'
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge && <span className="ml-1">{tab.badge}</span>}
          </button>
        );
      })}
    </div>
  );
};
