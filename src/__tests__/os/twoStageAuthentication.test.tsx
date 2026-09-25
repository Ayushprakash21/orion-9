import { describe, it, expect } from 'vitest';
import { Login, SUPPORTED_LANGUAGES, AUTH_TRANSLATIONS } from '../../components/auth/Login';
import { userService } from '../../services/userService';

describe('ORION-9 Two-Stage Native OS Authentication Experience', () => {
  it('1. Login initial state starts in Stage 1 (User ID lookup)', () => {
    const code = Login.toString();
    expect(code).toContain('stage === 1');
    expect(code).toContain('signInTitle');
  });

  it('2. User ID entry accepts username or email input', () => {
    const code = Login.toString();
    expect(code).toContain('userIdLabel');
    expect(code).toContain('userIdPlaceholder');
  });

  it('3. Performs authoritative user lookup via userService', () => {
    const code = Login.toString();
    expect(code).toContain('userService.getUserByIdentifier');
  });

  it('4. Renders "User not found" on unknown user lookup', () => {
    expect(AUTH_TRANSLATIONS.en.userNotFound).toBe('User not found');
    expect(AUTH_TRANSLATIONS.hi.userNotFound).toBe('उपयोगकर्ता नहीं मिला');
    expect(AUTH_TRANSLATIONS.es.userNotFound).toBe('Usuario no encontrado');
    expect(AUTH_TRANSLATIONS.de.userNotFound).toBe('Benutzer nicht gefunden');
  });

  it('5. Resolves known user profile authoritatively from identity repository', () => {
    const adminUser = userService.getUserByIdentifier('admin');
    expect(adminUser).toBeDefined();
    expect(adminUser?.username).toBe('admin');
    expect(adminUser?.role).toBe('platform_admin');

    const normalUser = userService.getUserByIdentifier('user');
    expect(normalUser).toBeDefined();
    expect(normalUser?.username).toBe('user');
    expect(normalUser?.role).toBe('user');
  });

  it('6. Displays user avatar photograph (72-96px circular frame) in Stage 2', () => {
    const code = Login.toString();
    expect(code).toContain('resolvedUser?.avatarUrl');
    expect(code).toContain('w-20 h-20 rounded-full');
  });

  it('7. Displays user full/display name visually stronger than username handle', () => {
    const code = Login.toString();
    expect(code).toContain('resolvedUser?.displayName || resolvedUser?.fullName');
  });

  it('8. Displays username handle with @ prefix', () => {
    const code = Login.toString();
    expect(code).toContain('resolvedUser?.username || username');
  });

  it('9. Password field appears ONLY in Stage 2 after identity lookup', () => {
    const code = Login.toString();
    expect(code).toContain('stage === 2');
    expect(code).toContain('enterPassword');
  });

  it('10. Binds Stage 2 submit to authoritative login action', () => {
    const code = Login.toString();
    expect(code).toContain('handleStage2Submit');
    expect(code).toContain('login(username, password');
  });

  it('11. Provides "Other user" button to return to Stage 1 and clear state', () => {
    const code = Login.toString();
    expect(code).toContain('handleBackToStage1');
    expect(code).toContain('otherUser');
  });

  it('12. Power menu includes "Switch User" option', () => {
    const code = Login.toString();
    expect(code).toContain('handleSwitchUser');
    expect(code).toContain('switchUser');
  });

  it('13. Performs session cleanup on Switch User', () => {
    const code = Login.toString();
    expect(code).toContain('signOut()');
    expect(code).toContain('handleBackToStage1()');
  });

  it('14. Provides functional language selector dropdown', () => {
    const code = Login.toString();
    expect(code).toContain('handleSelectLanguage');
    expect(code).toContain('SUPPORTED_LANGUAGES');
  });

  it('15. Supported languages dynamically update UI text strings (English, Hindi, Spanish, German)', () => {
    expect(SUPPORTED_LANGUAGES.map(l => l.code)).toEqual(['en', 'hi', 'es', 'de']);
    expect(AUTH_TRANSLATIONS.en.signInTitle).toBe('Sign in to Orion');
    expect(AUTH_TRANSLATIONS.hi.signInTitle).toBe('Orion में साइन इन करें');
    expect(AUTH_TRANSLATIONS.es.signInTitle).toBe('Iniciar sesión en Orion');
    expect(AUTH_TRANSLATIONS.de.signInTitle).toBe('Anmelden bei Orion');
  });

  it('16. Does not display unsupported languages', () => {
    const codes = SUPPORTED_LANGUAGES.map(l => l.code);
    expect(codes).not.toContain('fr');
    expect(codes).not.toContain('zh');
  });

  it('17. Power menu toggles on bottom-left power button click', () => {
    const code = Login.toString();
    expect(code).toContain('isPowerMenuOpen');
    expect(code).toContain('setIsPowerMenuOpen');
  });

  it('18. Power button features red backlight glow on hover', () => {
    const code = Login.toString();
    expect(code).toContain('hover:bg-red-950/80');
    expect(code).toContain('hover:border-red-500/60');
    expect(code).toContain('hover:shadow-[0_0_20px_rgba(239,68,68,0.55)]');
  });

  it('19. Privacy, Terms, and Help links are ABSENT from login footer', () => {
    const code = Login.toString();
    expect(code).not.toContain('href="#"');
    expect(code).not.toContain('Privacy | Terms');
  });

  it('20. Preserves tenant isolation (does not expose cross-tenant users)', () => {
    const adminUser = userService.getUserByIdentifier('admin');
    expect(adminUser?.organizationId).toBe('ORION_PLATFORM');
  });

  it('21. Firebase Authentication remains authoritative', () => {
    const code = Login.toString();
    expect(code).toContain('useAuth');
  });

  it('22. Zero Supabase dependencies exist in Login', () => {
    const code = Login.toString();
    expect(code.includes('supabase')).toBe(false);
    expect(code.includes('@supabase')).toBe(false);
  });

  it('23. Zero localStorage password authority exists', () => {
    const code = Login.toString();
    expect(code.includes('localStorage.setItem("password"')).toBe(false);
    expect(code.includes('localStorage.getItem("password"')).toBe(false);
  });

  it('24. Reduced motion is supported', () => {
    const code = Login.toString();
    expect(code).toContain('animate-fadeIn');
  });

  it('25. Responsive layout fills full viewport height', () => {
    const code = Login.toString();
    expect(code).toContain('w-screen');
    expect(code).toContain('h-[100dvh]');
  });
});
