import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { SUPPORTED_LOCALES, SUPPORTED_LOCALE_CODES } from '../../i18n';

describe('ORION-9 Settings Language Panel Responsive Layout & Overflow Protection', () => {
  const settingsPath = path.resolve(__dirname, '../../components/Settings.tsx');
  const splitLayoutPath = path.resolve(__dirname, '../../components/settings/OrionSettingsSplitLayout.tsx');

  const settingsSource = fs.readFileSync(settingsPath, 'utf-8');
  const splitLayoutSource = fs.readFileSync(splitLayoutPath, 'utf-8');

  it('1. World language registry contains all 40 global languages', () => {
    const locales = Object.values(SUPPORTED_LOCALES);
    expect(locales.length).toBe(40);
    expect(SUPPORTED_LOCALE_CODES.length).toBe(40);
    
    expect(SUPPORTED_LOCALE_CODES).toContain('en');
    expect(SUPPORTED_LOCALE_CODES).toContain('hi');
    expect(SUPPORTED_LOCALE_CODES).toContain('es');
    expect(SUPPORTED_LOCALE_CODES).toContain('fr');
    expect(SUPPORTED_LOCALE_CODES).toContain('de');
    expect(SUPPORTED_LOCALE_CODES).toContain('zh');
    expect(SUPPORTED_LOCALE_CODES).toContain('ja');
    expect(SUPPORTED_LOCALE_CODES).toContain('ar');
  });

  it('2. Settings component implements responsive grid and scroll containment for language selection', () => {
    // Grid layout with responsive column counts
    expect(settingsSource).toContain('grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4');
    // Scroll containment & height bounding
    expect(settingsSource).toContain('max-h-56 overflow-y-auto');
    // Prevents flex container expansion
    expect(settingsSource).toContain('min-w-0');
    // Maps over languages from useI18n
    expect(settingsSource).toContain('languages.map');
  });

  it('3. OrionSettingsSplitLayout enforces min-w-0 and overflow isolation on both primary and secondary panes', () => {
    expect(splitLayoutSource).toContain('min-w-0');
    expect(splitLayoutSource).toContain('overflow-x-hidden');
    expect(splitLayoutSource).toContain('overflow-y-auto');
  });

  it('4. Language buttons format with native names, ISO badges and truncate protection', () => {
    expect(settingsSource).toContain('{lang.nativeName}');
    expect(settingsSource).toContain('{lang.code}');
    expect(settingsSource).toContain('truncate');
    expect(settingsSource).toContain('uppercase');
  });
});
