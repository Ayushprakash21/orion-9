# Window Management & Geometry Engine

## Window Manager Architecture
The Orion Window Manager (`src/os/WindowManagerContext.tsx`) maintains the state of all open windows:
- **Z-Index Layering**: Clicking any window promotes it to the foreground (`zIndex: 100 + activeIndex`).
- **Snapping & Tiling**: Dragging a window to the left or right edge snaps it to half-screen (50% width); dragging to top snaps to full screen.
- **Boundary Clamping**: Prevents windows from being dragged completely offscreen or hidden behind the top system bar.

```typescript
interface WindowState {
  id: string;
  appId: string;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
}
```

## Responsive Layout Adaptations
- **Desktop (>= 1024px)**: Freeform floating windows with drag and resize handles.
- **Tablet (768px - 1023px)**: Auto-tiled windows with touch-friendly handles.
- **Mobile (< 768px)**: Windows automatically maximize into responsive app views with bottom navigation bar.
