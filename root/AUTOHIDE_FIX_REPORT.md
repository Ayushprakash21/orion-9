# ORION-9 Auto-Hide Fix

Patched the active root `src/os/components/OrionDock.tsx`.

- Dock starts hidden.
- Pointer at the bottom 18–32px edge reveals it.
- Leaving the dock schedules a 900ms hide.
- Hover cancels hiding.
- Window blur hides it.
- No close-toast or other Dock behavior was changed.
- No other source files were modified.

The archive contains the original project tree; this pass changes only the active root Dock implementation plus this report.
