# ORION-9 VVIP Live Wallpaper Repair

This build is intended to be imported as the active project root in Google AI Studio.

## What changed
- Replaced the previous generic globe with a live Canvas world-model: Earth shading, continental silhouettes, city-light field, latitude/longitude grid, atmosphere, nebula/star field, orbital rings, supply-chain nodes and moving data packets.
- Locked the ORION-9 logo into a fixed upper-left branding frame matching the supplied reference composition.
- Locked the three-line tagline below the logo; it is DOM/CSS UI, not painted into the moving canvas.
- Uses `/public/orion-9-logo.png` and CSS screen compositing so the black pixels in the square source asset do not create a visible black card.
- Removed duplicate boot/world-entry logo placements; each cinematic transition has one centered focal ORION-9 wordmark.
- Removed stale nested projects and repair scripts from the delivered root so TypeScript/Vite cannot accidentally compile an old copy.
- User/admin authentication remains separated at the auth layer; organization admins are treated as administrators.

## AI Studio
Import this ZIP as the project source. Do not copy it into an older nested repair directory. The intended build root contains `package.json`, `src/`, and `public/`.

Run:
`npm install`
`npm run lint`
`npm run build`

The wallpaper is generated at runtime. No generated wallpaper image or video is embedded.
