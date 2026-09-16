# ORION-9 Repair Manifest

## Corrected lifecycle
TURN ON -> ORION-9 BOOT SEQUENCE -> USER/ADMIN LOGIN -> AUTHENTICATION TRANSITION -> HOME / ADMIN DASHBOARD

- Physical power-on now always ends at LOGIN_REQUIRED, even when a browser session was previously persisted.
- Power-on clears persisted authentication so login cannot be bypassed after shutdown.
- The dedicated `OrionBootSequence` is now the only full OS boot animation.
- User and admin post-login transitions are separate from boot and do not replay the boot animation.
- Global desktop shell uses a viewport-locked system bar and a workspace explicitly below the 48px bar.
- Root document scrolling is disabled so the global bar cannot scroll/climb out of the viewport.
- Window dragging/resizing is clamped to the workspace below the global system bar.
- Boot particle positions are deterministic instead of being regenerated with `Math.random()` on every render.
- Admin shell is viewport locked and its header is kept above admin content.

## Files changed
- `src/App.tsx`
- `src/store/AuthContext.tsx`
- `src/index.css`
- `src/os/components/OrionBootSequence.tsx`
- `src/os/components/OrionDesktop.tsx`
- `src/os/components/OrionSystemBar.tsx`
- `src/os/components/OrionWindow.tsx` (existing window chrome retained; workspace clamping repaired in manager)
- `src/os/WindowManagerContext.tsx`
- `src/components/admin/AdminLayout.tsx`

## Required runtime acceptance test
1. Start from OFF.
2. Press TURN ON.
3. Boot animation runs.
4. Login screen appears.
5. Authenticate as user or admin.
6. Only the short role-specific authentication transition runs.
7. User goes to Home; admin goes to Admin Dashboard.
8. Navigate between applications and scroll. Global top bar remains at viewport Y=0.
9. Open/maximize/move/resize Orion AI and verify its window controls never leave the workspace.
10. Shut down, turn on again, and verify login is required again.
