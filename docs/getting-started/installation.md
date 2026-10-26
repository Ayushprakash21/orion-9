# Platform Support & Installation Guide

Orion-9 is built for deployment across modern cloud web browsers and native desktop environments using Tauri v2 and Rust.

## Platform Support Matrix

| Platform | Runtime Type | Package Format | Status | Hardware Minimum |
|---|---|---|---|---|
| **Modern Web** | Browser SPA | HTML5 / WebGL | **Verified Production** | 4GB RAM, WebGL 2.0 |
| **Windows 10 / 11** | Tauri v2 (WebView2) | `.msi`, `.exe` NSIS | **Verified Production** | 64-bit Intel/AMD, 4GB RAM |
| **macOS (Apple Silicon & Intel)** | Tauri v2 (WKWebView) | `.dmg`, `.app` | **Release Pipeline Verified** | macOS 12 Monterey+, 8GB RAM |
| **Linux (Enterprise)** | Tauri v2 (WebKitGTK) | `.deb`, `.AppImage` | **Architecture Ready** | Ubuntu 22.04 LTS+, WebKitGTK 4.1 |

## Native Windows Installation
1. Download the signed installer `Orion-9-Setup-9.0.0.exe` from the authenticated releases portal.
2. Run the installer. Administrator elevation is only required if installing system-wide (`Program Files`).
3. Launch **Orion-9** from the Windows Start Menu or Desktop Shortcut.

```powershell
# Silent Enterprise Deployment Command
Start-Process -FilePath "Orion-9-Setup-9.0.0.exe" -ArgumentList "/S" -Wait
```

## Security & Sandboxing
- Native desktop builds enforce **Zero-Origin Content Security Policies**.
- Operating system credential storage uses Windows DPAPI / macOS Keychain.
- Embedded browser webviews disable direct Node.js integration for strict sandbox enforcement.
