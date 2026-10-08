/**
 * ORION-9 WALLPAPER RUNTIME BRIDGE
 * Re-exports the canonical WallpaperRuntime component.
 * Retains backward-compatible component names, prop types, and non-interactive shell styling.
 */

import React from 'react';
import { WallpaperRuntime, WallpaperRuntimeProps, WallpaperErrorBoundary } from '../wallpaper/WallpaperRuntime';

export { WallpaperRuntime, WallpaperErrorBoundary };
export type { WallpaperRuntimeProps };

export function OrionLiveWallpaper(props: WallpaperRuntimeProps) {
  // pointer-events-none select-none
  return <WallpaperRuntime className="pointer-events-none select-none" {...props} />;
}

export type OrionLiveWallpaperProps = WallpaperRuntimeProps;

export const StaticWallpaper = OrionLiveWallpaper;
export type StaticWallpaperProps = WallpaperRuntimeProps;

export default OrionLiveWallpaper;
