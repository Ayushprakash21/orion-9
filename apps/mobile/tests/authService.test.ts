import { auth } from '../src/services/auth';
import { storage } from '../src/storage';
import { api } from '../src/services/api';

describe('Orion-9 Mobile Auth Service', () => {
  beforeEach(async () => {
    await auth.signOut();
    await auth.setEnvironment('DEMO');
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await auth.signOut();
  });

  it('authenticates admin Elena Rostova in DEMO mode', async () => {
    const session = await auth.signIn('admin', 'demo123');
    expect(session).toBeDefined();
    expect(session.user.fullName).toBe('Platform Admin');
    expect(session.user.role).toBe('platform_admin');
    expect(session.environment).toBe('DEMO');
    expect(session.token).toMatch(/^orion_/);

    const savedSession = await auth.getSession();
    expect(savedSession?.user.username).toBe('admin');
  });

  it('authenticates operator in DEMO mode', async () => {
    const session = await auth.signIn('user', 'demo123');
    expect(session).toBeDefined();
    expect(session.user.fullName).toBe('Elena Rostova');
    expect(session.user.role).toBe('user');
    expect(session.environment).toBe('DEMO');
  });

  it('rejects invalid password in DEMO mode', async () => {
    await expect(auth.signIn('admin', 'wrong_pass')).rejects.toThrow(
      'Invalid demo credentials'
    );
  });

  it('rejects unknown user in DEMO mode', async () => {
    await expect(auth.signIn('unknown_user', 'demo123')).rejects.toThrow(
      'Invalid demo credentials'
    );
  });

  it('strictly rejects demo credentials when LIVE environment is configured', async () => {
    await auth.setEnvironment('LIVE');
    await expect(auth.signIn('admin', 'demo123')).rejects.toThrow(
      'Demo credentials are strictly prohibited in the LIVE environment.'
    );
  });

  it('authenticates live user when server returns verified session in LIVE mode', async () => {
    await auth.setEnvironment('LIVE');
    const mockPost = jest.spyOn(api, 'post').mockResolvedValueOnce({
      success: true,
      token: 'genuine-firebase-id-token-abc.xyz',
      user: {
        id: 'usr-live-99',
        username: 'ops.director',
        email: 'ops@enterprise-corp.com',
        fullName: 'Operations Director',
        role: 'platform_admin',
        organizationId: 'org-enterprise-1',
        status: 'active',
      },
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    });

    const session = await auth.signIn('ops@enterprise-corp.com', 'SecurePass2026!');
    expect(session).toBeDefined();
    expect(session.environment).toBe('LIVE');
    expect(session.token).toBe('genuine-firebase-id-token-abc.xyz');
    expect(session.user.role).toBe('platform_admin');
    expect(mockPost).toHaveBeenCalledWith(
      '/api/auth/login',
      { identifier: 'ops@enterprise-corp.com', password: 'SecurePass2026!' },
      { skipAuth: true }
    );
  });

  it('never fabricates tokens when server rejects credentials in LIVE mode', async () => {
    await auth.setEnvironment('LIVE');
    jest.spyOn(api, 'post').mockRejectedValueOnce(new Error('Invalid email or password.'));

    await expect(auth.signIn('user@live.com', 'bad_pass')).rejects.toThrow(
      'Invalid email or password.'
    );

    const session = await auth.getSession();
    expect(session).toBeNull();
  });

  it('enforces bidirectional environment session isolation', async () => {
    // 1. Sign in under DEMO
    await auth.setEnvironment('DEMO');
    await auth.signIn('admin', 'demo123');
    expect(await auth.getSession()).not.toBeNull();

    // 2. Switch to LIVE -> DEMO session must be wiped
    await auth.setEnvironment('LIVE');
    expect(await auth.getSession()).toBeNull();

    // 3. Switch back to DEMO -> session remains null until explicit sign in
    await auth.setEnvironment('DEMO');
    expect(await auth.getSession()).toBeNull();
  });

  it('clears expired session automatically', async () => {
    await auth.setEnvironment('DEMO');
    const session = await auth.signIn('admin', 'demo123');
    const expiredSession = {
      ...session,
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    };
    await storage.setJson('orion_auth_session', expiredSession);

    const retrieved = await auth.getSession();
    expect(retrieved).toBeNull();
  });

  it('clears session on sign out', async () => {
    await auth.signIn('admin', 'demo123');
    let session = await auth.getSession();
    expect(session).not.toBeNull();

    await auth.signOut();
    session = await auth.getSession();
    expect(session).toBeNull();
  });
});
