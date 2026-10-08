/**
 * ORION-9 CANONICAL WALLPAPER RUNTIME
 * Single authoritative wallpaper runtime for Desktop and Login shells.
 * Receives resolved wallpaper exclusively from WallpaperRepository.
 * Contains zero independent persistence, zero competing state, and zero hardcoded blue CSS gradients.
 */

import React, { Component, ReactNode, ErrorInfo, useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '../../lib/utils';
import { 
  wallpaperRepository, 
  WallpaperTarget,
  DEFAULT_LOGIN_WALLPAPER,
  DEFAULT_DESKTOP_WALLPAPER 
} from '../../repositories/WallpaperRepository';
import { WallpaperRecord } from '../../types/wallpaper';

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
    console.warn('[ORION-9] Wallpaper runtime boundary caught exception:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div 
          data-testid="orion-live-wallpaper-fallback"
          className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 bg-[var(--orion-bg)]"
          aria-hidden="true"
        />
      );
    }
    return this.props.children;
  }
}

export interface WallpaperRuntimeProps {
  target?: WallpaperTarget;
  userId?: string;
  tenantId?: string;
  className?: string;
  overrideWallpaper?: WallpaperRecord;
  hasOpenWindows?: boolean;
  showLogo?: boolean;
  // Deprecated compatibility props
  overrideMotionProfile?: any;
  overrideRuntimeReactive?: boolean;
  quality?: string;
}

export function WallpaperRuntime({
  target = 'desktop',
  userId,
  tenantId,
  className,
  overrideWallpaper
}: WallpaperRuntimeProps) {
  const getDefaultRecord = useCallback((): WallpaperRecord => {
    return target === 'login' ? DEFAULT_LOGIN_WALLPAPER : DEFAULT_DESKTOP_WALLPAPER;
  }, [target]);

  const getInitialRecord = useCallback((): WallpaperRecord => {
    if (overrideWallpaper && typeof overrideWallpaper === 'object') return overrideWallpaper;
    return wallpaperRepository.getActiveWallpaperSync(userId, target);
  }, [overrideWallpaper, userId, target]);

  const [activeWallpaper, setActiveWallpaper] = useState<WallpaperRecord>(getInitialRecord);
  const [imgSrc, setImgSrc] = useState<string>(() => {
    const init = getInitialRecord();
    return init.assetUrl || getDefaultRecord().assetUrl;
  });

  const wallpaperGenerationRef = useRef<number>(0);
  const displayedWallpaperRef = useRef<WallpaperRecord>(getInitialRecord());
  const lastKnownGoodSrcRef = useRef<string>(imgSrc);
  const failedSrcRef = useRef<string | null>(null);

  // Synchronize override wallpaper if provided
  useEffect(() => {
    if (overrideWallpaper && typeof overrideWallpaper === 'object' && overrideWallpaper.assetUrl) {
      displayedWallpaperRef.current = overrideWallpaper;
      lastKnownGoodSrcRef.current = overrideWallpaper.assetUrl;
      setActiveWallpaper(overrideWallpaper);
      setImgSrc(overrideWallpaper.assetUrl);
    }
  }, [overrideWallpaper]);

  // Subscribe to canonical wallpaper change events
  useEffect(() => {
    if (overrideWallpaper) return;

    let mounted = true;

    // Load active wallpaper from repository
    const loadFromRepository = async () => {
      const currentGen = ++wallpaperGenerationRef.current;
      try {
        const wp = await wallpaperRepository.getActiveWallpaper(userId, tenantId || 'global', target);
        if (!mounted || !wp || !wp.assetUrl) return;

        if (wp.wallpaperId === displayedWallpaperRef.current.wallpaperId && wp.assetUrl === displayedWallpaperRef.current.assetUrl) {
          return;
        }

        if (currentGen === wallpaperGenerationRef.current) {
          displayedWallpaperRef.current = wp;
          lastKnownGoodSrcRef.current = wp.assetUrl;
          failedSrcRef.current = null;
          setActiveWallpaper(wp);
          setImgSrc(wp.assetUrl);
        }
      } catch (err) {
        console.warn(`[ORION-9] WallpaperRepository load error for ${target}:`, err);
      }
    };

    loadFromRepository();

    const handleWallpaperChanged = (e: any) => {
      try {
        const detail = e.detail;
        if (detail?.target === target && detail?.wallpaper && typeof detail.wallpaper === 'object') {
          const wp = detail.wallpaper as WallpaperRecord;
          if (!wp.assetUrl) return;

          const currentGen = ++wallpaperGenerationRef.current;
          if (mounted && currentGen === wallpaperGenerationRef.current) {
            displayedWallpaperRef.current = wp;
            lastKnownGoodSrcRef.current = wp.assetUrl;
            failedSrcRef.current = null;
            setActiveWallpaper(wp);
            setImgSrc(wp.assetUrl);
          }
        }
      } catch (evtErr) {
        console.warn('[ORION-9] Error handling wallpaper event:', evtErr);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('orion-wallpaper-changed', handleWallpaperChanged as EventListener);
      window.addEventListener('orion-active-wallpaper-changed', handleWallpaperChanged as EventListener);
    }

    return () => {
      mounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('orion-wallpaper-changed', handleWallpaperChanged as EventListener);
        window.removeEventListener('orion-active-wallpaper-changed', handleWallpaperChanged as EventListener);
      }
    };
  }, [overrideWallpaper, target, userId, tenantId]);

  const handleImageError = useCallback(() => {
    console.warn(`[ORION-9] Wallpaper image failed to load for ${target}, using repository default record`);
    const defaultRecord = getDefaultRecord();
    failedSrcRef.current = imgSrc;
    if (defaultRecord.assetUrl && imgSrc !== defaultRecord.assetUrl) {
      setActiveWallpaper(defaultRecord);
      setImgSrc(defaultRecord.assetUrl);
    }
  }, [target, imgSrc, getDefaultRecord]);

  return (
    <WallpaperErrorBoundary>
      <div 
        data-testid="orion-live-wallpaper-container"
        data-wallpaper-runtime="true"
        data-target={target}
        className={cn(
          "orion-static-wallpaper absolute inset-0 overflow-hidden pointer-events-none select-none z-0",
          className
        )}
        aria-hidden="true"
      >
        {/* Layer 0: Controlled Neutral Base - Uses canonical OS surface tokens, never blue radial gradients */}
        <div 
          data-testid="orion-wallpaper-fallback-canvas"
          className="absolute inset-0 pointer-events-none bg-[var(--orion-bg)] z-0"
          aria-hidden="true"
        />

        {/* Layer 1: Authoritative Wallpaper Image */}
        <img
          src={imgSrc}
          alt={activeWallpaper?.name || `${target} Wallpaper`}
          data-orion-wallpaper-image="true"
          onError={handleImageError}
          draggable={false}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          style={{
            filter: 'blur(var(--orion-wallpaper-blur, 0px)) brightness(var(--orion-wallpaper-brightness, 1))',
          }}
          className="orion-desktop-wallpaper-image orion-static-wallpaper-img absolute inset-0 w-full h-full object-cover object-center scale-100 select-none pointer-events-none z-[1]"
        />

        {/* Layer 2: Dynamic Dim Overlay */}
        <div 
          data-testid="orion-wallpaper-dim-overlay"
          className="orion-wallpaper-dim-overlay absolute inset-0 pointer-events-none transition-opacity duration-300 z-[2]"
          style={{
            backgroundColor: 'rgba(0, 0, 0, var(--orion-wallpaper-dim, 0))'
          }}
        />
      </div>
    </WallpaperErrorBoundary>
  );
}

export default WallpaperRuntime;
