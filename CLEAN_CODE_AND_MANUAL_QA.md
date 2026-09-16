# ORION-9 Clean Code + Manual Access QA

## Manual access
- Standard users: `/manual` -> `ManualCenter` with `admin=false`.
- Admins: `/admin/manual` -> `ManualCenter` with `admin=true`.
- User Manual has no Admin Manual navigation link.
- User Manual filters out all `ADMIN` articles/categories.
- Admin Manual does not link back to the User Manual.

## Launcher
- `user-manual` remains registered at `/manual` in `src/os/OrionApplicationRegistry.ts`.
- It is a Platform application and is available to the standard-user launcher.

## Cleanup
- Removed historical nested Orion project copies from the release package.
- Removed root-level patch, repair, diagnostic, test, rewrite and build-helper scripts from the release package.
- Preserved the active root `src/`, `public/`, runtime server, package metadata, build configuration, migration and essential documentation.

## Regression scope
No changes were made to the Dock, Window Manager, Admin Control Center, authentication implementation, Time & World, or other application components in this pass except the manual routing/access separation described above.
