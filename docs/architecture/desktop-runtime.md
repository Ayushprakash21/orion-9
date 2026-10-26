# Native Desktop Architecture (Tauri v2)

## Rust Core & IPC
The native desktop version runs via Tauri v2 (`src-tauri/`):
- **Lightweight Binary**: Compiles to native machine code without bundling Chromium (~15MB vs ~180MB Electron).
- **Native Webview**: Uses Microsoft Edge WebView2 on Windows and WKWebView on macOS.
- **Rust Inter-Process Communication (IPC)**: Exposes secure operating system primitives (native file dialogs, system notifications, tray menus) through authenticated IPC channels.
