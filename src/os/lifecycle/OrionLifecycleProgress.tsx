/**
 * ORION-9 OS LIFECYCLE PROGRESS BAR
 * High-precision horizontal progress indicator for boot, world entry, and session teardown.
 */

import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

export interface OrionLifecycleProgressProps {
  progress: number;
  label?: string;
  readyLabel?: string;
  variant?: 'neutral' | 'emerald' | 'red';
  className?: string;
}

export const OrionLifecycleProgress: React.FC<OrionLifecycleProgressProps> = ({
  progress,
  label = 'SYSTEM ASSEMBLY',
  readyLabel = 'SYSTEM READY',
  variant = 'neutral',
  className = '',
}) => {
  const isComplete = progress >= 100;

  const barColor =
    variant === 'red'
      ? 'bg-red-500'
      : variant === 'emerald'
      ? 'bg-[#5FAF8A]'
      : 'bg-white/60';

  return (
    <div className={cn("w-full max-w-[280px] font-sans select-none", className)}>
      {/* Progress Header */}
      <div className="flex items-center justify-between text-[10px] font-mono tracking-widest text-white/40 uppercase mb-2">
        <span>{label}</span>
        <span className="text-white/70 font-semibold">{Math.min(100, Math.floor(progress))}%</span>
      </div>

      {/* Progress Track */}
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-2.5">
        <motion.div
          className={cn("h-full rounded-full transition-all duration-150", barColor)}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>

      {/* System Status Footer */}
      <div className="flex items-center justify-between text-[10px] font-sans">
        <div
          data-testid="boot-system-ready-badge"
          className={cn(
            "flex items-center gap-1.5 transition-opacity duration-300",
            isComplete ? "opacity-100 text-emerald-400" : "opacity-0"
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span data-testid="init-system-ready-label" className="font-medium uppercase tracking-wider">
            {readyLabel}
          </span>
        </div>
      </div>
    </div>
  );
};
