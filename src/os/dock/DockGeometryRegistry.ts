/**
 * ORION-9 DOCK & ICON GEOMETRY REGISTRY
 * 
 * Tracks the live bounding rectangles of Dock icons and launcher tiles on screen.
 * Used by OrionWindow to calculate genuine source/target geometry for macOS-inspired
 * application launch expansion and Genie-inspired minimize/restore funnel effects.
 */

export interface IconGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
  center: { x: number; y: number };
}

class DockGeometryRegistry {
  private static instance: DockGeometryRegistry;
  private iconElements = new Map<string, HTMLElement>();


  public clear(): void {
    this.iconElements.clear();
  }

  public unregisterIcon(appId: string): void {
    this.iconElements.delete(appId);
  }

  public getIconRect(appId: string): DOMRect | null {
    const el = this.iconElements.get(appId);
    if (!el || typeof el.getBoundingClientRect !== 'function') {
      return null;
    }
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      return null;
    }
    return rect;
  }

  public getIconCenter(appId: string): { x: number; y: number } | null {
    const geom = this.getIconGeometry(appId);
    return geom ? geom.center : null;
  }

  public static getInstance(): DockGeometryRegistry {
    if (!DockGeometryRegistry.instance) {
      DockGeometryRegistry.instance = new DockGeometryRegistry();
    }
    return DockGeometryRegistry.instance;
  }

  public registerIcon(appId: string, element: HTMLElement | null): void {
    if (!element) {
      this.iconElements.delete(appId);
      return;
    }
    this.iconElements.set(appId, element);
  }

  public getIconGeometry(appId: string): IconGeometry | null {
    const el = this.iconElements.get(appId);
    if (!el || typeof el.getBoundingClientRect !== 'function') {
      return null;
    }
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return null;
    }
    return {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      center: {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      },
    };
  }

  /**
   * Returns fallback geometry near the bottom center of the viewport if icon cannot be resolved
   */
  public getFallbackGeometry(): IconGeometry {
    const vpWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const vpHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const width = 48;
    const height = 48;
    return {
      x: vpWidth / 2 - width / 2,
      y: vpHeight - 64,
      width,
      height,
      center: {
        x: vpWidth / 2,
        y: vpHeight - 40,
      },
    };
  }
}

export const dockGeometryRegistry = DockGeometryRegistry.getInstance();
