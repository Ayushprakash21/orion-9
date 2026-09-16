# ORION-9 VVIP Animation + Live Wallpaper Repair

## Implemented

- Live wallpaper remains 100% code-rendered via Canvas. No generated wallpaper image and no video background.
- Wallpaper world model is weighted to the right, leaving the left branding lane clear.
- ORION-9 logo is reference-locked in the upper-left visual lane.
- Wallpaper tagline is reference-locked beneath the logo with the exact three-line wording:
  - CONNECTED INTELLIGENCE
  - FOR A MORE RESILIENT
  - TOMORROW
- Supplied square logo asset is composited with `screen` blending so its black backing does not appear as a rectangular tile.
- Boot and post-login cinematic transitions each contain one branded focal point only: a centered ORION-9 logo.
- Center transition logo uses the complete supplied wordmark instead of the square mark treatment, preventing the logo from appearing tiny inside a black square.
- Removed the unused legacy `AuthenticationTransitions.tsx` component that contained additional logo animation markup.
- Added a defense-in-depth authentication rule: administrator roles cannot authenticate through normal User Login; Admin Console role-gated login remains valid.
- Removed stale nested repair/project directories from the delivered source.

## Validation

The source was statically inspected after repair. The build environment available while packaging had an incomplete `node_modules/.bin` installation, so final `npm run lint` / `npm run build` must be run in the fresh extracted project after `npm install`.
