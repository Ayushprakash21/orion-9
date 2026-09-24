import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  SCHEMA_REGISTRY, 
  getAllDomainSchemas, 
  getAllCollections, 
  getCollectionsForDomain 
} from '../../core/database/DatabaseSchemaRegistry';
import { 
  LIVE_DATABASE_CONFIG, 
  DEMO_DATABASE_CONFIG 
} from '../../core/database/DatabaseEnvironment';
import { DatabaseConnectionManager } from '../../core/database/DatabaseConnectionManager';
import { DatabaseIntegrityValidator } from '../../core/database/DatabaseIntegrityValidator';
import { DemoDataSeeder } from '../../core/database/DemoDataSeeder';

describe('Orion-9 Database Control Plane & Schema Architecture', () => {
  let dbManager: DatabaseConnectionManager;
  let validator: DatabaseIntegrityValidator;
  let seeder: DemoDataSeeder;

  beforeEach(() => {
    dbManager = DatabaseConnectionManager.getInstance();
    validator = DatabaseIntegrityValidator.getInstance();
    seeder = DemoDataSeeder.getInstance();
  });

  describe('18-Domain Schema Registry Coverage (A through R)', () => {
    it('contains all 18 enterprise business domains', () => {
      const expectedDomains = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'];
      const registeredDomains = Object.keys(SCHEMA_REGISTRY);

      expectedDomains.forEach(domain => {
        expect(registeredDomains).toContain(domain);
        expect(SCHEMA_REGISTRY[domain].collections.length).toBeGreaterThan(0);
      });
    });

    it('every collection has defined primary key, tenant isolation, and security rule coverage', () => {
      const allCollections = getAllCollections();
      expect(allCollections.length).toBeGreaterThanOrEqual(18);

      allCollections.forEach(col => {
        expect(col.collectionPath).toBeTruthy();
        expect(col.entityName).toBeTruthy();
        expect(col.primaryKey).toBeTruthy();
        expect(col.tenantField).toBeDefined();
        expect(col.ruleCoverage).toBeTruthy();
      });
    });

    it('filters collections by domain correctly', () => {
      const inventoryCols = getCollectionsForDomain('D');
      expect(inventoryCols.length).toBeGreaterThan(0);
      expect(inventoryCols.some(c => c.collectionPath === 'inventory')).toBe(true);

      const controlTowerCols = getCollectionsForDomain('K');
      expect(controlTowerCols.length).toBeGreaterThan(0);
      expect(controlTowerCols.some(c => c.collectionPath === 'exceptions')).toBe(true);
    });
  });

  describe('Database Environment Configurations & Isolation', () => {
    it('defines distinct Live and Demo configurations', () => {
      expect(LIVE_DATABASE_CONFIG.environment).toBe('LIVE');
      expect(LIVE_DATABASE_CONFIG.projectId).toBe('orion9-dev-db-2026');
      expect(LIVE_DATABASE_CONFIG.cachePrefix).toBe('orion9:live');
      expect(LIVE_DATABASE_CONFIG.isProductionSafe).toBe(true);

      expect(DEMO_DATABASE_CONFIG.environment).toBe('DEMO');
      expect(DEMO_DATABASE_CONFIG.projectId).toBe('demo-orion9-db-2026');
      expect(DEMO_DATABASE_CONFIG.cachePrefix).toBe('orion9:demo');
      expect(DEMO_DATABASE_CONFIG.isProductionSafe).toBe(false);
    });

    it('generates distinct cache keys across environments and tenants', () => {
      const liveKey = dbManager.getCacheKey('tenant_alpha', 'inventory', 'item_123');
      expect(liveKey).toContain('tenant_alpha');
      expect(liveKey).toContain('inventory');
      expect(liveKey).toContain('item_123');
    });
  });

  describe('Governed Environment Switcher & Security Controls', () => {
    it('blocks AI agents from switching database environments', async () => {
      const result = await dbManager.switchEnvironment({
        targetEnvironment: 'DEMO',
        actorUserId: 'gemini-autopilot-agent',
        actorRole: 'ai_assistant',
        callerType: 'ai_agent',
        stepUpConfirmed: true,
        reason: 'Automated test prompt execution',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('AI Agents are strictly denied');
    });

    it('blocks non-admin users from switching database environments', async () => {
      const result = await dbManager.switchEnvironment({
        targetEnvironment: 'DEMO',
        actorUserId: 'regular_user_1',
        actorRole: 'buyer',
        callerType: 'human_admin',
        stepUpConfirmed: true,
        reason: 'Unauthorized switch attempt',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unauthorized attempt');
    });

    it('requires explicit step-up confirmation when switching to LIVE database', async () => {
      // First ensure in DEMO
      await dbManager.switchEnvironment({
        targetEnvironment: 'DEMO',
        actorUserId: 'admin_1',
        actorRole: 'platform_admin',
        callerType: 'human_admin',
        stepUpConfirmed: true,
        reason: 'Precondition demo',
      });

      const result = await dbManager.switchEnvironment({
        targetEnvironment: 'LIVE',
        actorUserId: 'admin_1',
        actorRole: 'platform_admin',
        callerType: 'human_admin',
        stepUpConfirmed: false, // Step-up not confirmed
        reason: 'Routine switch',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Step-up confirmation is required');
    });

    it('successfully switches to DEMO and cleans up active listeners and caches', async () => {
      let listenerCleaned = false;
      dbManager.registerListener('test_listener', () => {
        listenerCleaned = true;
      });

      expect(dbManager.getState().activeListenersCount).toBeGreaterThanOrEqual(1);

      const result = await dbManager.switchEnvironment({
        targetEnvironment: 'DEMO',
        actorUserId: 'admin_1',
        actorRole: 'platform_admin',
        callerType: 'human_admin',
        stepUpConfirmed: true,
        reason: 'Admin switched to synthetic sandbox for training',
      });

      expect(result.success).toBe(true);
      expect(result.currentEnvironment).toBe('DEMO');
      expect(listenerCleaned).toBe(true);
      expect(dbManager.getEnvironment()).toBe('DEMO');
    });

    it('successfully switches back to LIVE with step-up verification', async () => {
      const result = await dbManager.switchEnvironment({
        targetEnvironment: 'LIVE',
        actorUserId: 'admin_1',
        actorRole: 'platform_admin',
        callerType: 'human_admin',
        stepUpConfirmed: true,
        reason: 'Admin returning to authoritative production database',
      });

      expect(result.success).toBe(true);
      expect(result.currentEnvironment).toBe('LIVE');
      expect(dbManager.getEnvironment()).toBe('LIVE');
    });
  });

  describe('Outbox Cross-Environment Isolation', () => {
    it('validates mutation match to active environment and rejects mismatch', () => {
      // Active is LIVE
      const validForLive = dbManager.validateOutboxPayload({ environment: 'LIVE', tenantId: 'tenant_alpha' });
      expect(validForLive).toBe(true);

      const invalidForLive = dbManager.validateOutboxPayload({ environment: 'DEMO', tenantId: 'tenant_alpha' });
      expect(invalidForLive).toBe(false);
    });
  });

  describe('Database Referential Integrity & Multi-Tenant Audit', () => {
    it('executes integrity audit calculation correctly', async () => {
      const report = await validator.runFullAudit(10);
      expect(report).toBeDefined();
      expect(report.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.overallScore).toBeLessThanOrEqual(100);
      expect(report.collectionsAudited).toBeGreaterThan(0);
    });
  });

  describe('Synthetic Demo Data Seeder Sandbox', () => {
    it('prevents data seeding when active environment is LIVE', async () => {
      // Ensure in LIVE mode
      await dbManager.switchEnvironment({
        targetEnvironment: 'LIVE',
        actorUserId: 'admin_1',
        actorRole: 'platform_admin',
        callerType: 'human_admin',
        stepUpConfirmed: true,
        reason: 'Confirm Live',
      });

      await expect(seeder.seedDemoEnvironment('tenant_demo')).rejects.toThrow('Cannot execute DemoDataSeeder against non-DEMO environment');
    });

    it('allows data seeding when active environment is DEMO', async () => {
      // Switch to DEMO mode
      await dbManager.switchEnvironment({
        targetEnvironment: 'DEMO',
        actorUserId: 'admin_1',
        actorRole: 'platform_admin',
        callerType: 'human_admin',
        stepUpConfirmed: true,
        reason: 'Switch to Demo for seeding test',
      });

      const summary = await seeder.seedDemoEnvironment('tenant_demo');
      expect(summary.environment).toBe('DEMO');
      expect(summary.counts.suppliers).toBeGreaterThan(0);
      expect(summary.counts.products).toBeGreaterThan(0);
      expect(summary.counts.warehouses).toBeGreaterThan(0);
    });
  });
});
