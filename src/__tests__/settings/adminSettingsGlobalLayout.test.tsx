import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Orion-9 Admin & Settings Global Layout Architecture', () => {
  const settingsPath = path.resolve(__dirname, '../../components/Settings.tsx');
  const adminDir = path.resolve(__dirname, '../../components/admin');
  const settingsDir = path.resolve(__dirname, '../../components/settings');

  it('1. Settings.tsx renders Admin console content region as the sole vertical scroll owner', () => {
    const settingsSource = fs.readFileSync(settingsPath, 'utf-8');
    expect(settingsSource).toContain('min-h-0 w-full min-w-0 overflow-y-auto overflow-x-hidden custom-scrollbar bg-[#12151a]');
    expect(settingsSource).toContain('Privileged Session Active');
  });

  it('2. Admin page roots do not contain artificial narrow max-w-3xl or max-w-6xl constraints', () => {
    const brandingSource = fs.readFileSync(path.join(adminDir, 'AdminBranding.tsx'), 'utf-8');
    const settingsAdminSource = fs.readFileSync(path.join(adminDir, 'AdminSettings.tsx'), 'utf-8');

    expect(brandingSource).not.toContain('max-w-3xl');
    expect(brandingSource).toContain('w-full max-w-[1440px] mx-auto');

    expect(settingsAdminSource).not.toContain('max-w-6xl');
    expect(settingsAdminSource).toContain('w-full max-w-[1440px] mx-auto');
  });

  it('3. Admin components use fluid root layout containers (max-w-[1440px] mx-auto)', () => {
    const adminFiles = [
      'AdminOverview.tsx',
      'AdminControlCenter.tsx',
      'AdminUsers.tsx',
      'AdminOrganizations.tsx',
      'AdminRoles.tsx',
      'AdminBranding.tsx',
      'AdminWallpaperStudio.tsx',
      'AdminAuditLogs.tsx',
      'AdminDemoData.tsx',
      'AdminSettings.tsx',
      'AdminDatabaseHealth.tsx',
    ];

    adminFiles.forEach(file => {
      const filePath = path.join(adminDir, file);
      if (fs.existsSync(filePath)) {
        const source = fs.readFileSync(filePath, 'utf-8');
        expect(source, `${file} should have fluid max-w-[1440px] mx-auto container`).toContain('max-w-[1440px]');
      }
    });
  });

  it('4. Admin components do not have root-level duplicate overflow-y-auto or flex-1 h-full scroll stealing', () => {
    const demoDataSource = fs.readFileSync(path.join(adminDir, 'AdminDemoData.tsx'), 'utf-8');
    const dbHealthSource = fs.readFileSync(path.join(adminDir, 'AdminDatabaseHealth.tsx'), 'utf-8');
    const adminSettingsSource = fs.readFileSync(path.join(adminDir, 'AdminSettings.tsx'), 'utf-8');

    expect(demoDataSource).not.toContain('flex-1 p-6 space-y-6 overflow-y-auto');
    expect(dbHealthSource).not.toContain('flex-1 flex flex-col h-full overflow-y-auto');
    expect(adminSettingsSource).not.toContain('h-full flex flex-col p-4 md:p-6 overflow-y-auto');
  });

  it('5. Settings panels (Appearance, Personalization, Accessibility, Language, Time/Date) use fluid w-full roots', () => {
    const panels = [
      'AppearanceSettingsPanel.tsx',
      'PersonalizationSettingsPanel.tsx',
      'AccessibilitySettingsPanel.tsx',
      'LanguageSettingsPanel.tsx',
      'TimeDateSettingsPanel.tsx',
    ];

    panels.forEach(file => {
      const filePath = path.join(settingsDir, file);
      if (fs.existsSync(filePath)) {
        const source = fs.readFileSync(filePath, 'utf-8');
        expect(source, `${file} should not have max-w-5xl or narrow rigid container`).not.toContain('max-w-5xl');
        expect(source, `${file} should have fluid root`).toContain('w-full space-y-');
      }
    });
  });
});
