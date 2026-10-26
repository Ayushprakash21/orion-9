# Codebase Structure & Architectural Layers

```
orion-9/
├── src/
│   ├── os/           # Operating System shell, Window Manager, Dock, Launcher
│   ├── scm/          # 19 Deterministic Supply Chain Engines
│   ├── kernel/       # Kernel Command Bus, Authorization, Event Fabric
│   ├── components/   # Application React Components & Views
│   ├── integration/  # Integration Fabric, Canonical Mappings, EDI
│   ├── ai/           # Orion AI Gateway, Copilot, Mission Engine
│   ├── operations/   # Governance, Alerting, Health, Backup Services
│   └── types/        # Canonical TypeScript Type Definitions
├── src-tauri/        # Rust Desktop Runtime (Tauri v2)
├── tests/            # Playwright End-to-End & Acceptance Tests
└── docs/             # Authoritative Documentation Manuals
```
