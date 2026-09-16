import React from 'react';

type StatusType = 'critical' | 'warning' | 'healthy' | 'neutral' | 'info';

export const StatusBadge = ({
  status,
  type = 'neutral',
  className = ''
}: {
  status: string;
  type?: StatusType;
  className?: string;
}) => {
  const base = "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] uppercase font-mono font-medium border";
  
  let colors = "bg-os-surface-secondary text-os-text-secondary border-os-border";
  
  if (type === 'critical') {
    colors = "bg-os-surface-secondary text-red-500 border-red-500/20";
  } else if (type === 'warning') {
    colors = "bg-os-surface-secondary text-amber-500 border-amber-500/20";
  } else if (type === 'healthy') {
    colors = "bg-os-surface-secondary text-emerald-500 border-emerald-500/20";
  } else if (type === 'info') {
    colors = "bg-os-surface-secondary text-cyan-500 border-cyan-500/20";
  }

  return (
    <span className={`${base} ${colors} ${className}`}>
      {status}
    </span>
  );
};
