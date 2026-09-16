# ORION-9 Repair Result

Applied to the root application and mirrored into `orion9_work/` for consistency.

## Fixed
- Power-on/authentication viewport isolation and 100dvh sizing.
- Global desktop top bar viewport anchoring and removed transformed authenticated shell ancestor.
- User Login viewport overflow/clipping.
- Admin Login viewport overflow/clipping.
- Added working `← USER LOGIN` navigation to Admin Login.
- ORION AI removed from the taskbar/dock, including cleanup of legacy persisted dock pins.
- Added compact ORION AI quick-chat launcher on the Home desktop; it disappears when an application window is open and returns when the desktop is clear.
- Existing boot -> login -> post-login third transition architecture preserved.
- Shutdown screen remains logo-based without `ORION SCM OS` title.

## Validation
TypeScript lint could not be completed in this environment because the uploaded project dependencies were incomplete and package installation timed out. The source changes were inspected directly and the original project structure/dependencies were preserved.
