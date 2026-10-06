import { describe, it, expect } from 'vitest';
import React from 'react';
import fs from 'fs';
import path from 'path';
import { Settings } from '../../components/Settings';
import { LanguageSettingsPanel } from '../../components/settings/LanguageSettingsPanel';
import { TimeDateSettingsPanel } from '../../components/settings/TimeDateSettingsPanel';
import { MemoryRouter } from 'react-router-dom';

describe('ORION-9 Settings Information Architecture Redesign', () => {
  it('1. My Account contains zero language panel or language pack controls', () => {
    const code = Settings.toString();
    // Verify LanguageSettingsPanel is not rendered in My Account case
    expect(code).not.toContain('case "account": return <LanguageSettingsPanel');
  });

  it('2. Language & Region and Time & Date exist in sidebar navigation sections', () => {
    const code = Settings.toString();
    expect(code).toContain('Language & Region');
    expect(code).toContain('Time & Date');
    expect(code).toContain('language_region');
    expect(code).toContain('time_date');
  });

  it('3. Language & Region panel renders Interface Language, Region, Formats, and Installed Packs', () => {
    const code = LanguageSettingsPanel.toString();
    expect(code).toContain('Interface Language');
    expect(code).toContain('Change Language');
    expect(code).toContain('Regional Formats');
    expect(code).toContain('Installed Language Packs');
    expect(code).toContain('Advanced / Offline Language Packages');
  });

  it('4. Time & Date panel renders Live System Clock, Timezone, 24-Hour Clock, and World Clocks', () => {
    const filePath = path.resolve(__dirname, '../../components/settings/TimeDateSettingsPanel.tsx');
    const source = fs.readFileSync(filePath, 'utf-8');

    expect(source).toContain('System Clock');
    expect(source).toContain('Automatic Date & Time');
    expect(source).toContain('24-Hour Clock');
    expect(source).toContain('World Clocks');
    expect(source).toContain('London');
    expect(source).toContain('Tokyo');
    expect(source).toContain('Mumbai');
  });

  it('5. Time & Date contains zero language-pack or translation coverage references', () => {
    const code = TimeDateSettingsPanel.toString();
    expect(code.includes('languagePack')).toBe(false);
    expect(code.includes('translationCoverage')).toBe(false);
    expect(code.includes('orionlang')).toBe(false);
  });
});
