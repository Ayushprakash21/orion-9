# Taskbar, Dock & Notification Center

## Architectural Overview
The Orion-9 system interface consists of:
1. **Top System Bar** (\`src/os/components/OrionSystemBar.tsx\`): Persistent status, active app title, network latency, and system clock.
2. **Dynamic Island Capsule** (\`src/os/components/dynamicIsland/DynamicIslandCapsule.tsx\`): Live activity chips and notification badges.
3. **Application Dock** (\`src/os/components/OrionDock.tsx\`): Pinned applications, running instance indicators, and workspace switcher.
4. **Notification Center** (\`src/os/components/OrionControlCenterPopover.tsx\`): Aggregated notifications, system sound volume, display brightness, and network connectivity controls.

## Dock Capabilities
- **Running Indicators**: Glowing cyan dot underneath open applications.
- **Auto-Hide Contextual Mode**: When an application is maximized or active, the Dock can auto-retract to maximize vertical screen real estate; moving the pointer to the bottom edge smoothly reveals it.
- **Right-Click Window Controls**: Right-clicking any dock icon provides one-click access to *Restore*, *Minimize*, *Maximize*, and *Force Close*.
