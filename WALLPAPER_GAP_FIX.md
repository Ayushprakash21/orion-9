# ORION-9 Wallpaper Gap Fix

The Home live wallpaper layer was structurally outside the workspace viewport and had a second 48px top offset. This created a blank band between the 48px system bar and the wallpaper.

The wallpaper layer is now a direct child of `.orion-app-viewport`, whose grid row already begins at 48px. The layer fills that viewport with `top/right/bottom/left: 0`, so there is exactly one 48px reservation.

No application behavior, wallpaper canvas logic, logo asset, profile, launcher, authentication, or settings logic was changed.
