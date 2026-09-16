# ORION-9 Global Top Bar / System Menu / Notification Repair

Applied to the latest repaired source ZIP.

## Changes
- The branded ORION/logo area in `OrionSystemBar` is now the **System Menu** trigger.
- Removed the separate grid/System Menu trigger beside the ORION brand.
- Preserved the `/` separator, refresh and fullscreen controls.
- System Menu remains anchored to the global top bar and opens below the bar.
- Notification popover was repaired so `NotificationCenter` is not nested inside competing absolute/fixed positioning rules.
- Notification popover is now anchored directly to the notification tray control, with a viewport-safe max height and high z-index.
- Mobile notification backdrop remains fixed while the panel itself uses the stable container supplied by the top bar.
- Changes were applied to both the main source tree and `orion9_work/src` mirror where present.

## Acceptance
- Click ORION logo/brand -> System Menu opens.
- No separate grid icon is required for System Menu.
- Click notification bell -> notification panel appears directly beneath the top bar and remains inside the viewport.
- Click outside -> notification panel closes.
- Existing notification data/actions are unchanged.
