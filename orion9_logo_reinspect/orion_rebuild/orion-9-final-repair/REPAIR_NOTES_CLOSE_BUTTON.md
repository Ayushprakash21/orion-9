# ORION-9 Window Chrome Repair

## Fixed
- Window title bar is pinned to the top of its OS window.
- Window controls are anchored to the title bar's top-right corner instead of participating in normal content layout.
- Close (X), minimize, and maximize/restore controls remain inside the visible window chrome.
- Controls have a dedicated high z-index and opaque surface so application content cannot cover them.
- This specifically prevents the ORION AI close button from being pushed/clipped above the visible screen.

## Scope
Only the Orion OS window chrome was changed. ORION AI content and business logic were not changed.
