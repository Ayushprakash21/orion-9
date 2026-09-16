import React from 'react';
import { cn } from '../../lib/utils';

export interface SectionProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Section: React.FC<SectionProps> = ({
  title,
  subtitle,
  actions,
  children,
  className,
  ...props
}) => {
  return (
    <section className={cn('space-y-4 box-border min-w-0', className)} {...props}>
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-os-border/50">
          <div>
            {title && (
              <h2 className="text-sm sm:text-base font-semibold uppercase tracking-wider text-os-text-primary">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs text-os-text-muted mt-0.5">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
};

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 'kpi' | 'split-2' | 'split-3';
  gap?: 2 | 3 | 4 | 5 | 6 | 8;
  children: React.ReactNode;
  className?: string;
}

export const Grid: React.FC<GridProps> = ({
  cols = 3,
  gap = 6,
  children,
  className,
  ...props
}) => {
  const colClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
    6: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-6',
    kpi: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4',
    'split-2': 'grid-cols-1 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1.2fr)]',
    'split-3': 'grid-cols-1 xl:grid-cols-3',
  }[cols];

  const gapClass = {
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    5: 'gap-5',
    6: 'gap-6',
    8: 'gap-8',
  }[gap];

  return (
    <div className={cn('grid box-border min-w-0 w-full', colClass, gapClass, className)} {...props}>
      {children}
    </div>
  );
};

export interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  left?: React.ReactNode;
  right?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  left,
  right,
  children,
  className,
  ...props
}) => {
  if (children) {
    return (
      <div className={cn('flex flex-wrap items-center justify-between gap-3 p-3 bg-os-surface border border-os-border rounded-lg', className)} {...props}>
        {children}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-os-surface border border-os-border rounded-lg', className)} {...props}>
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
        {left}
      </div>
      {right && (
        <div className="flex items-center gap-2 shrink-0">
          {right}
        </div>
      )}
    </div>
  );
};

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  space?: 2 | 3 | 4 | 6 | 8;
  children: React.ReactNode;
  className?: string;
}

export const Stack: React.FC<StackProps> = ({
  space = 6,
  children,
  className,
  ...props
}) => {
  const spaceClass = {
    2: 'space-y-2',
    3: 'space-y-3',
    4: 'space-y-4',
    6: 'space-y-6',
    8: 'space-y-8',
  }[space];

  return (
    <div className={cn('flex flex-col box-border min-w-0 w-full', spaceClass, className)} {...props}>
      {children}
    </div>
  );
};
