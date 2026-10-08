/**
 * ORION-9 CANONICAL WALLPAPER RUNTIME
 * Single authoritative wallpaper runtime for Desktop and Login shells.
 * Receives resolved wallpaper exclusively from WallpaperRepository.
 * Fully appearance-aware: seamlessly transitions between dark and light default wallpapers.
 * Contains zero independent persistence, zero competing state, and zero hardcoded blue CSS gradients.
 */

import React, { Component, ReactNode, ErrorInfo, useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '../../lib/utils';
import { 
  wallpaperRepository, 
  WallpaperTarget,
  DEFAULT_LOGIN_WALLPAPER,
  DEFAULT_DESKTOP_WALLPAPER,
  DEFAULT_LIGHT_DESKTOP_WALLPAPER,
  resolveRuntimeWallpaper
} from '../../repositories/WallpaperRepository';
import { loadPreferences } from '../theme/OrionThemeStorage';
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

/**
 * Reads effective appearance mode ('light' | 'dark') from DOM attributes or storage
 */
function getEffectiveAppearanceMode(): 'light' | 'dark' {
  if (typeof document !== 'undefined') {
    const docMode = document.documentElement.getAttribute('data-orion-mode');
    if (docMode === 'light' || docMode === 'dark') return docMode;
  }
  const prefs = loadPreferences();
  if (prefs.appearanceMode === 'light') return 'light';
  if (prefs.appearanceMode === 'dark') return 'dark';
  const prefersDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

export function WallpaperRuntime({
  target = 'desktop',
  userId,
  tenantId,
  className,
  overrideWallpaper
}: WallpaperRuntimeProps) {
  const [appearanceMode, setAppearanceMode] = useState<'light' | 'dark'>(getEffectiveAppearanceMode);

  const getDefaultRecord = useCallback((mode?: 'light' | 'dark'): WallpaperRecord => {
    if (target === 'login') return DEFAULT_LOGIN_WALLPAPER;
    const effectiveMode = mode || getEffectiveAppearanceMode();
    return effectiveMode === 'light' ? DEFAULT_LIGHT_DESKTOP_WALLPAPER : DEFAULT_DESKTOP_WALLPAPER;
  }, [target]);

  const getInitialRecord = useCallback((): WallpaperRecord => {
    if (overrideWallpaper && typeof overrideWallpaper === 'object') return overrideWallpaper;
    const mode = getEffectiveAppearanceMode();
    const raw = wallpaperRepository.getActiveWallpaperSync(userId, target);
    return resolveRuntimeWallpaper(raw, target, mode);
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
  const mountedRef = useRef<boolean>(true);

  // Preloading image commit to guarantee zero-flash transitions
  const commitWallpaper = useCallback((wp: WallpaperRecord) => {
    if (!wp.assetUrl) return;
    const currentGen = ++wallpaperGenerationRef.current;

    if (typeof Image !== 'undefined') {
      const img = new Image();
      img.onload = () => {
        if (mountedRef.current && currentGen === wallpaperGenerationRef.current) {
          displayedWallpaperRef.current = wp;
          lastKnownGoodSrcRef.current = wp.assetUrl;
          failedSrcRef.current = null;
          setActiveWallpaper(wp);
          setImgSrc(wp.assetUrl);
        }
      };
      img.onerror = () => {
        if (mountedRef.current && currentGen === wallpaperGenerationRef.current) {
          console.warn(`[ORION-9] Wallpaper image failed to load for ${target}, using fallback`);
          const currentMode = getEffectiveAppearanceMode();
          const fallback = getDefaultRecord(currentMode);
          displayedWallpaperRef.current = fallback;
          setActiveWallpaper(fallback);
          setImgSrc(fallback.assetUrl);
        }
      };
      img.src = wp.assetUrl;
      // Handle instant cache hits (SVGs or preloaded assets) safely
      if (img.complete && img.naturalWidth !== 0) {
        if (mountedRef.current && currentGen === wallpaperGenerationRef.current) {
          displayedWallpaperRef.current = wp;
          lastKnownGoodSrcRef.current = wp.assetUrl;
          failedSrcRef.current = null;
          setActiveWallpaper(wp);
          setImgSrc(wp.assetUrl);
        }
      }
    } else {
      displayedWallpaperRef.current = wp;
      lastKnownGoodSrcRef.current = wp.assetUrl;
      failedSrcRef.current = null;
      setActiveWallpaper(wp);
      setImgSrc(wp.assetUrl);
    }
  }, [target, getDefaultRecord]);

  // Synchronize override wallpaper if provided
  useEffect(() => {
    if (overrideWallpaper && typeof overrideWallpaper === 'object' && overrideWallpaper.assetUrl) {
      displayedWallpaperRef.current = overrideWallpaper;
      lastKnownGoodSrcRef.current = overrideWallpaper.assetUrl;
      setActiveWallpaper(overrideWallpaper);
      setImgSrc(overrideWallpaper.assetUrl);
    }
  }, [overrideWallpaper]);

  // Subscribe to canonical wallpaper and appearance change events
  useEffect(() => {
    mountedRef.current = true;
    if (overrideWallpaper) return;

    // Load active wallpaper from repository on mount or target change
    const loadFromRepository = async () => {
      try {
        const mode = getEffectiveAppearanceMode();
        setAppearanceMode(mode);
        const wp = await wallpaperRepository.getActiveWallpaper(userId, tenantId || 'global', target);
        if (!mountedRef.current || !wp || !wp.assetUrl) return;

        const effectiveWp = resolveRuntimeWallpaper(wp, target, mode);
        if (
          effectiveWp.wallpaperId === displayedWallpaperRef.current.wallpaperId && 
          effectiveWp.assetUrl === displayedWallpaperRef.current.assetUrl
        ) {
          return;
        }

        commitWallpaper(effectiveWp);
      } catch (err) {
        console.warn(`[ORION-9] WallpaperRepository load error for ${target}:`, err);
      }
    };

    loadFromRepository();

    // Event listener for wallpaper selection changes
    const handleWallpaperChanged = (e: any) => {
      try {
        const detail = e.detail;
        if (!detail || (detail.target && detail.target !== target)) return;

        let wp = detail.wallpaper as WallpaperRecord | undefined;
        if (!wp && detail.wallpaperId) {
          wp = wallpaperRepository.getWallpaperByIdSync(detail.wallpaperId) || undefined;
        }

        if (wp && wp.assetUrl) {
          const mode = getEffectiveAppearanceMode();
          setAppearanceMode(mode);
          const effectiveWp = resolveRuntimeWallpaper(wp, target, mode);
          commitWallpaper(effectiveWp);
        }
      } catch (evtErr) {
        console.warn('[ORION-9] Error handling wallpaper event:', evtErr);
      }
    };

    // Event listener for appearance preferences / mode changes
    const handleAppearanceChanged = (e: any) => {
      try {
        let currentMode: 'light' | 'dark' = getEffectiveAppearanceMode();
        if (e?.detail?.appearanceMode === 'light' || e?.detail?.appearanceMode === 'dark') {
          currentMode = e.detail.appearanceMode;
        }
        setAppearanceMode(currentMode);

        if (target === 'desktop' && !overrideWallpaper) {
          // Adapt wallpaper if currently displaying a system default
          const currentWp = displayedWallpaperRef.current;
          const adapted = resolveRuntimeWallpaper(currentWp, 'desktop', currentMode);

          if (adapted.wallpaperId !== currentWp.wallpaperId || adapted.assetUrl !== currentWp.assetUrl) {
            commitWallpaper(adapted);
          }
        }
      } catch (err) {
        console.warn('[ORION-9] Error handling appearance changed event in wallpaper runtime:', err);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('orion-wallpaper-changed', handleWallpaperChanged as EventListener);
      window.addEventListener('orion-active-wallpaper-changed', handleWallpaperChanged as EventListener);
      window.addEventListener('orion-appearance-preferences-changed', handleAppearanceChanged as EventListener);
    }

    return () => {
      mountedRef.current = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('orion-wallpaper-changed', handleWallpaperChanged as EventListener);
        window.removeEventListener('orion-active-wallpaper-changed', handleWallpaperChanged as EventListener);
        window.removeEventListener('orion-appearance-preferences-changed', handleAppearanceChanged as EventListener);
      }
    };
  }, [overrideWallpaper, target, userId, tenantId, commitWallpaper]);

  const handleImageError = useCallback(() => {
    console.warn(`[ORION-9] Wallpaper image failed to load for ${target}, using repository default record`);
    const currentMode = getEffectiveAppearanceMode();
    const defaultRecord = getDefaultRecord(currentMode);
    failedSrcRef.current = imgSrc;
    if (defaultRecord.assetUrl && imgSrc !== defaultRecord.assetUrl) {
      displayedWallpaperRef.current = defaultRecord;
      setActiveWallpaper(defaultRecord);
      setImgSrc(defaultRecord.assetUrl);
    }
  }, [target, imgSrc, getDefaultRecord]);

  const isLight = appearanceMode === 'light';
  const isAdaptiveDefault = activeWallpaper.wallpaperId === DEFAULT_DESKTOP_WALLPAPER.wallpaperId || 
                            activeWallpaper.wallpaperId === DEFAULT_LIGHT_DESKTOP_WALLPAPER.wallpaperId;
  const isDimTransparent = isLight && isAdaptiveDefault;

  return (
    <WallpaperErrorBoundary>
      <div 
        data-testid="orion-live-wallpaper-container"
        data-wallpaper-runtime="true"
        data-target={target}
        data-mode={appearanceMode}
        className={cn(
          "orion-static-wallpaper absolute inset-0 overflow-hidden pointer-events-none select-none z-0",
          isLight ? "bg-[var(--orion-bg)]" : "bg-[#02050a]",
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

        {/* Layer 2: Dynamic Dim Overlay - Transparent for Light Mode system adaptive default */}
        <div 
          data-testid="orion-wallpaper-dim-overlay"
          className="orion-wallpaper-dim-overlay absolute inset-0 pointer-events-none transition-opacity duration-300 z-[2]"
          style={{
            backgroundColor: isDimTransparent ? 'transparent' : 'rgba(0, 0, 0, var(--orion-wallpaper-dim, 0))'
          }}
        />
      </div>
    </WallpaperErrorBoundary>
  );
}

export default WallpaperRuntime;
