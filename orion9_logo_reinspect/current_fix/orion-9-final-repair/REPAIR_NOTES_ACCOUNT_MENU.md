# Account Menu Repair — User/Admin separation

## Fix
Removed the erroneous `!isAdmin` Admin Panel menu item from `src/components/layout/AccountMenu.tsx`.

The Admin Panel entry now exists only inside the existing `isAdmin` guard and routes administrators to `/admin`.

## Expected behavior
- Regular user account dropdown: Profile, Organization, Brightness, True Tone, Sign Out.
- Platform admin account dropdown: Profile, Admin Panel, Brightness, True Tone, Sign Out.
- Regular users no longer see or get an Admin Panel/Admin Login item in the account dropdown.

No authentication, routing, or other account-menu behavior was changed.
