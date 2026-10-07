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
}

/**
 * ORION-9 MACOS-GRADE TRAFFIC-LIGHT WINDOW CONTROLS
 * 
 * Absolute platform convention specification:
 * - Position: Top-left of window titlebar
 * - Order: RED (Close) -> YELLOW (Minimize) -> GREEN (Maximize/Restore)
 * - Size: Pure 12px x 12px circles, border-radius 50%, no border, no padding
 * - Hit Target: Invisible, transparent button wrapper (w-5 h-5 or w-3 h-3)
 * - Container: ZERO square, card, rounded-lg, or rounded-xl visual containers around controls
 * - Colors: #FF5F57 (Close), #FEBC2E (Minimize), #28C840 (Maximize)
 * - Micro-interactions: Subtle macOS-style glyphs (×, −, +) only on group-hover
 */
export const OrionWindowControls: React.FC<OrionWindowControlsProps> = ({
  onClose,
  onMinimize,
  onMaximize,
  isMaximized = false,
  appName = 'Window',
  className = '',
  disabled = false,
}) => {
  return (
    <div
      data-window-controls="true"
      data-orion-window-controls="true"
      className={cn('flex items-center gap-2 group/traffic-lights z-30 select-none shrink-0', className)}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      {/* 1. Close Button (RED #FF5F57) */}
      <button
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
          className="w-3 h-3 rounded-full flex items-center justify-center transition-transform active:scale-90"
          style={{ backgroundColor: '#FF5F57' }}
        >
          {/* Subtle Close glyph '×' visible on hover */}
          <svg
            className="w-2 h-2 opacity-0 group-hover/traffic-lights:opacity-85 transition-opacity"
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

      {/* 2. Minimize Button (YELLOW #FEBC2E) */}
      <button
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
          className="w-3 h-3 rounded-full flex items-center justify-center transition-transform active:scale-90"
          style={{ backgroundColor: '#FEBC2E' }}
        >
          {/* Subtle Minimize glyph '−' visible on hover */}
          <svg
            className="w-2 h-2 opacity-0 group-hover/traffic-lights:opacity-85 transition-opacity"
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

      {/* 3. Maximize / Restore Button (GREEN #28C840) */}
      <button
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
          className="w-3 h-3 rounded-full flex items-center justify-center transition-transform active:scale-90"
          style={{ backgroundColor: '#28C840' }}
        >
          {/* Subtle Maximize/Restore glyph visible on hover */}
          {isMaximized ? (
            <svg
              className="w-2 h-2 opacity-0 group-hover/traffic-lights:opacity-85 transition-opacity"
              viewBox="0 0 8 8"
              fill="none"
              stroke="#00460A"
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M 1.5 5.5 L 5.5 1.5 M 5.5 3.5 L 5.5 1.5 L 3.5 1.5 M 6.5 2.5 L 2.5 6.5 M 2.5 4.5 L 2.5 6.5 L 4.5 6.5" />
            </svg>
          ) : (
            <svg
              className="w-2 h-2 opacity-0 group-hover/traffic-lights:opacity-85 transition-opacity"
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
    </div>
  );
};
