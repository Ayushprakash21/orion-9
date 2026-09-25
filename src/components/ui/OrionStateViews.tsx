import React from 'react';
import { AlertTriangle, Inbox, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const OrionEmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data Available',
  description = 'There are no items matching your criteria at this time.',
  icon,
  action,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-os-border bg-os-surface/50 select-none', className)}>
      <div className="w-12 h-12 rounded-2xl bg-os-surface-elevated border border-os-border flex items-center justify-center text-os-text-muted mb-4 shadow-xs">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      <h3 className="text-os-text-primary text-sm sm:text-base font-semibold mb-1">{title}</h3>
      <p className="text-os-text-muted text-xs max-w-sm mb-5 leading-relaxed">{description}</p>
      {action && (
        <Button variant="secondary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
};

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const OrionLoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading resources...',
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-12 text-center select-none', className)}>
      <Loader2 className="w-7 h-7 text-os-accent animate-spin mb-3" />
      <span className="text-xs font-medium text-os-text-muted">{message}</span>
    </div>
  );
};

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const OrionErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while communicating with Orion services.',
  onRetry,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-red-500/20 bg-red-500/5 select-none', className)}>
      <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4 shadow-xs">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-os-text-primary text-sm sm:text-base font-semibold mb-1">{title}</h3>
      <p className="text-os-text-muted text-xs max-w-sm mb-5 leading-relaxed">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
};
