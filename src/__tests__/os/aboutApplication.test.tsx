import { describe, it, expect } from 'vitest';
import { ORION_REGISTRY } from '../../os/OrionApplicationRegistry';
import { ORION_COMPONENT_MAP } from '../../os/OrionComponentMap';
import { About } from '../../components/About';
import { Login } from '../../components/auth/Login';

describe('ORION-9 Canonical OS About Application & Login Screen Footer Cleanup', () => {
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

  it('4. About application source code contains canonical Privacy Policy and Terms of Service', () => {
    const aboutCode = About.toString();
    expect(aboutCode).toContain('Privacy Policy');
    expect(aboutCode).toContain('Terms of Service');
    expect(aboutCode).toContain('Open Source Licenses');
  });

  it('5. About application includes System Information, Build SHA, and Environment metadata', () => {
    const aboutCode = About.toString();
    expect(aboutCode).toContain('System Information');
    expect(aboutCode).toContain('Build Commit Git SHA');
    expect(aboutCode).toContain('Firebase Authentication');
  });
});
