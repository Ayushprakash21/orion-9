# ORION-9 User Account Menu Regression Guard

For a non-admin authenticated user, the account menu must never render or navigate to **Admin Panel**.

Authoritative rule in `src/components/layout/AccountMenu.tsx`:
- `isAdmin === true`: render Admin Panel -> `/admin`.
- `isAdmin === false`: do not render any Admin Panel item.

User access to `/admin` and `/admin/*` is additionally denied by `AuthenticatedApplication` in `src/App.tsx`.
