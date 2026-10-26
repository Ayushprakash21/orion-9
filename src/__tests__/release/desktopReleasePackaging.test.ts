import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

describe('ORION-9 Desktop Release Packaging & Multi-Platform Distribution Suite', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const nsisInstallerPath = path.join(rootDir, 'src-tauri/target/release/bundle/nsis/Orion-9_9.0.0_x64-setup.exe');
  const publicInstallerPath = path.join(rootDir, 'public/downloads/Orion-9-Setup.exe');
  const tauriConfigPath = path.join(rootDir, 'src-tauri/tauri.conf.json');
  const entitlementsPath = path.join(rootDir, 'src-tauri/Entitlements.plist');
  const icnsPath = path.join(rootDir, 'src-tauri/icons/icon.icns');
  const icoPath = path.join(rootDir, 'src-tauri/icons/icon.ico');
  const workflowPath = path.join(rootDir, '.github/workflows/desktop-release.yml');

  const EXPECTED_WINDOWS_SHA256 = 'e2dfeb480522b9da077bb58e0954d6d8e09f1023fb6af28b8b74b2a8dc23ee70';
  const EXPECTED_WINDOWS_SIZE = 30336791;

  it('RELEASE-01: Windows NSIS installer artifact exists and matches verified SHA-256', () => {
    expect(fs.existsSync(nsisInstallerPath)).toBe(true);
    
    const buffer = fs.readFileSync(nsisInstallerPath);
    expect(buffer.length).toBe(EXPECTED_WINDOWS_SIZE);

    // Verify PE executable magic bytes "MZ" (0x4D, 0x5A)
    expect(buffer[0]).toBe(0x4D); // 'M'
    expect(buffer[1]).toBe(0x5A); // 'Z'

    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    expect(hash.toLowerCase()).toBe(EXPECTED_WINDOWS_SHA256.toLowerCase());
  });

  it('RELEASE-02: Public download copy matches build artifact with zero byte alteration', () => {
    expect(fs.existsSync(publicInstallerPath)).toBe(true);

    const buffer = fs.readFileSync(publicInstallerPath);
    expect(buffer.length).toBe(EXPECTED_WINDOWS_SIZE);

    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    expect(hash.toLowerCase()).toBe(EXPECTED_WINDOWS_SHA256.toLowerCase());
  });

  it('RELEASE-03: .assetsignore guards Cloudflare from crashing on >25MB binary', () => {
    const assetsIgnorePath = path.join(rootDir, 'public/.assetsignore');
    expect(fs.existsSync(assetsIgnorePath)).toBe(true);
    
    const content = fs.readFileSync(assetsIgnorePath, 'utf-8');
    expect(content).toContain('downloads/Orion-9-Setup.exe');
    expect(content).toContain('*.exe');
  });

  it('RELEASE-04: Tauri 2 configuration specifies multi-platform bundles for Windows and macOS', () => {
    expect(fs.existsSync(tauriConfigPath)).toBe(true);

    const config = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf-8'));
    expect(config.productName).toBe('Orion-9');
    expect(config.version).toBe('9.0.0');
    expect(config.identifier).toBe('tech.orion9.desktop');

    // Windows bundle configuration
    expect(config.bundle.windows).toBeDefined();
    expect(config.bundle.windows.digestAlgorithm).toBe('sha256');

    // macOS bundle configuration
    expect(config.bundle.macOS).toBeDefined();
    expect(config.bundle.macOS.minimumSystemVersion).toBe('10.15');
    expect(config.bundle.macOS.entitlements).toBe('Entitlements.plist');
    expect(config.bundle.macOS.dmg).toBeDefined();
    expect(config.bundle.macOS.dmg.windowSize.width).toBeGreaterThanOrEqual(600);
    expect(config.bundle.macOS.dmg.appPosition).toBeDefined();
    expect(config.bundle.macOS.dmg.applicationFolderPosition).toBeDefined();
  });

  it('RELEASE-05: Apple hardened runtime Entitlements.plist is present and configured', () => {
    expect(fs.existsSync(entitlementsPath)).toBe(true);

    const content = fs.readFileSync(entitlementsPath, 'utf-8');
    expect(content).toContain('com.apple.security.cs.allow-jit');
    expect(content).toContain('com.apple.security.network.client');
    expect(content).toContain('com.apple.security.network.server');
  });

  it('RELEASE-06: High-resolution branded icons are present for both macOS (.icns) and Windows (.ico)', () => {
    expect(fs.existsSync(icnsPath)).toBe(true);
    expect(fs.statSync(icnsPath).size).toBeGreaterThan(100000); // 667KB ICNS

    expect(fs.existsSync(icoPath)).toBe(true);
    expect(fs.statSync(icoPath).size).toBeGreaterThan(20000); // 48KB ICO
  });

  it('RELEASE-07: Cargo.toml contains zero Windows-exclusive dependencies preventing macOS compilation', () => {
    const cargoTomlPath = path.join(rootDir, 'src-tauri/Cargo.toml');
    const content = fs.readFileSync(cargoTomlPath, 'utf-8');

    // Ensures dependencies are cross-platform Tauri 2 crates
    expect(content).toContain('tauri = { version = "2"');
    expect(content).not.toContain('windows-sys');
    expect(content).not.toContain('winapi');
  });

  it('RELEASE-08: GitHub Actions release workflow supports both Windows and macOS runners', () => {
    expect(fs.existsSync(workflowPath)).toBe(true);

    const workflowContent = fs.readFileSync(workflowPath, 'utf-8');
    
    // Windows builder
    expect(workflowContent).toContain('runs-on: windows-latest');
    expect(workflowContent).toContain('npx tauri build --bundles nsis,msi');

    // macOS builder
    expect(workflowContent).toContain('runs-on: macos-14');
    expect(workflowContent).toContain('targets: aarch64-apple-darwin,x86_64-apple-darwin');
    expect(workflowContent).toContain('npx tauri build --target universal-apple-darwin --bundles app,dmg');

    // Safe execution - No auto publishing
    expect(workflowContent).toContain('actions/upload-artifact@v4');
    expect(workflowContent).not.toContain('softprops/action-gh-release@v1: true');
  });
});
