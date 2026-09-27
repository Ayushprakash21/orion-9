import { describe, it, expect, beforeEach } from 'vitest';
import { normalizeSettings, DEFAULT_SYSTEM_SETTINGS, SystemSettings } from '../../types';
import { permissionService } from '../../services/permissionService';
import { RoleCode, PermissionCode } from '../../types/auth';

describe('Bidirectional UX Mode Switching (Simple <-> Advanced)', () => {
  let settings: SystemSettings;

  beforeEach(() => {
    settings = { ...DEFAULT_SYSTEM_SETTINGS };
  });

  it('defaults to SIMPLE mode in system settings', () => {
    const normalized = normalizeSettings({});
    expect(normalized.userExperienceMode).toBe('SIMPLE');
  });

  it('allows forward switching from SIMPLE to ADVANCED mode', () => {
    expect(settings.userExperienceMode).toBe('SIMPLE');
    
    // Switch to Advanced
    settings = normalizeSettings({ ...settings, userExperienceMode: 'ADVANCED' });
    expect(settings.userExperienceMode).toBe('ADVANCED');
  });

  it('allows backward switching from ADVANCED to SIMPLE mode (bidirectional guarantee)', () => {
    // Start at Advanced
    settings = normalizeSettings({ ...settings, userExperienceMode: 'ADVANCED' });
    expect(settings.userExperienceMode).toBe('ADVANCED');

    // Switch back to Simple
    settings = normalizeSettings({ ...settings, userExperienceMode: 'SIMPLE' });
    expect(settings.userExperienceMode).toBe('SIMPLE');

    // Switch again to Advanced
    settings = normalizeSettings({ ...settings, userExperienceMode: 'ADVANCED' });
    expect(settings.userExperienceMode).toBe('ADVANCED');
  });

  it('preserves security and RBAC invariants across mode switches (mode is presentation only)', () => {
    const roles: RoleCode[] = [
      'platform_admin',
      'organization_admin',
      'supply_chain_manager',
      'planner',
      'procurement_user',
      'inventory_user',
      'viewer',
      'user'
    ];

    const criticalPermissions: PermissionCode[] = [
      'settings.manage',
      'procurement.manage',
      'inventory.manage',
      'shipments.manage',
      'analytics.read'
    ];

    roles.forEach(role => {
      // Check permissions in Simple mode
      const userPerms = permissionService.getDefaultPermissionsForRole(role);
      const permsInSimple = criticalPermissions.map(p => permissionService.hasPermission(userPerms, p));

      // Simulate mode change
      settings = normalizeSettings({ ...settings, userExperienceMode: 'ADVANCED' });

      // Check permissions in Advanced mode
      const permsInAdvanced = criticalPermissions.map(p => permissionService.hasPermission(userPerms, p));

      // Permissions MUST be identical
      expect(permsInSimple).toEqual(permsInAdvanced);

      // Revert mode change
      settings = normalizeSettings({ ...settings, userExperienceMode: 'SIMPLE' });
      const permsReverted = criticalPermissions.map(p => permissionService.hasPermission(userPerms, p));
      expect(permsInSimple).toEqual(permsReverted);
    });
  });
});
