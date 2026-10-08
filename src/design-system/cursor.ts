/**
 * ORION-9 macOS / Liquid Glass Design System — Cursor & Interaction System
 * Native cursor states and subtle interactive surface highlights.
 */

export type OrionCursorState =
  | 'default'
  | 'pointer'
  | 'grab'
  | 'grabbing'
  | 'text'
  | 'ew-resize'
  | 'ns-resize'
  | 'nwse-resize'
  | 'nesw-resize'
  | 'not-allowed';

export interface CursorHighlightCoordinates {
  x: number;
  y: number;
}

/**
 * Returns a subtle cursor-relative radial reflection gradient string
 * for Liquid Glass surfaces.
 */
export function getLiquidGlassHighlight(
  coord: CursorHighlightCoordinates | null,
  colorScheme: 'light' | 'dark' = 'dark'
): string {
  if (!coord) return 'none';
  const color =
    colorScheme === 'dark'
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(255, 255, 255, 0.25)';
  return `radial-gradient(350px circle at ${coord.x}px ${coord.y}px, ${color}, transparent 65%)`;
}
