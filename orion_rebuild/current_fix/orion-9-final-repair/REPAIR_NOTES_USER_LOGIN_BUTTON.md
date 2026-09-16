# ORION-9 Repair — Admin Login User Login Button

Fixed the Admin Login screen navigation so the **← USER LOGIN** button is rendered inside the left visual panel and is anchored to that panel's viewport.

## Behavior
- Button is always visible at the lower-left of the Admin Login visual panel.
- Uses React Router `Link` to `/login` with `replace`.
- Does not depend on browser history.
- Does not sit inside the right authentication card, so a tall form/card cannot push it below the viewport.
- Applied to both the primary `src` tree and the bundled `orion9_work` copy.
