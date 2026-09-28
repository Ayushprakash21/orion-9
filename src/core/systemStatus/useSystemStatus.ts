/**
 * ORION-9 UNIFIED SYSTEM STATUS HOOK
 * React hook consuming centralized SystemStatusSnapshot without duplicate listeners.
 */

import { useState, useEffect } from 'react';
import { SystemStatusSnapshot } from './SystemStatusTypes';
import { systemStatusEngine } from './SystemStatusEngine';
import { systemStatusRegistry } from './SystemStatusRegistry';
import { dbManager } from '../database/DatabaseConnectionManager';
import { useAuth } from '../../store/AuthContext';

export function useSystemStatus(customTenantId?: string, customOrgId?: string): SystemStatusSnapshot {
  let authContextUser: any = null;
  try {
    const auth = useAuth();
    authContextUser = auth?.currentUser;
  } catch (e) {
    // Graceful fallback when invoked outside AuthProvider in tests or CLI
  }

  const effectiveTenantId = customTenantId || authContextUser?.organizationId || 'default-tenant';
  const effectiveOrgId = customOrgId || authContextUser?.organizationId;
  const environment = dbManager.getEnvironment();

  const [snapshot, setSnapshot] = useState<SystemStatusSnapshot>(() =>
    systemStatusEngine.getSnapshot(effectiveTenantId, environment, effectiveOrgId)
  );

  useEffect(() => {
    // Immediate evaluation on mount or dependency changes
    setSnapshot(systemStatusEngine.getSnapshot(effectiveTenantId, dbManager.getEnvironment(), effectiveOrgId));

    // 1. Subscribe to SystemStatusRegistry changes
    const unsubRegistry = systemStatusRegistry.subscribe(() => {
      setSnapshot(systemStatusEngine.getSnapshot(effectiveTenantId, dbManager.getEnvironment(), effectiveOrgId));
    });

    // 2. React to Realtime Fabric and Environment window events
    const handleUpdate = () => {
      setSnapshot(systemStatusEngine.getSnapshot(effectiveTenantId, dbManager.getEnvironment(), effectiveOrgId));
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('orion:realtime-domain-updated', handleUpdate);
      window.addEventListener('orion-database-environment-changed', handleUpdate);
      window.addEventListener('online', handleUpdate);
      window.addEventListener('offline', handleUpdate);
    }

    return () => {
      unsubRegistry();
      if (typeof window !== 'undefined') {
        window.removeEventListener('orion:realtime-domain-updated', handleUpdate);
        window.removeEventListener('orion-database-environment-changed', handleUpdate);
        window.removeEventListener('online', handleUpdate);
        window.removeEventListener('offline', handleUpdate);
      }
    };
  }, [effectiveTenantId, effectiveOrgId, environment]);

  return snapshot;
}
