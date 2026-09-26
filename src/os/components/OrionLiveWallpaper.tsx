/**
 * ORION-9 STATIC WALLPAPER COMPONENT
 * Pure static image wallpaper host. All WebGL, 3D Earth, Canvas2D, Three.js,
 * particles, and animation loops have been completely removed.
 */

import React, { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { 
  wallpaperRepository, 
  WallpaperTarget,
  DEFAULT_LOGIN_WALLPAPER,
  DEFAULT_DESKTOP_WALLPAPER 
} from '../../repositories/WallpaperRepository';
import { WallpaperRecord } from '../../types/wallpaper';

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
  const [activeWallpaper, setActiveWallpaper] = useState<WallpaperRecord>(() => overrideWallpaper || defaultRecord);

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
        if (mounted) setActiveWallpaper(wp);
      } catch (err) {
        console.warn(`Failed to load active ${target} wallpaper:`, err);
      }
    };

    loadActive();

    // Target-isolated event listener: only updates when event matches this exact target
    const handleActiveChange = (e: any) => {
      if (e.detail?.target === target && e.detail?.wallpaper) {
        setActiveWallpaper(e.detail.wallpaper);
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
  }, [overrideWallpaper, target, userId, tenantId]);

  const assetUrl = activeWallpaper.assetUrl || defaultRecord.assetUrl;

  return (
    <div 
      data-testid="orion-live-wallpaper-container"
      data-target={target}
      className={cn(
        "orion-static-wallpaper absolute inset-0 overflow-hidden pointer-events-none select-none z-0 bg-[#02050a]",
        "transition-all duration-700 ease-out",
        className
      )}
      aria-hidden="true"
    >
      {/* 1. Base Static Image Asset */}
      <img
        src={assetUrl}
        alt={activeWallpaper.name || `${target} Wallpaper`}
        onError={(e) => {
          const imgEl = e.currentTarget;
          if (imgEl.src !== defaultRecord.assetUrl) {
            imgEl.src = defaultRecord.assetUrl;
          }
        }}
        className={cn(
          "orion-static-wallpaper-img absolute inset-0 w-full h-full object-cover object-center",
          "transition-all duration-700 ease-out",
          hasOpenWindows 
            ? "scale-[1.02] filter blur-[3px] brightness-[0.70] contrast-[1.05]" 
            : "scale-100 filter blur-0 brightness-100 contrast-100"
        )}
      />

      {/* 2. Pure Static Vignette & Cinematic Darkening */}
      <div 
        className={cn(
          "absolute inset-0 transition-opacity duration-700 pointer-events-none",
          "bg-gradient-to-t from-black/60 via-transparent to-black/30",
          hasOpenWindows ? "opacity-90" : "opacity-40"
        )} 
      />

      {/* 3. Radial Vignette for Depth */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(2, 6, 15, 0.65) 100%)'
        }}
      />
    </div>
  );
}

export const StaticWallpaper = OrionLiveWallpaper;
export type StaticWallpaperProps = OrionLiveWallpaperProps;
