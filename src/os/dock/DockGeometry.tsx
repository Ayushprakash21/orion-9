/**
 * ORION-9 OS GEOMETRY & SAFE AREA ENGINE
 * 
 * Single authoritative source of truth for all viewport calculations, safe-area insets,
 * Dock position & orientation, usable workspace rectangles, and component positioning
 * (windows, desktop icons, widgets, notifications, command palette, application launcher).
 */

import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { PersonalizationSettings, DockPosition, DockSize, DesktopIconSize, DesktopIconLayout } from '../../theme/themeTypes';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { DEFAULT_PERSONALIZATION_SETTINGS } from '../../theme/themePresets';
import { loadPreferences } from '../theme/OrionThemeStorage';

export type DockOrientation = 'horizontal' | 'vertical';

export interface DockGeometryMetrics {
  position: DockPosition;
  orientation: DockOrientation;
  iconSize: number; // 40px (small), 48px (medium), 56px (large)
  iconContainerSize: number; // 44px, 52px, 60px
  dockHeight: number; // For horizontal: main dimension (thickness), for vertical: length
  dockWidth: number; // For horizontal: length, for vertical: main dimension (thickness)
  thickness: number; // Thickness perpendicular to screen edge
  safeInset: number; // Space reserved on the screen edge (if auto-hide off, full; if on, reveal zone)
  revealZoneSize: number; // 8px
  hiddenTransform: string;
  tooltipPlacement: 'top' | 'bottom' | 'left' | 'right';
  magnificationOrigin: string;
}

export interface OSGeometryState {
  viewportWidth: number;
  viewportHeight: number;
  systemBarHeight: number;
  
  // Dock Geometry
  dock: DockGeometryMetrics;
  
  // Safe Area Insets (pixels reserved for OS chrome)
  safeArea: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };

  // Usable Workstation Rectangle (available for windows, maximized windows, desktop icons)
  usableRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  // Active Personalization Settings (staged or persisted)
  settings: PersonalizationSettings;

  // Live preview override support: when user changes setting in Personalization panel,
  // preview immediately updates without waiting for persistent 'Apply Changes'
  previewSettings: (preview: Partial<PersonalizationSettings> | null) => void;
}

const OSGeometryContext = createContext<OSGeometryState | undefined>(undefined);

// Inset calculation helper
export function computeDockGeometry(
  settings: PersonalizationSettings,
  viewportWidth: number,
  viewportHeight: number,
  systemBarHeight: number = 48,
  isDockVisible: boolean = true
): { dock: DockGeometryMetrics; safeArea: OSGeometryState['safeArea']; usableRect: OSGeometryState['usableRect'] } {
  const position: DockPosition = settings.dockPosition || 'bottom';
  const size: DockSize = settings.dockSize || 'medium';
  const autoHide = Boolean(settings.dockAutoHide);

  const orientation: DockOrientation = (position === 'left' || position === 'right') ? 'vertical' : 'horizontal';

  // Compute icon sizes according to dock size & uiScale
  const uiScaleRatio = (settings.uiScale || 100) / 100;
  let baseIconSize = 48;
  if (size === 'small') baseIconSize = 40;
  if (size === 'large') baseIconSize = 56;
  const iconSize = Math.round(baseIconSize * uiScaleRatio);
  const iconContainerSize = iconSize + 4;

  // Dock padding + border + margins = thickness
  const thickness = iconContainerSize + 24; // padding around items inside dock + dock container border
  const revealZoneSize = 10;

  // If dock is hidden due to auto-hide, safeInset on that edge is just revealZoneSize
  const effectiveInset = autoHide
    ? (isDockVisible ? thickness + 12 : revealZoneSize)
    : thickness + 12;

  let hiddenTransform = '';
  let tooltipPlacement: 'top' | 'bottom' | 'left' | 'right' = 'top';
  let magnificationOrigin = 'bottom center';

  switch (position) {
    case 'bottom':
      hiddenTransform = 'translate3d(-50%, calc(100% + 28px), 0)';
      tooltipPlacement = 'top';
      magnificationOrigin = 'bottom center';
      break;
    case 'top':
      hiddenTransform = 'translate3d(-50%, calc(-100% - 28px), 0)';
      tooltipPlacement = 'bottom';
      magnificationOrigin = 'top center';
      break;
    case 'left':
      hiddenTransform = 'translate3d(calc(-100% - 28px), -50%, 0)';
      tooltipPlacement = 'right';
      magnificationOrigin = 'center left';
      break;
    case 'right':
      hiddenTransform = 'translate3d(calc(100% + 28px), -50%, 0)';
      tooltipPlacement = 'left';
      magnificationOrigin = 'center right';
      break;
  }

  const dock: DockGeometryMetrics = {
    position,
    orientation,
    iconSize,
    iconContainerSize,
    dockHeight: orientation === 'horizontal' ? thickness : Math.min(viewportHeight - systemBarHeight - 32, 600),
    dockWidth: orientation === 'vertical' ? thickness : Math.min(viewportWidth - 32, 800),
    thickness,
    safeInset: effectiveInset,
    revealZoneSize,
    hiddenTransform,
    tooltipPlacement,
    magnificationOrigin
  };

  // Safe area around all 4 edges: macOS style.
  // The system bar at the top reserves system UI space.
  // The Dock is a floating overlay and NEVER reduces or insets the application layout area.
  const safeArea = {
    top: systemBarHeight,
    right: 0,
    bottom: 0,
    left: 0
  };

  const usableRect = {
    x: 0,
    y: systemBarHeight,
    width: viewportWidth,
    height: Math.max(240, viewportHeight - systemBarHeight)
  };

  return { dock, safeArea, usableRect };
}

