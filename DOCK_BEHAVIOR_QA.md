# ORION-9 Dock Behavior QA

## Required behavior
- Home/Desktop with no open application: Dock is permanently visible.
- Any open application anywhere in the OS workspace set: contextual auto-hide is enabled.
- Hidden application-mode Dock exposes a small semi-transparent bottom-center reveal handle.
- Hovering/focusing the reveal handle restores the Dock.
- Moving to the physical bottom edge restores the Dock.
- Leaving the Dock starts the hide timer.
- Closing the last application returns to permanent Home/Desktop Dock visibility.

## Implementation checks
- Dock visibility is derived from the Window Manager window collection, not only activeAppId.
- Home mode explicitly forces visible state.
- Application mode renders a 140px bottom reveal handle while hidden.
- Reveal handle has pointer and keyboard focus handlers.
- Existing Dock actions are unchanged.

## Build verification
A production dependency-backed build could not be run because this source archive does not contain node_modules and the sandbox has no installed project dependencies. Static source assertions and archive integrity were checked instead. This is therefore not a production-build PASS.
