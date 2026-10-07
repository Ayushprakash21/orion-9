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
import { preloadCoreSystemAssets } from '../wallpaper/wallpaperPreload';

// Ensure system wallpapers are eagerly preloaded
if (typeof window !== 'undefined') {
  preloadCoreSystemAssets();
}

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
  const getDefaultRecord = useCallback((): WallpaperRecord => {
    return target === 'login' ? DEFAULT_LOGIN_WALLPAPER : DEFAULT_DESKTOP_WALLPAPER;
  }, [target]);

  // Safe initial record fallback
  const getInitialRecord = useCallback((): WallpaperRecord => {
    if (overrideWallpaper && typeof overrideWallpaper === 'object') return overrideWallpaper;
    return getDefaultRecord();
  }, [overrideWallpaper, getDefaultRecord]);

  const [activeWallpaper, setActiveWallpaper] = useState<WallpaperRecord>(getInitialRecord);
  const [imgSrc, setImgSrc] = useState<string>(() => {
    const init = getInitialRecord();
    return init.assetUrl || getDefaultRecord().assetUrl;
  });
  const [fallbackAttempted, setFallbackAttempted] = useState<boolean>(false);

  // Sync state when activeWallpaper changes
  useEffect(() => {
    const defaultWp = getDefaultRecord();
    const nextUrl = activeWallpaper?.assetUrl || defaultWp.assetUrl;
    setImgSrc(nextUrl);
    setFallbackAttempted(false);
  }, [activeWallpaper, getDefaultRecord]);

  useEffect(() => {
    if (overrideWallpaper) {
      setActiveWallpaper(overrideWallpaper);
      return;
    }

    let mounted = true;
    const activeUserId = userId;
    const activeTenantId = tenantId || 'global';
    const requestIdRef = { current: 0 }; // local mutable object for closure safety
    const preloadCache = new Map<string, Promise<void>>();

    const preloadWallpaper = (url: string) => {
      if (preloadCache.has(url)) return preloadCache.get(url)!;
      const promise = new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to preload wallpaper'));
        img.src = url;
      });
      preloadCache.set(url, promise);
      return promise;
    };

    const loadActive = async () => {
      try {
        const wp = await wallpaperRepository.getActiveWallpaper(activeUserId, activeTenantId, target);
        if (!mounted || !wp || typeof wp !== 'object') return;
        // Increment request ID for this fetch
        const reqId = ++requestIdRef.current;
        // Preload the new image before committing
        await preloadWallpaper(wp.assetUrl);
        // Only commit if still the latest request
        if (mounted && reqId === requestIdRef.current) {
          setActiveWallpaper(prev => (prev?.wallpaperId === wp.wallpaperId && prev?.assetUrl === wp.assetUrl ? prev : wp));
        }
      } catch (err) {
        console.warn(`[ORION-9] Failed to load active ${target} wallpaper, using system default:`, err);
        if (!mounted) return;
        const defaultWp = getDefaultRecord();
        setActiveWallpaper(prev => (prev?.wallpaperId === defaultWp.wallpaperId ? prev : defaultWp));
      }
    };

    loadActive();

    const handleActiveChange = (e: any) => {
      try {
        if (e.detail?.target === target && e.detail?.wallpaper && typeof e.detail.wallpaper === 'object') {
          const wp = e.detail.wallpaper as WallpaperRecord;
          const reqId = ++requestIdRef.current;
          preloadWallpaper(wp.assetUrl)
            .then(() => {
              if (reqId === requestIdRef.current) {
                setActiveWallpaper(prev => (prev?.wallpaperId === wp.wallpaperId && prev?.assetUrl === wp.assetUrl ? prev : wp));
              }
            })
            .catch(() => {
              // ignore preload failures, keep current wallpaper
            });
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
  }, [overrideWallpaper, target, userId, tenantId, getDefaultRecord]);

  // Non-looping, safe image error handler
  const handleImageError = useCallback(() => {
    const defaultWp = getDefaultRecord();
    if (!fallbackAttempted && imgSrc !== defaultWp.assetUrl) {
      // First attempt: fallback to the default system asset
      setFallbackAttempted(true);
      setImgSrc(defaultWp.assetUrl);
    } else {
      console.warn(`[ORION-9] Wallpaper image load fallback to default asset for ${target}.`);
      if (imgSrc !== defaultWp.assetUrl) {
        setImgSrc(defaultWp.assetUrl);
      }
    }
  }, [fallbackAttempted, imgSrc, target, getDefaultRecord]);

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
        {/* 1. Base Static Image Asset */}
        <img
          src={imgSrc}
          alt={activeWallpaper?.name || `${target} Wallpaper`}
          data-orion-wallpaper-image="true"
          onError={handleImageError}
          draggable={false}
          loading="eager"
          decoding="async"
          className="orion-desktop-wallpaper-image orion-static-wallpaper-img absolute inset-0 w-full h-full object-cover object-center scale-100 filter-none select-none pointer-events-none"
        />

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