export interface OSGeometryProviderProps {
  children: React.ReactNode;
}

export const OSGeometryProvider: React.FC<OSGeometryProviderProps> = ({ children }) => {
  const supplyChain = useSupplyChain();

  const persistentSettings = useMemo(() => {
    const scPers = supplyChain?.settings?.personalization;
    let fallbackAutoHide: boolean | undefined = undefined;
    try {
      const prefs = loadPreferences();
      if (prefs?.dockAutoHide !== undefined) {
        fallbackAutoHide = Boolean(prefs.dockAutoHide);
      }
    } catch {}

    return {
      ...DEFAULT_PERSONALIZATION_SETTINGS,
      ...(scPers || {}),
      ...(fallbackAutoHide !== undefined && scPers?.dockAutoHide === undefined ? { dockAutoHide: fallbackAutoHide } : {})
    };
  }, [supplyChain?.settings?.personalization]);

  const [previewOverrides, setPreviewOverrides] = useState<Partial<PersonalizationSettings> | null>(null);
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1440,
    height: typeof window !== 'undefined' ? window.innerHeight : 900
  });
  const [isDockVisible, setIsDockVisible] = useState(true);

  // Merge persistent with preview overrides
  const effectiveSettings = useMemo(() => {
    if (!previewOverrides) return persistentSettings;
    return { ...persistentSettings, ...previewOverrides };
  }, [persistentSettings, previewOverrides]);

  // Window resize listener
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen for appearance preferences changes dispatched by OrionThemeStorage / settings
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePrefChange = (e: any) => {
      if (e.detail && typeof e.detail === 'object') {
        const detail = e.detail;
        if (detail.dockAutoHide !== undefined || detail.dockPosition !== undefined || detail.dockMagnification !== undefined) {
          setPreviewOverrides(prev => ({
            ...(prev || {}),
            ...(detail.dockAutoHide !== undefined ? { dockAutoHide: Boolean(detail.dockAutoHide) } : {}),
            ...(detail.dockPosition !== undefined ? { dockPosition: detail.dockPosition } : {}),
            ...(detail.dockMagnification !== undefined ? { dockMagnification: Boolean(detail.dockMagnification) } : {}),
          }));
        }
      }
    };

    window.addEventListener('orion-appearance-preferences-changed', handlePrefChange as EventListener);
    return () => window.removeEventListener('orion-appearance-preferences-changed', handlePrefChange as EventListener);
  }, []);

  // Listen for dock visibility changes dispatched by OrionDock
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleDockVisibility = (e: any) => {
      if (typeof e.detail?.visible === 'boolean') {
        setIsDockVisible(e.detail.visible);
      }
    };

    window.addEventListener('orion-dock-visibility-changed', handleDockVisibility as EventListener);
    return () => window.removeEventListener('orion-dock-visibility-changed', handleDockVisibility as EventListener);
  }, []);

  // Compute authoritative geometry
  const systemBarHeight = 48;
  const { dock, safeArea, usableRect } = useMemo(() => {
    return computeDockGeometry(
      effectiveSettings,
      viewport.width,
      viewport.height,
      systemBarHeight,
      isDockVisible
    );
  }, [effectiveSettings, viewport.width, viewport.height, systemBarHeight, isDockVisible]);

  // Apply CSS Variables to Document Root for global layout engine
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    root.style.setProperty('--orion-os-safe-top', `${safeArea.top}px`);
    root.style.setProperty('--orion-os-safe-right', `${safeArea.right}px`);
    root.style.setProperty('--orion-os-safe-bottom', `${safeArea.bottom}px`);
    root.style.setProperty('--orion-os-safe-left', `${safeArea.left}px`);

    root.style.setProperty('--orion-os-system-bar-height', `${systemBarHeight}px`);
    root.style.setProperty('--orion-os-dock-width', `${dock.dockWidth}px`);
    root.style.setProperty('--orion-os-dock-height', `${dock.dockHeight}px`);
    root.style.setProperty('--orion-os-workspace-top', `${safeArea.top}px`);
    root.style.setProperty('--orion-os-workspace-right', `${safeArea.right}px`);
    root.style.setProperty('--orion-os-workspace-bottom', `${safeArea.bottom}px`);
    root.style.setProperty('--orion-os-workspace-left', `${safeArea.left}px`);

    root.style.setProperty('--orion-dock-position', dock.position);
    root.style.setProperty('--orion-dock-orientation', dock.orientation);
    root.style.setProperty('--orion-dock-thickness', `${dock.thickness}px`);
    root.style.setProperty('--orion-dock-safe-inset', `${dock.safeInset}px`);
    root.style.setProperty('--orion-dock-safe-height', '0px');

    // Workspace-relative insets: 0px so applications remain full size under the floating overlay dock
    root.style.setProperty('--orion-dock-workspace-top', '0px');
    root.style.setProperty('--orion-dock-workspace-right', '0px');
    root.style.setProperty('--orion-dock-workspace-bottom', '0px');
    root.style.setProperty('--orion-dock-workspace-left', '0px');

    root.style.setProperty('--orion-usable-width', `${usableRect.width}px`);
    root.style.setProperty('--orion-usable-height', `${usableRect.height}px`);

    // Surface custom transparency & wallpaper styling
    const dockOpacity = (effectiveSettings.dockTransparency ?? 85) / 100;
    root.style.setProperty('--orion-dock-opacity', `${dockOpacity}`);
    root.style.setProperty('--orion-wallpaper-blur', `${effectiveSettings.wallpaperBlur ?? 0}px`);
    root.style.setProperty('--orion-wallpaper-dim', `${(effectiveSettings.wallpaperDim ?? 0) / 100}`);

    root.setAttribute('data-dock-position', dock.position);
    root.setAttribute('data-dock-orientation', dock.orientation);
    root.setAttribute('data-dock-size', effectiveSettings.dockSize || 'medium');
    root.setAttribute('data-icon-size', effectiveSettings.iconSize || 'medium');
    root.setAttribute('data-window-control-position', effectiveSettings.windowControlPosition || 'left');
  }, [dock, safeArea, usableRect, effectiveSettings]);

  const previewSettings = useCallback((preview: Partial<PersonalizationSettings> | null) => {
    if (preview === null) {
      setPreviewOverrides(null);
    } else {
      setPreviewOverrides(prev => ({ ...(prev || {}), ...preview }));
    }
  }, []);

  const value: OSGeometryState = useMemo(() => ({
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
    systemBarHeight,
    dock,
    safeArea,
    usableRect,
    settings: effectiveSettings,
    previewSettings
  }), [viewport.width, viewport.height, systemBarHeight, dock, safeArea, usableRect, effectiveSettings, previewSettings]);

  return (
    <OSGeometryContext.Provider value={value}>
      {children}
    </OSGeometryContext.Provider>
  );
};

function positionSafeHeight(position: DockPosition, safeInset: number): number {
  if (position === 'bottom') return safeInset;
  return 12; // minimal clearance if dock is top/left/right
}

export function useOSGeometry(): OSGeometryState {
  const ctx = useContext(OSGeometryContext);
  if (!ctx) {
    // Graceful fallback for components outside geometry provider (e.g. headless unit tests)
    const defaults = DEFAULT_PERSONALIZATION_SETTINGS;
    const computed = computeDockGeometry(defaults, 1440, 900, 48, true);
    return {
      viewportWidth: 1440,
      viewportHeight: 900,
      systemBarHeight: 48,
      dock: computed.dock,
      safeArea: computed.safeArea,
      usableRect: computed.usableRect,
      settings: defaults,
      previewSettings: () => {}
    };
  }
  return ctx;
}
