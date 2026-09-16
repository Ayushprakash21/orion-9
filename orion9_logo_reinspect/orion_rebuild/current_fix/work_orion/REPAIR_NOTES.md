# ORION-9 UI Repair – AI Window Fit

## Latest repair

Fixed the ORION AI application window so it fits the Orion OS window body instead of sizing itself from the browser viewport.

### Root cause
`AICopilot` used `h-[calc(100vh-64px)]`. The application is rendered inside `OrionWindow`, whose body is already a bounded window. Using the browser viewport height made the AI application taller than its window, causing the window body to scroll and clip/lose the top portion of the ORION AI UI.

### Changes
- ORION AI root now uses `w-full h-full min-h-0`.
- ORION AI inner layout now uses `flex-1 min-h-0` and `overflow-hidden`.
- The AI console and chat/input sections therefore fit inside both floating and maximized Orion windows.
- No browser-viewport height is used by the embedded AI application.
- Existing AI functionality and visual design are preserved.

This repair is intended to resolve the screenshot issue where the ORION AI console appeared cropped/partially missing and the lower portion of the window showed excessive empty space.
