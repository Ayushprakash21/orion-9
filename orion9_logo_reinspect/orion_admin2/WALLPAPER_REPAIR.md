# ORION-9 Live Wallpaper Repair

The Home desktop wallpaper is a real-time React canvas renderer. No generated wallpaper/raster background is used.

## What was repaired
- Rebuilt the live wallpaper composition in `src/os/components/OrionLiveWallpaper.tsx`.
- Added a procedural Earth/world model, atmospheric rim, city-light field, orbital intelligence rings, star field, nebula band, network nodes and moving data packets.
- Kept the supplied ORION-9 logo asset as the only raster branding asset; the cosmic scene itself is generated live in the browser.
- Anchored the logo and the exact three-line tagline to the left branding lane so the globe/network animation cannot move them.
- Preserved the top-right OBSERVE / ANALYZE / ANTICIPATE / ACT and bottom status labels as live UI overlays.
- Fixed canvas resize handling so device-pixel scaling is reset correctly on every resize.
- Removed stale `new_boot.tsx` / `new_world.tsx` patch files and nested duplicate projects that were being picked up by TypeScript.
- Kept administrator authentication role-gated and expanded the account menu's admin visibility to both platform and organization administrators.
- Normalized active product branding to `ORION-9`.

## Build
From the project root:

```powershell
npm install
npm run lint
npm run build
npm start
```

Do not run `npm audit fix --force` as part of this repair; dependency remediation is separate from the source repair.
