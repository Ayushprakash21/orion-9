# ORION-9 Branding QA

## Completed

- Replaced the retired `ORION SCM OS` product identity throughout the active source.
- Set `appName`, `productName`, `applicationName`, and `osName` defaults to `ORION-9`.
- Updated the checked-in server branding configuration to `ORION-9`.
- Added legacy-brand normalization so old persisted `ORION SCM OS`, `ORION 9 OS`, and related legacy values resolve to `ORION-9` at runtime.
- Updated visible/static application branding, login labels, system messages, error labels, PDF branding fallbacks, and AI-generated platform headers that used the retired product name.
- Fixed Admin Branding so the platform identity is fixed to `ORION-9`; the descriptor/tagline and logo remain configurable.
- Removed duplicate project copies and historical patch scripts from the shipped project root.

## Verification

- Exact retired product-name scan across active source/config/docs: PASS (no matches).
- Duplicate nested project roots: PASS (none).
- Patch/script files shipped at project root: PASS (none).
- `npm ci` was attempted, but the dependency installation timed out in the packaging environment before a complete dependency tree was available; therefore a dependency-aware Vite/TypeScript build is not claimed as verified here.
