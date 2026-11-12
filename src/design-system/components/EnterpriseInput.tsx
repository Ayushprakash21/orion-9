import React from 'react';
import { cn } from '../../lib/utils';
import { useOrionTheme } from '../../os/theme/useOrionTheme';

export interface EnterpriseInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ComponentType<{ className?: string }>;
  error?: string;
}

export const EnterpriseInput = React.forwardRef<HTMLInputElement, EnterpriseInputProps>(
  ({ label, icon: Icon, error, className, ...props }, ref) => {
    const { isDark } = useOrionTheme();

    return (
      <div className="space-y-1">
        {label && (
          <label
            className={cn(
              'block text-[11px] font-semibold uppercase tracking-wider',
              isDark ? 'text-white/60' : 'text-[#57606a]'
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <Icon
              className={cn(
                'w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2',
                isDark ? 'text-white/40' : 'text-[#8c959f]'
              )}
            />
          )}
          <input
            ref={ref}
            className={cn(
              'w-full py-1.5 text-xs rounded-sm border transition-colors focus:outline-none focus:ring-1 focus:ring-sky-500',
              Icon ? 'pl-8 pr-3' : 'px-3',
              error
                ? 'border-rose-500 text-rose-400'
                : isDark
                ? 'bg-[#161b22] border-[#30363d] text-white placeholder-white/30 focus:border-sky-500'
                : 'bg-white border-[#d0d7de] text-[#1f2328] placeholder-[#8c959f] focus:border-[#0969da]',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-[10px] text-rose-500 font-medium">{error}</p>}
      </div>
    );
  }
);

EnterpriseInput.displayName = 'EnterpriseInput';

export interface EnterpriseTabsProps {
  tabs: { id: string; label: string; count?: number; icon?: React.ComponentType<{ className?: string }> }[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const EnterpriseTabs: React.FC<EnterpriseTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
}) => {
  const { isDark } = useOrionTheme();

  return (
    <div
      className={cn(
        'flex items-center gap-1 border-b px-2 overflow-x-auto select-none',
        isDark ? 'border-[#30363d] bg-[#0d1117]' : 'border-[#d0d7de] bg-[#f6f8fa]',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'py-2 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap',
              isActive
                ? isDark
                  ? 'border-sky-400 text-sky-300'
                  : 'border-[#0969da] text-[#0969da]'
                : isDark
                ? 'border-transparent text-white/50 hover:text-white/80'
                : 'border-transparent text-[#57606a] hover:text-[#1f2328]'
            )}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'text-[10px] font-mono px-1.5 py-0.2 rounded-xs border',
                  isActive
                    ? isDark
                      ? 'bg-sky-500/20 text-sky-200 border-sky-400/30'
                      : 'bg-sky-100 text-[#0969da] border-sky-200'
                    : isDark
                    ? 'bg-white/5 text-white/40 border-white/10'
                    : 'bg-black/5 text-[#57606a] border-black/10'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export interface EnterpriseEmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export const EnterpriseEmptyState: React.FC<EnterpriseEmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon: Icon,
  className,
}) => {
  const { isDark } = useOrionTheme();

  return (
    <div
      className={cn(
        'p-8 text-center flex flex-col items-center justify-center max-w-sm mx-auto select-none',
        className
      )}
    >
      {Icon && (
        <div
          className={cn(
            'p-3 rounded-md border mb-3',
            isDark ? 'bg-white/5 border-white/10 text-white/50' : 'bg-black/5 border-black/10 text-black/50'
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      )}
      <h4 className={cn('text-xs font-semibold uppercase tracking-wider', isDark ? 'text-white' : 'text-[#1f2328]')}>
        {title}
      </h4>
      <p className={cn('text-[11px] mt-1 mb-4 leading-relaxed', isDark ? 'text-white/50' : 'text-[#6e7781]')}>
        {description}
      </p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className={cn(
            'px-3 py-1 rounded-sm text-xs font-semibold border transition-colors cursor-pointer',
            isDark
              ? 'bg-sky-600 hover:bg-sky-500 text-white border-sky-500'
              : 'bg-[#0969da] hover:bg-[#0550ae] text-white border-[#0969da]'
          )}
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
