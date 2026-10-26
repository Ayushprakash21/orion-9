# Windows, App Launcher & Navigation

## Application Registry Architecture
Every module in Orion-9 is registered in `src/os/OrionApplicationRegistry.ts`. The registry specifies:
- Unique Application ID (e.g. `inventory`, `command-center`, `orion-ai`).
- Display Name and Localized Title.
- Assigned Route (e.g. `/inventory`, `/exceptions`).
- Category: `Operations`, `Intelligence`, `Control`, `Platform`, `AI`, or `System`.
- Category Theme Color & Registered Lucide / Orion icon.
- Default Dock Pinned Flag.

## Command Palette (`Alt + Space`)
The Command Palette provides instant keyboard-first navigation:
- Type any partial application name (e.g. "inv" for Inventory, "po" for Procurement).
- Filter by category with prefixes (`#ops`, `#ai`, `#admin`).
- Execute direct operational commands (e.g. "Create PO", "Simulate Port Strike").
