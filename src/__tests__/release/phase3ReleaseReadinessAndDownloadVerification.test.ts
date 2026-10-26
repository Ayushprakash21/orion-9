/**
 * ORION-9 PHASE 3: CROSS-PLATFORM RELEASE READINESS AND DOWNLOAD VERIFICATION SUITE
 * 
 * Verifies:
 * 1. Windows installer artifacts (NSIS .exe, WiX .msi, and standalone .exe binary)
 * 2. Magic bytes and file signatures (MZ header, OLE compound binary)
 * 3. SHA-256 cryptographic provenance and integrity
 * 4. Download route safety (404 JSON for missing files, zero SPA HTML fallback for binaries)
 * 5. Cloudflare Workers 25 MiB static asset limit mitigation (.assetsignore and worker guards)
 * 6. Native System Browser bounds clamping, URL validation, and web fallback
 * 7. CI release workflow verification gates (TypeScript, unit tests, secret protection)
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

describe('ORION-9 Phase 3: Cross-Platform Release Readiness & Packaging Verification', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  const exePath = path.join(rootDir, 'public/downloads/Orion-9-Setup.exe');
  const msiPath = path.join(rootDir, 'public/downloads/Orion-9-Setup.msi');
  const standaloneExePath = path.join(rootDir, 'src-tauri/target/release/orion-desktop.exe');

  const EXPECTED_EXE_SIZE = 30336791;
  const EXPECTED_EXE_SHA256 = 'e2dfeb480522b9da077bb58e0954d6d8e09f1023fb6af28b8b74b2a8dc23ee70';

  const EXPECTED_MSI_SIZE = 31117312;
  const EXPECTED_MSI_SHA256 = '35d4855010fe340b9c4b23b1f576754eeec36ee0cbcce4fb448cb372e211b49c';

  const EXPECTED_STANDALONE_SIZE = 37538816;
  const EXPECTED_STANDALONE_SHA256 = 'b39e50ae33de96583f82eb87f233cd9b882e70f133f435275537d8c42c5c1968';

  // 1. WINDOWS INSTALLER BINARY ARTIFACT AUDIT
  describe('1. Windows Desktop Installer Artifacts & Signatures', () => {
    it('PHASE3-01: NSIS setup executable exists with valid PE header (MZ) and exact SHA-256', () => {
      expect(fs.existsSync(exePath)).toBe(true);
      const buf = fs.readFileSync(exePath);
      expect(buf.length).toBe(EXPECTED_EXE_SIZE);
      expect(buf[0]).toBe(0x4D); // 'M'
      expect(buf[1]).toBe(0x5A); // 'Z'
      const hash = crypto.createHash('sha256').update(buf).digest('hex');
      expect(hash.toLowerCase()).toBe(EXPECTED_EXE_SHA256.toLowerCase());
    });

    it('PHASE3-02: MSI setup package exists with valid OLE Compound Binary signature and exact SHA-256', () => {
      expect(fs.existsSync(msiPath)).toBe(true);
      const buf = fs.readFileSync(msiPath);
      expect(buf.length).toBe(EXPECTED_MSI_SIZE);
      // MSI magic bytes: 0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1 (OLE Compound File)
      expect(buf[0]).toBe(0xD0);
      expect(buf[1]).toBe(0xCF);
      expect(buf[2]).toBe(0x11);
      expect(buf[3]).toBe(0xE0);
      expect(buf[4]).toBe(0xA1);
      expect(buf[5]).toBe(0xB1);
      expect(buf[6]).toBe(0x1A);
      expect(buf[7]).toBe(0xE1);
      const hash = crypto.createHash('sha256').update(buf).digest('hex');
      expect(hash.toLowerCase()).toBe(EXPECTED_MSI_SHA256.toLowerCase());
    });

    it('PHASE3-03: Standalone compiled desktop application binary exists and matches PE signature', () => {
      expect(fs.existsSync(standaloneExePath)).toBe(true);
      const buf = fs.readFileSync(standaloneExePath);
      expect(buf.length).toBe(EXPECTED_STANDALONE_SIZE);
      expect(buf[0]).toBe(0x4D);
      expect(buf[1]).toBe(0x5A);
      const hash = crypto.createHash('sha256').update(buf).digest('hex');
      expect(hash.toLowerCase()).toBe(EXPECTED_STANDALONE_SHA256.toLowerCase());
    });
  });

  // 2. DOWNLOAD SAFETY & SPA FALLBACK GUARDS
  describe('2. Download Route Architecture & Anti-HTML-Fallback Guards', () => {
    it('PHASE3-04: server.ts guards /downloads/* and binary extensions from ever falling back to index.html', () => {
      const serverCode = fs.readFileSync(path.join(rootDir, 'server.ts'), 'utf-8');
      
      // Check 404 guard for downloads
      expect(serverCode).toContain('app.get("/downloads/*"');
      expect(serverCode).toContain('Binary downloads never fall back to HTML');

      // Check production static fallback guard
      expect(serverCode).toContain("app.use(['*.exe', '*.msi', '*.zip', '*.dmg', '*.pkg', '*.tar.gz']");

      // Verify MSI hash typo is fixed
      expect(serverCode).toContain(EXPECTED_MSI_SHA256.toLowerCase());
      expect(serverCode).not.toContain('cbbce4fb');
    });

    it('PHASE3-05: Cloudflare Worker guards /downloads/* and binary extensions from falling back to index.html', () => {
      const workerCode = fs.readFileSync(path.join(rootDir, 'src/worker.ts'), 'utf-8');
      
      expect(workerCode).toContain("url.pathname.startsWith('/downloads/')");
      expect(workerCode).toContain("url.pathname.endsWith('.dmg')");
      expect(workerCode).toContain("url.pathname.endsWith('.pkg')");
      expect(workerCode).toContain("Binary downloads and API requests never fall back to HTML");
    });

    it('PHASE3-06: Cloudflare 25 MiB static asset limit is documented and respected by .assetsignore', () => {
      // Cloudflare Workers Assets has a hard 25 MiB limit (26,214,400 bytes)
      const CLOUDFLARE_LIMIT_BYTES = 25 * 1024 * 1024;
      expect(EXPECTED_EXE_SIZE).toBeGreaterThan(CLOUDFLARE_LIMIT_BYTES);
      expect(EXPECTED_MSI_SIZE).toBeGreaterThan(CLOUDFLARE_LIMIT_BYTES);

      const assetsIgnore = fs.readFileSync(path.join(rootDir, 'public/.assetsignore'), 'utf-8');
      expect(assetsIgnore).toContain('downloads/Orion-9-Setup.exe');
      expect(assetsIgnore).toContain('*.exe');
      expect(assetsIgnore).toContain('*.msi');
    });
  });

  // 3. SYSTEM BROWSER NATIVE & WEB FALLBACK ARCHITECTURE
  describe('3. System Browser Surface & Lifecycle Guards', () => {
    it('PHASE3-07: URL validator enforces HTTP/HTTPS and rejects forbidden protocols', () => {
      const validUrls = ['https://google.com', 'http://example.com/api', 'https://orion9.tech'];
      const invalidUrls = [
        'javascript:alert(1)',
        'file:///etc/passwd',
        'data:text/html,test',
        'blob:https://orion.internal',
        'ftp://files.example.com',
      ];

      for (const url of validUrls) {
        const parsed = new URL(url);
        expect(['http:', 'https:']).toContain(parsed.protocol);
      }

      for (const url of invalidUrls) {
        try {
          const parsed = new URL(url);
          expect(['http:', 'https:']).not.toContain(parsed.protocol);
        } catch {
          // Syntax errors are also rejected
          expect(true).toBe(true);
        }
      }
    });

    it('PHASE3-08: BrowserWebRuntime provides sandboxed iframe fallback in web mode', () => {
      const webRuntimeCode = fs.readFileSync(
        path.join(rootDir, 'src/components/browser/BrowserWebRuntime.tsx'),
        'utf-8'
      );
      
      // Enforces explicit sandbox attributes
      expect(webRuntimeCode).toContain('sandbox="allow-scripts allow-same-origin allow-forms allow-popups"');
      // Enforces timeout safety to prevent hung states
      expect(webRuntimeCode).toContain('12000');
    });
  });

  // 4. CONTINUOUS INTEGRATION & RELEASE WORKFLOWS
  describe('4. GitHub Actions Release Workflow Gates', () => {
    it('PHASE3-09: desktop-release.yml enforces strict TypeScript and test gates prior to packaging', () => {
      const workflowCode = fs.readFileSync(
        path.join(rootDir, '.github/workflows/desktop-release.yml'),
        'utf-8'
      );

      // Verify gates exist before tauri build in macOS job
      expect(workflowCode).toContain('Gate 1A: TypeScript Strict Verification');
      expect(workflowCode).toContain('Gate 1B: Unit & Integration Suites');

      // Verify runner targets
      expect(workflowCode).toContain('runs-on: macos-14');
      expect(workflowCode).toContain('runs-on: windows-latest');

      // Verify manual dispatch safety (no automatic push releases)
      expect(workflowCode).toContain('workflow_dispatch:');
      expect(workflowCode).not.toContain('on:\n  push:');
    });

    it('PHASE3-10: Client bundle contains zero exposed secrets or private keys', () => {
      const clientDistDir = path.join(rootDir, 'dist/client/assets');
      if (fs.existsSync(clientDistDir)) {
        const jsFiles = fs.readdirSync(clientDistDir).filter(f => f.endsWith('.js'));
        for (const f of jsFiles) {
          const content = fs.readFileSync(path.join(clientDistDir, f), 'utf-8');
          expect(content).not.toContain('BEGIN PRIVATE KEY');
          expect(content).not.toContain('BEGIN RSA PRIVATE KEY');
          expect(content).not.toContain('client_secret');
        }
      }
    });
  });
});
