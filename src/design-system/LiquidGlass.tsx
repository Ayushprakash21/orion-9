import React, { useState, useCallback } from 'react';
import { cn } from '../lib/utils';
import { LiquidGlassTier, LIQUID_GLASS_TIERS } from './glass';
import { getLiquidGlassHighlight, CursorHighlightCoordinates } from './cursor';

export interface LiquidGlassProps extends React.HTMLAttributes<HTMLDivElement> {
  tier?: LiquidGlassTier;
  interactive?: boolean;
  withHighlight?: boolean;
  elevation?: 'none' | 'sm' | 'md' | 'lg' | 'dock' | 'modal';
  children?: React.ReactNode;
}

export const LiquidGlass = React.forwardRef<HTMLDivElement, LiquidGlassProps>(
  (
    {
      tier = 'glass2',
      interactive = false,
      withHighlight = false,
      elevation,
      className,
      style,
      children,
      onMouseMove,
      onMouseLeave,
      ...props
    },
    ref
  ) => {
    const [cursorCoord, setCursorCoord] = useState<CursorHighlightCoordinates | null>(null);

    const handleMouseMove = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (withHighlight) {
          const rect = e.currentTarget.getBoundingClientRect();
          setCursorCoord({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });
        }
        onMouseMove?.(e);
      },
      [withHighlight, onMouseMove]
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (withHighlight) {
          setCursorCoord(null);
        }
        onMouseLeave?.(e);
      },
      [withHighlight, onMouseLeave]
    );

    const tierSpec = LIQUID_GLASS_TIERS[tier].dark;
    const highlightGradient = withHighlight ? getLiquidGlassHighlight(cursorCoord, 'dark') : undefined;

    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden transition-colors duration-200',
          interactive && 'hover:bg-white/[0.08] active:bg-white/[0.12] cursor-pointer',
          elevation === 'sm' && 'shadow-sm',
          elevation === 'md' && 'shadow-md',
          elevation === 'lg' && 'shadow-xl',
          elevation === 'dock' && 'shadow-2xl',
          elevation === 'modal' && 'shadow-[0_32px_80px_rgba(0,0,0,0.65)]',
          className
        )}
        style={{
          background: tierSpec.background,
          backdropFilter: tierSpec.backdropFilter,
          WebkitBackdropFilter: tierSpec.WebkitBackdropFilter,
          border: tierSpec.border,
          boxShadow: tierSpec.boxShadow,
          backgroundImage: highlightGradient && highlightGradient !== 'none' ? highlightGradient : undefined,
          ...style,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {children}
      </div>
    );
  }
);

LiquidGlass.displayName = 'LiquidGlass';
