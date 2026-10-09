import React from 'react';
import { cn } from '../../lib/utils';

export interface OrionWindowControlsProps {
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  isMaximized?: boolean;
  appName?: string;
  className?: string;
  disabled?: boolean;
  position?: 'left' | 'right';
}

/**
 * ORION-9 TRAFFIC-LIGHT WINDOW CONTROLS
 * 
 * macOS-style circular traffic-light buttons with Windows-style control order:
 * 1. Minimize — Yellow (#FEBC2E), using existing minimize handler.
 * 2. Maximize / Restore — Green (#28C840), using existing maximize and restore handlers.
 * 3. Close — Red (#FF5F57), using existing close handler.
 * 
 * Arranged horizontally from left to right in exactly this order:
 * Yellow (Minimize) -> Green (Maximize / Restore) -> Red (Close).
 * 
 * Visual Specification:
 * - Size: Compact 12px x 12px circular buttons, border-radius 50%
 * - Hit Target: Transparent button wrapper (w-3.5 h-3.5) with focus ring
 * - Micro-interactions: Subtle action glyphs on group-hover / button-hover / focus-visible
 * - Maximize / Restore dynamic icon switching based on window state
 */
export const OrionWindowControls: React.FC<OrionWindowControlsProps> = ({
  onClose,
  onMinimize,
  onMaximize,
  isMaximized = false,
  appName = 'Window',
  className = '',
  disabled = false,
  position = 'left',
}) => {
  const minimizeButton = (
    <button
      key="control-minimize"
      type="button"
      aria-label={`Minimize ${appName}`}
      title={`Minimize ${appName}`}
      disabled={disabled || !onMinimize}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onMinimize?.();
      }}
      className={cn(
        'relative flex items-center justify-center p-0 m-0 bg-transparent border-0 outline-none shadow-none cursor-pointer',
        'w-3.5 h-3.5 focus-visible:ring-1 focus-visible:ring-white/40 focus-visible:rounded-full',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
    >
      <span
        className="w-3 h-3 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-90 border border-black/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
        style={{ backgroundColor: '#FEBC2E' }}
      >
        <svg
          className="w-2 h-2 opacity-0 group-hover/traffic-lights:opacity-90 group-focus-within/traffic-lights:opacity-90 hover:opacity-100 focus-visible:opacity-100 transition-opacity"
          viewBox="0 0 8 8"
          fill="none"
          stroke="#533300"
          strokeWidth="1.2"
          strokeLinecap="round"
        >
          <path d="M 1.5 4 L 6.5 4" />
        </svg>
      </span>
    </button>
  );

  const maximizeButton = (
    <button
      key="control-maximize"
      type="button"
      aria-label={isMaximized ? `Restore ${appName}` : `Maximize ${appName}`}
      title={isMaximized ? `Restore ${appName}` : `Maximize ${appName}`}
      disabled={disabled || !onMaximize}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onMaximize?.();
      }}
      className={cn(
        'relative flex items-center justify-center p-0 m-0 bg-transparent border-0 outline-none shadow-none cursor-pointer',
        'w-3.5 h-3.5 focus-visible:ring-1 focus-visible:ring-white/40 focus-visible:rounded-full',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
    >
      <span
        className="w-3 h-3 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-90 border border-black/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
        style={{ backgroundColor: '#28C840' }}
      >
        {isMaximized ? (
          <svg
            className="w-2 h-2 opacity-0 group-hover/traffic-lights:opacity-90 group-focus-within/traffic-lights:opacity-90 hover:opacity-100 focus-visible:opacity-100 transition-opacity"
            viewBox="0 0 8 8"
            fill="none"
            stroke="#00460A"
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M 1.5 5.5 L 5.5 1.5 M 5.5 3.5 L 5.5 1.5 L 3.5 1.5 M 6.5 2.5 L 2.5 6.5 L 2.5 4.5 L 2.5 6.5 L 4.5 6.5" />
          </svg>
        ) : (
          <svg
            className="w-2 h-2 opacity-0 group-hover/traffic-lights:opacity-90 group-focus-within/traffic-lights:opacity-90 hover:opacity-100 focus-visible:opacity-100 transition-opacity"
            viewBox="0 0 8 8"
            fill="none"
            stroke="#00460A"
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M 2 2 L 6 6 M 2 4.5 L 2 2 L 4.5 2 M 6 3.5 L 6 6 L 3.5 6" />
          </svg>
        )}
      </span>
    </button>
  );

  const closeButton = (
    <button
      key="control-close"
      type="button"
      aria-label={`Close ${appName}`}
      title={`Close ${appName} (⌘W)`}
      disabled={disabled || !onClose}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onClose?.();
      }}
      className={cn(
        'relative flex items-center justify-center p-0 m-0 bg-transparent border-0 outline-none shadow-none cursor-pointer',
        'w-3.5 h-3.5 focus-visible:ring-1 focus-visible:ring-white/40 focus-visible:rounded-full',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
    >
      <span
        className="w-3 h-3 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-90 border border-black/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
        style={{ backgroundColor: '#FF5F57' }}
      >
        <svg
          className="w-2 h-2 opacity-0 group-hover/traffic-lights:opacity-90 group-focus-within/traffic-lights:opacity-90 hover:opacity-100 focus-visible:opacity-100 transition-opacity"
          viewBox="0 0 8 8"
          fill="none"
          stroke="#4A0002"
          strokeWidth="1.2"
          strokeLinecap="round"
        >
          <path d="M 2 2 L 6 6 M 6 2 L 2 6" />
        </svg>
      </span>
    </button>
  );

  return (
    <div
      data-window-controls="true"
      data-orion-window-controls="true"
      data-position={position}
      className={cn('flex items-center gap-2 group/traffic-lights z-30 select-none shrink-0', className)}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      {/* 
        Windows-style control order with macOS circular traffic-light buttons:
        1. Minimize — Yellow (#FEBC2E)
        2. Maximize / Restore — Green (#28C840)
        3. Close — Red (#FF5F57)
        Arranged horizontally from left to right in exactly this order: Yellow -> Green -> Red
      */}
      {minimizeButton}
      {maximizeButton}
      {closeButton}
    </div>
  );
};

