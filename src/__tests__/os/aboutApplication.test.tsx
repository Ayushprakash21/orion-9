import { describe, it, expect } from 'vitest';
import { ORION_REGISTRY } from '../../os/OrionApplicationRegistry';
import { ORION_COMPONENT_MAP } from '../../os/OrionComponentMap';
import { About } from '../../components/About';
import { Login } from '../../components/auth/Login';
import { brandingRepository } from '../../repositories/BrandingRepository';

describe('ORION-9 Canonical OS About Application & Origin/Creator Experience', () => {
  it('1. About is registered in ORION_REGISTRY as a platform app', () => {
    const aboutApp = ORION_REGISTRY['about'];
    expect(aboutApp).toBeDefined();
    expect(aboutApp.name).toBe('About ORION');
    expect(aboutApp.route).toBe('/about');
  });

  it('2. About is mapped in ORION_COMPONENT_MAP to About component', () => {
    const Component = ORION_COMPONENT_MAP['about'];
    expect(Component).toBe(About);
  });

  it('3. Login screen source code has ZERO website footer links (Privacy | Terms | Help)', () => {
    const loginCode = Login.toString();
    expect(loginCode).not.toContain('Privacy | Terms | Help');
    expect(loginCode).not.toContain('href="#"');
  });

  it('4. About application source code contains prominent Creator Attribution and Quote', () => {
    const aboutCode = About.toString();
    expect(aboutCode).toContain('Created by');
    expect(aboutCode).toContain('creatorName');
    expect(aboutCode).toContain('creatorQuote');
  });

  it('5. About application includes all 14 native sidebar navigation sections', () => {
    const aboutCode = About.toString();
    expect(aboutCode).toContain('Overview');
    expect(aboutCode).toContain('Why Orion-9');
    expect(aboutCode).toContain('The Idea');
    expect(aboutCode).toContain('Created By');
    expect(aboutCode).toContain('Principles');
    expect(aboutCode).toContain('System Architecture');
    expect(aboutCode).toContain('Evolution');
    expect(aboutCode).toContain("What's New");
    expect(aboutCode).toContain('System Information');
    expect(aboutCode).toContain('Help & Documentation');
    expect(aboutCode).toContain('Privacy');
    expect(aboutCode).toContain('Terms');
    expect(aboutCode).toContain('Licenses');
    expect(aboutCode).toContain('Support');
  });

  it('6. About application includes 7 Principles of ORION-9 and System Architectural Model', () => {
    const aboutCode = About.toString();
    expect(aboutCode).toContain('One Operating Environment');
    expect(aboutCode).toContain('Data Connected');
    expect(aboutCode).toContain('Events Drive Awareness');
    expect(aboutCode).toContain('AI Governed');
    expect(aboutCode).toContain('Humans in Control');
    expect(aboutCode).toContain('Decisions Create Outcomes');
    expect(aboutCode).toContain('System Learns');
    expect(aboutCode).toContain('14 CORE ORION ENGINES');
  });

  it('7. Branding repository default configuration includes Creator Identity properties', () => {
    const branding = brandingRepository.getBrandingSync();
    expect(branding.creatorName).toBe('Ayush Prakash');
    expect(branding.creatorTitle).toBe('Creator & Supply Chain OS Architect');
    expect(branding.creatorQuote).toBe('What if the supply chain had an operating system?');
    expect(branding.founderNote).toBeDefined();
  });
});
