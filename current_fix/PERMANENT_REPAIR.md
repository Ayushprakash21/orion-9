ORION-9 FINAL TARGETED REPAIR

HOME
- ORION AI is no longer rendered as a Home dashboard quick-chat panel.
- ORION AI is not a default Dock/taskbar item.
- Existing persisted Dock state is sanitized on startup and written back so the old AI pin cannot resurrect.
- Explicit attempts to pin ORION AI are rejected, while the ORION AI application itself remains launchable from Applications / Command Palette.

GLOBAL TOP BAR
- Desktop System Bar is viewport anchored with a dedicated three-column grid: left system menu, centered workspace switcher, right system tray.
- Removed the previous absolute-center layout that could collide with left/right controls and push UI off-screen.
- Fixed 48px viewport contract, bounded width, isolation, and responsive collapse rules prevent horizontal overflow.

WINDOW CHROME
- Floating window geometry is clamped against negative top/left positions.
- Window title-bar controls are kept inside the title bar with reserved right-side space and overflow protection.

SCOPE
- Applied to src and orion9_work/src.
- Also synchronized the existing topbar_repair source copies so an older helper copy cannot reintroduce the broken implementation.
- No application business logic, authentication logic, routes, or data engines were changed.
