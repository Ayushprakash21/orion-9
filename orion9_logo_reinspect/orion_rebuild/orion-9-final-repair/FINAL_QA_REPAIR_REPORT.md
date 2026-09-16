# ORION-9 Final Shell Repair / QA

## Root causes found
- User desktop background/backdrop used an absolute full-shell layer beginning at top:0.
- Dock was fixed to the browser viewport rather than the desktop shell.
- Admin header used responsive 56/64px heights, unlike the user 48px global chrome.
- Persisted dock state could render fewer than the requested ten canonical icons.
- A legacy Home ORION AI quick-card could survive in stale rendered DOM/builds.

## Repairs
- User shell uses a strict 48px chrome lane + workspace lane.
- Background/backdrop are restricted to the workspace lane.
- Application viewport is a hard clipping boundary.
- Dock is anchored to the desktop shell.
- Admin shell header is exactly 48px.
- Canonical workspace dock entries are restored to ten.
- Legacy Home quick-chat card is actively removed if injected by stale UI code; the ORION AI application remains available.

## Static QA
- No `Header.tsx` legacy global header exists in the current source.
- ORION AI is not a dock default.
- User and admin auth routes remain present.
- Admin `/admin` route remains protected by admin role.
- Right-click context menu handlers remain attached to desktop, dock items, launcher, and windows.
