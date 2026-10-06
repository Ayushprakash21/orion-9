/**
 * ORION-9 OS LIFECYCLE STATUS LIST
 * Structured, high-precision assembly & status list for OS boot and teardown routines.
 */

import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { ORION_EASE } from '../motion/OrionMotion';

export interface LifecycleStatusItem {
  id: string;
  code?: string;
  label: string;
  status: string;
  isReady: boolean;
  isVisible?: boolean;
}

export interface OrionLifecycleStatusListProps {
  title?: string;
  items: LifecycleStatusItem[];
  allReady?: boolean;
  className?: string;
}

export const OrionLifecycleStatusList: React.FC<OrionLifecycleStatusListProps> = ({
  title = 'SYSTEM INITIALIZATION',
  items,
  allReady = false,
  className = '',
}) => {
  return (
    <div className={cn("w-full max-w-[320px] font-sans select-none", className)}>
      {/* List Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.08] text-[10px] font-sans font-medium tracking-wider text-white/40 uppercase">
        <span>{title}</span>
        <span className={cn(
          "transition-colors text-[10px] font-medium tracking-wide",
          allReady ? "text-emerald-400" : "text-sky-400/80"
        )}>
          {allReady ? 'SYSTEM READY' : 'IN PROGRESS'}
        </span>
      </div>

      {/* Item Rows */}
      <div className="space-y-1.5">
        {items.map((item) => {
          const visible = item.isVisible ?? true;
          return (
            <motion.div
              key={item.id}
              data-testid={`init-service-${item.id}`}
              data-service-ready={item.isReady ? 'true' : 'false'}
              initial={{ opacity: 0.15 }}
              animate={{ opacity: visible ? 1 : 0.15 }}
              transition={{ duration: 0.25, ease: ORION_EASE }}
              className="flex items-center justify-between text-xs w-full py-0.5"
            >
              {item.code && (
                <span className="font-mono text-[10px] text-white/30 mr-2 shrink-0">
                  {item.code}
                </span>
              )}
              <span className="shrink-0 text-white/75 font-normal text-[11px] sm:text-xs">
                {item.label}
              </span>
              <span className="mx-2 flex-1 border-b border-dotted border-white/10 h-0 translate-y-1" />
              <span
                className={cn(
                  "shrink-0 font-medium tracking-wider text-[10px] uppercase transition-colors duration-200",
                  item.isReady ? "text-emerald-400" : "text-white/30"
                )}
              >
                {item.status}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
