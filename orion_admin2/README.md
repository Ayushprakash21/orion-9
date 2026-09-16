# ORION-9 Fresh Rebuild

This package is the consolidated ORION-9 application source. It contains one authoritative runtime project at the repository root; stale nested repair projects and patch scripts are intentionally excluded.

## Runtime
- React + Vite + TypeScript
- `npm run dev` for development
- `npm run build` for production build

## Architecture
Power On -> Cinematic System Boot -> Login/Admin Login -> Authenticated World Entry -> User Desktop or Admin Console.

The boot and post-login sequences use separate v3 visual systems. User profile identity fields, admin-controlled email, protected organization assignment, dock behavior, role separation, and the reserved global top bar are implemented in the runtime source.
