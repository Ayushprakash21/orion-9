import React from 'react';
import { cn } from '../../lib/utils';

export interface OrionSettingsSplitLayoutProps {
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  title?: string;
  subtitle?: string;
  badge?: string;
  headerActions?: React.ReactNode;
  className?: string;
  primaryClassName?: string;
  secondaryClassName?: string;
}

export const OrionSettingsSplitLayout: React.FC<OrionSettingsSplitLayoutProps> = ({
  primary,
  secondary,
  title,
  subtitle,
  badge,
  headerActions,
  className,
  primaryClassName,
  secondaryClassName,
}) => {
  return (
    <div className={cn("flex-1 min-h-0 flex flex-col h-full overflow-hidden bg-transparent select-none min-w-0 max-w-full", className)}>
      {/* Optional Title Header Bar for Sections */}
      {(title || subtitle || badge || headerActions) && (
        <div 
          data-orion-settings-header="true"
          style={{
            backgroundColor: '#0c0e11',
            opacity: 1,
            backgroundImage: 'none',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            mixBlendMode: 'normal',
            isolation: 'isolate',
          }}
          className="px-6 md:px-7 h-[50px] min-h-[48px] max-h-[56px] border-b border-white/[0.07] bg-[#0c0e11] flex items-center justify-between gap-4 shrink-0 z-10 min-w-0 select-none"
        >
          <div className="flex items-center gap-3 min-w-0">
            {title && (
              <h2 className="text-sm font-semibold text-white tracking-wide truncate">
                {title}
              </h2>
            )}
            {badge && (
              <span className="px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 font-mono text-[10px] uppercase font-bold shrink-0">
                {badge}
              </span>
            )}
            {subtitle && (
              <div className="hidden sm:flex items-center gap-2.5 min-w-0">
                <span className="text-white/20 select-none font-mono text-xs">|</span>
                <span className="text-xs text-slate-400 truncate font-mono">
                  {subtitle}
                </span>
              </div>
            )}
          </div>
          {headerActions && (
            <div className="flex items-center gap-2 shrink-0">
              {headerActions}
            </div>
          )}
        </div>
      )}

      {/* Main Split Layout Body */}
      <div className="flex-1 min-h-0 flex flex-col xl:flex-row overflow-hidden w-full min-w-0 max-w-full">
        {/* Primary Control Pane */}
        <div 
          className={cn(
            "w-full xl:w-1/2 flex-1 xl:flex-none flex flex-col min-h-0 min-w-0 max-w-full overflow-y-auto overflow-x-hidden custom-scrollbar p-4 sm:p-5 xl:p-6 space-y-4 border-b xl:border-b-0 xl:border-r border-white/[0.08]",
            primaryClassName
          )}
        >
          {primary}
        </div>

        {/* Secondary Preview/Status Pane */}
        {secondary && (
          <div 
            className={cn(
              "w-full xl:w-1/2 flex-1 xl:flex-none flex flex-col min-h-0 min-w-0 max-w-full overflow-y-auto overflow-x-hidden custom-scrollbar p-4 sm:p-5 xl:p-6 space-y-4 bg-white/[0.01]",
              secondaryClassName
            )}
          >
            {secondary}
          </div>
        )}
      </div>
    </div>
  );
};
