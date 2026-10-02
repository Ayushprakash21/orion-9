/**
 * ORION-9 STATIC WALLPAPER COMPONENT & SAFE RENDERING BOUNDARY
 * Pure static image wallpaper host with deterministic fallback and crash-resilient boundary.
 * All WebGL, 3D Earth, Canvas2D, Three.js, particles, and animation loops have been removed.
 */

import React, { Component, ErrorInfo, ReactNode, useEffect, useState, useCallback } from 'react';
import { cn } from '../../lib/utils';
import { 
  wallpaperRepository, 
  WallpaperTarget,
  DEFAULT_LOGIN_WALLPAPER,
  DEFAULT_DESKTOP_WALLPAPER 
} from '../../repositories/WallpaperRepository';
import { WallpaperRecord } from '../../types/wallpaper';

/**
 * Wallpaper Error Boundary:
 * Isolates any wallpaper runtime exceptions, preventing the desktop shell,
 * taskbar, icons, windows, or widgets from ever crashing.
 */
export class WallpaperErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  public state = {
    hasError: false,
    error: null as Error | null,
  };

  public static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('[ORION-9] Wallpaper component error caught by safe boundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div 
          data-testid="orion-live-wallpaper-fallback"
          className="orion-static-wallpaper absolute inset-0 overflow-hidden pointer-events-none select-none z-0 bg-[#02050a]"
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 opacity-60 pointer-events-none" />
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 35%, rgba(2, 6, 15, 0.85) 100%)'
            }}
          />
        </div>
      );
    }
    return this.props.children;
  }
}

export interface OrionLiveWallpaperProps {
  hasOpenWindows?: boolean;
  showLogo?: boolean;
  overrideWallpaper?: WallpaperRecord;
  target?: WallpaperTarget;
  userId?: string;
  tenantId?: string;
  className?: string;
  // Deprecated legacy props for backward compatibility
  overrideMotionProfile?: any;
  overrideRuntimeReactive?: boolean;
  quality?: string;
}

export function OrionLiveWallpaper({
  hasOpenWindows = false,
  showLogo = false,
  overrideWallpaper,
  target = 'desktop',
  userId,
  tenantId,
  className
}: OrionLiveWallpaperProps) {
  const defaultRecord = target === 'login' ? DEFAULT_LOGIN_WALLPAPER : DEFAULT_DESKTOP_WALLPAPER;
  
  // Safe initial record fallback
  const getInitialRecord = (): WallpaperRecord => {
    if (overrideWallpaper && typeof overrideWallpaper === 'object') return overrideWallpaper;
    return defaultRecord;
  };

  const [activeWallpaper, setActiveWallpaper] = useState<WallpaperRecord>(getInitialRecord);
  const [imgSrc, setImgSrc] = useState<string>(() => {
    const init = getInitialRecord();
    return init.assetUrl || defaultRecord.assetUrl;
  });
  const [fallbackAttempted, setFallbackAttempted] = useState<boolean>(false);
  const [imgLoadFailed, setImgLoadFailed] = useState<boolean>(false);

  // Sync state when activeWallpaper changes
  useEffect(() => {
    const nextUrl = activeWallpaper?.assetUrl || defaultRecord.assetUrl;
    setImgSrc(nextUrl);
    setFallbackAttempted(false);
    setImgLoadFailed(false);
  }, [activeWallpaper, defaultRecord.assetUrl]);

  useEffect(() => {
    if (overrideWallpaper) {
      setActiveWallpaper(overrideWallpaper);
      return;
    }

    let mounted = true;
    const activeUserId = userId;
    const activeTenantId = tenantId || 'global';

    const loadActive = async () => {
      try {
        const wp = await wallpaperRepository.getActiveWallpaper(activeUserId, activeTenantId, target);
        if (mounted && wp && typeof wp === 'object') {
          setActiveWallpaper(wp);
        }
      } catch (err) {
        console.warn(`[ORION-9] Failed to load active ${target} wallpaper, using system default:`, err);
        if (mounted) {
          setActiveWallpaper(defaultRecord);
        }
      }
    };

    loadActive();

    // Target-isolated event listener: only updates when event matches this exact target
    const handleActiveChange = (e: any) => {
      try {
        if (e.detail?.target === target && e.detail?.wallpaper && typeof e.detail.wallpaper === 'object') {
          setActiveWallpaper(e.detail.wallpaper);
        }
      } catch (evtErr) {
        console.warn('[ORION-9] Error handling wallpaper change event:', evtErr);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('orion-active-wallpaper-changed', handleActiveChange as EventListener);
    }

    return () => {
      mounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('orion-active-wallpaper-changed', handleActiveChange as EventListener);
      }
    };
  }, [overrideWallpaper, target, userId, tenantId, defaultRecord]);

  // Non-looping, safe image error handler
  const handleImageError = useCallback(() => {
    if (!fallbackAttempted && imgSrc !== defaultRecord.assetUrl) {
      // First attempt: fallback to the default system asset
      setFallbackAttempted(true);
      setImgSrc(defaultRecord.assetUrl);
    } else {
      // Second attempt or already on default: stop loading to avoid infinite request loops
      setImgLoadFailed(true);
      console.warn(`[ORION-9] Wallpaper image failed to load for ${target}, rendering cosmic canvas fallback.`);
    }
  }, [fallbackAttempted, imgSrc, defaultRecord.assetUrl, target]);

  return (
    <WallpaperErrorBoundary>
      <div 
        data-testid="orion-live-wallpaper-container"
        data-target={target}
        className={cn(
          "orion-static-wallpaper absolute inset-0 overflow-hidden pointer-events-none select-none z-0 bg-[#02050a]",
          className
        )}
        aria-hidden="true"
      >
        {/* 1. Base Static Image Asset (only rendered if not failed) */}
        {!imgLoadFailed && (
          <img
            src={imgSrc}
            alt={activeWallpaper?.name || `${target} Wallpaper`}
            onError={handleImageError}
            className="orion-static-wallpaper-img absolute inset-0 w-full h-full object-cover object-center scale-100 filter-none"
          />
        )}

        {/* 2. Pure Static Vignette & Cinematic Darkening */}
        <div 
          className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-black/30 opacity-50"
        />

        {/* 3. Radial Vignette for Depth */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(2, 6, 15, 0.65) 100%)'
          }}
        />
      </div>
    </WallpaperErrorBoundary>
  );
}

export const StaticWallpaper = OrionLiveWallpaper;
export type StaticWallpaperProps = OrionLiveWallpaperProps;
