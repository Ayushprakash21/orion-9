import React from 'react';
import { cn } from '../../lib/utils';

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxWidth?: 'standard' | 'wide' | 'compact' | 'full';
  className?: string;
}

/**
 * PageContainer — Canonical ORION-9 Page Content Wrapper
 * 
 * Provides consistent horizontal margins, padding, and centered viewport alignment:
 * - Desktop >= 1440px: 28–40px (xl:px-10)
 * - Desktop 1200–1439px: 24–32px (lg:px-8)
 * - Tablet: 20–24px (sm:px-6)
 * - Mobile: 16px (px-4)
 * - Centered on ultra-wide screens: max-w-[1680px] mx-auto
 */
export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = 'standard',
  className,
  ...props
}) => {
  const maxWidthClass = {
    standard: 'max-w-[1680px]',
    wide: 'max-w-[1840px]',
    compact: 'max-w-[1400px]',
    full: 'max-w-full',
  }[maxWidth];

  return (
    <div 
      className={cn(
        "w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 box-border min-w-0 space-y-6 animate-in fade-in duration-300",
        maxWidthClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
