/**
 * ORION-9 STATIC WALLPAPER COMPONENT & SAFE RENDERING BOUNDARY
 * Pure static image wallpaper host with deterministic fallback and crash-resilient boundary.
 * All WebGL, 3D Earth, Canvas2D, Three.js, particles, and animation loops have been removed.
 */

import React, { Component, ErrorInfo, ReactNode, useEffect, useState, useCallback, useRef } from 'react';
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

  // Architectural Refs for Single Source of Truth & Atomic Commit
  const wallpaperGenerationRef = useRef<number>(0);
  const displayedWallpaperRef = useRef<WallpaperRecord>(getInitialRecord());
  const lastKnownGoodWallpaperRef = useRef<WallpaperRecord>(getInitialRecord());

  // Browser-rendered image source tracking:
  const lastKnownGoodSrcRef = useRef<string>(imgSrc);
  const failedSrcRef = useRef<string | null>(null);

  // Robust preload and verification:
  // Candidate is valid only when:
  // 1. onload occurred
  // 2. image.complete === true
  // 3. image.naturalWidth > 0
  // 4. image.naturalHeight > 0
  const preloadAndVerifyWallpaper = useCallback((url: string): Promise<void> => {
    if (typeof window === 'undefined') return Promise.resolve();
    return new Promise((resolve, reject) => {
      const image = new Image();
      let settled = false;

      const fail = () => {
        if (settled) return;
        settled = true;
        reject(new Error(`Wallpaper failed to load: ${url}`));
      };

      const success = () => {
        if (settled) return;
        if (
          image.complete &&
          image.naturalWidth > 0 &&
          image.naturalHeight > 0
        ) {
          settled = true;
          resolve();
        } else {
          fail();
        }
      };

      image.onload = success;
      image.onerror = fail;
      image.src = url;

      if (image.complete) {
        success();
      }
    });
  }, []);

  // Atomic commit function - guarantees screen is never blanked and stale requests are ignored
  const commitWallpaperAtomically = useCallback((candidate: WallpaperRecord, generation: number) => {
    if (generation !== wallpaperGenerationRef.current) {
      // Stale request, discard
      return;
    }
    if (!candidate.assetUrl) return;

    displayedWallpaperRef.current = candidate;
    lastKnownGoodWallpaperRef.current = candidate;
    lastKnownGoodSrcRef.current = candidate.assetUrl;
    failedSrcRef.current = null;

    setActiveWallpaper(candidate);
    setImgSrc(candidate.assetUrl);
  }, []);

  // Sync override wallpaper if explicitly provided as prop
  useEffect(() => {
    if (overrideWallpaper && typeof overrideWallpaper === 'object') {
      const gen = ++wallpaperGenerationRef.current;
      preloadAndVerifyWallpaper(overrideWallpaper.assetUrl)
        .then(() => commitWallpaperAtomically(overrideWallpaper, gen))
        .catch(() => {
          // If candidate fails, KEEP current wallpaper; never blank
        });
    }
  }, [overrideWallpaper, preloadAndVerifyWallpaper, commitWallpaperAtomically]);

  // Authoritative background loading and event synchronization
  useEffect(() => {
    if (overrideWallpaper) return;

    let mounted = true;
    const activeUserId = userId;
    const activeTenantId = tenantId || 'global';

    const loadAuthoritativeActive = async () => {
      const currentGen = ++wallpaperGenerationRef.current;
      try {
        const wp = await wallpaperRepository.getActiveWallpaper(activeUserId, activeTenantId, target);
        if (!mounted || !wp || typeof wp !== 'object' || !wp.assetUrl) return;

        // If the repository returns the same wallpaper that is already displayed, no reload needed
        if (wp.wallpaperId === displayedWallpaperRef.current.wallpaperId && wp.assetUrl === displayedWallpaperRef.current.assetUrl) {
          return;
        }

        // Preload & verify before committing atomically
        await preloadAndVerifyWallpaper(wp.assetUrl);

        if (mounted && currentGen === wallpaperGenerationRef.current) {
          commitWallpaperAtomically(wp, currentGen);
        }
      } catch (err) {
        console.warn(`[ORION-9] Wallpaper load error for ${target}, preserving current wallpaper:`, err);
        // KEEP current wallpaper if future candidate fails. Never blank.
      }
    };

    loadAuthoritativeActive();

    // Event handler for wallpaper change events
    const handleActiveChange = (e: any) => {
      try {
        if (e.detail?.target === target && e.detail?.wallpaper && typeof e.detail.wallpaper === 'object') {
          const wp = e.detail.wallpaper as WallpaperRecord;
          if (!wp.assetUrl) return;

          const currentGen = ++wallpaperGenerationRef.current;
          preloadAndVerifyWallpaper(wp.assetUrl)
            .then(() => {
              if (mounted && currentGen === wallpaperGenerationRef.current) {
                commitWallpaperAtomically(wp, currentGen);
              }
            })
            .catch((err) => {
              console.warn('[ORION-9] Wallpaper candidate preload failed, keeping current wallpaper:', err);
              // KEEP the current wallpaper. Never blank the screen.
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
  }, [overrideWallpaper, target, userId, tenantId, preloadAndVerifyWallpaper, commitWallpaperAtomically]);

  // Image load handler: records successful source as last known good
  const handleImageLoad = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const loadedSrc =
        event.currentTarget.currentSrc ||
        event.currentTarget.src;

      if (loadedSrc) {
        lastKnownGoodSrcRef.current = loadedSrc;
        failedSrcRef.current = null;
      }
    },
    []
  );

  // Safe Image Error Handler: never destroy valid current wallpaper; fallback to lastKnownGoodSrcRef
  const handleImageError = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const failedSrc =
        event.currentTarget.currentSrc ||
        event.currentTarget.src;

      console.warn(
        `[ORION-9] Wallpaper image failed for ${target}; preserving last known-good source.`,
        failedSrc
      );

      if (failedSrcRef.current === failedSrc) {
        return;
      }

      failedSrcRef.current = failedSrc;

      const lastGoodSrc = lastKnownGoodSrcRef.current;

      if (lastGoodSrc && lastGoodSrc !== failedSrc) {
        setImgSrc(lastGoodSrc);
        return;
      }

      const defaultSrc = getDefaultRecord().assetUrl;

      if (failedSrc !== defaultSrc) {
        lastKnownGoodSrcRef.current = defaultSrc;
        setActiveWallpaper(getDefaultRecord());
        setImgSrc(defaultSrc);
      }
    },
    [target, getDefaultRecord]
  );

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
          onLoad={handleImageLoad}
          onError={handleImageError}
          draggable={false}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          style={{
            filter: 'blur(var(--orion-wallpaper-blur, 0px)) brightness(var(--orion-wallpaper-brightness, 1))',
          }}
          className="orion-desktop-wallpaper-image orion-static-wallpaper-img absolute inset-0 w-full h-full object-cover object-center scale-100 select-none pointer-events-none"
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

        {/* 4. Dynamic Dim Overlay controlled by Personalization Engine */}
        <div 
          data-testid="orion-wallpaper-dim-overlay"
          className="orion-wallpaper-dim-overlay"
        />
      </div>
    </WallpaperErrorBoundary>
  );
}

export const StaticWallpaper = OrionLiveWallpaper;
export type StaticWallpaperProps = OrionLiveWallpaperProps;
