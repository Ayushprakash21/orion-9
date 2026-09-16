# ORION-9 Fresh Build Manifest

- Consolidated from the supplied current project root.
- Removed nested duplicate runtime projects.
- Removed historical patch/diagnostic scripts from the shipped project.
- Replaced active boot animation with ORION Boot v3.
- Replaced active authenticated world-entry animation with World Entry v3.
- User login rejects administrator roles; admin login retains required-role path.
- User profile: full name, display name, phone country code/number, avatar, job title, department, profile organization label. Email is read-only/admin-controlled. Organization ID remains protected.
- Dock canonical default is ten apps and excludes ORION AI from the dock while retaining the app in the registry/launcher.
- Dock surface owns its context menu and suppresses browser context menu.
- Global top bar uses the reserved 48px shell lane.

Build verification in the packaging environment is limited if dependencies are not installed. The ZIP is assembled from the exact source tree and should be run with the normal AI Studio dependency install/build flow.
