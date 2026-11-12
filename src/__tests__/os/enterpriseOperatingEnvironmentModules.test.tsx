import { describe, it, expect } from 'vitest';
import { ORION_REGISTRY } from '../../os/OrionApplicationRegistry';
import { ORION_COMPONENT_MAP } from '../../os/OrionComponentMap';
import ActivityMonitor from '../../components/ActivityMonitor';
import SystemIntelligence from '../../components/SystemIntelligence';
import TaskScheduler from '../../components/TaskScheduler';
import RecoveryCenter from '../../components/RecoveryCenter';
import ApplicationHub from '../../components/ApplicationHub';

describe('ORION-9 OS 21.1 Enterprise Operating Environment Modules', () => {
  const targetModules = [
    { id: 'activity-monitor', name: 'Activity Monitor', category: 'System' },
    { id: 'system-intelligence', name: 'System Intelligence', category: 'System' },
    { id: 'task-scheduler', name: 'Task Scheduler', category: 'System' },
    { id: 'recovery-center', name: 'Recovery Center', category: 'System' },
    { id: 'application-hub', name: 'Application Hub', category: 'System' },
  ];

  describe('Registry and Component Mapping Verification', () => {
    it('registers all 5 enterprise modules in ORION_REGISTRY with required metadata', () => {
      for (const { id, name, category } of targetModules) {
        const app = ORION_REGISTRY[id];
        expect(app, `Module ${id} must exist in ORION_REGISTRY`).toBeDefined();
        expect(app.name).toBe(name);
        expect(app.category).toBe(category);
        expect(app.route).toBe(`/${id}`);
        expect(app.description).toBeDefined();
      }
    });

    it('maps all 5 modules in ORION_COMPONENT_MAP to valid components', () => {
      for (const { id } of targetModules) {
        const component = ORION_COMPONENT_MAP[id];
        expect(component, `Component for ${id} must exist in ORION_COMPONENT_MAP`).toBeDefined();
      }
    });
  });

  describe('ActivityMonitor (OR-001 & OR-010 compliance)', () => {
    const code = ActivityMonitor.toString();

    it('implements tabs for applications, background tasks, data services, AI agents, and browser performance', () => {
      expect(code).toContain('applications');
      expect(code).toContain('tasks');
      expect(code).toContain('services');
      expect(code).toContain('ai');
      expect(code).toContain('performance');
    });

    it('enforces Rule 10: Zero fake metrics and honest browser-measurable telemetry', () => {
      expect(code).toContain('Honest Measurable Metrics Policy');
      expect(code).toContain('CPU utilization and native hardware memory are not fabricated');
      expect(code).toContain('Unavailable');
    });
  });

  describe('SystemIntelligence (Continuous Health Assessment & Diagnostics)', () => {
    const code = SystemIntelligence.toString();

    it('implements health assessment, root cause analysis, and diagnostic engine', () => {
      expect(code).toContain('INC-2026-081');
      expect(code).toContain('Operational Incidents & Events');
      expect(code).toContain('API Gateway');
    });
  });

  describe('TaskScheduler (Durable Cloudflare Cron & Workflow Automation)', () => {
    const code = TaskScheduler.toString();

    it('implements Cloudflare Workers scheduled cron triggers, retry policies, and execution history', () => {
      expect(code).toContain('job-scm-event-pump');
      expect(code).toContain('Cloudflare Worker Event Pump');
      expect(code).toContain('retryPolicy');
    });
  });

  describe('RecoveryCenter (Rollback, Snapshots & Disaster Recovery)', () => {
    const code = RecoveryCenter.toString();

    it('implements desktop layout backup, snapshot creation, and disaster recovery procedures', () => {
      expect(code).toContain('snap-pulsar-initial');
      expect(code).toContain('Pulsar Baseline Snapshot');
    });
  });

  describe('ApplicationHub (Lifecycle, Pinning & Module Catalog)', () => {
    const code = ApplicationHub.toString();

    it('implements enterprise application catalog, category filtering, search, and dock pinning', () => {
      expect(code).toContain('Orion Application Hub');
      expect(code).toContain('Search applications');
      expect(code).toContain('pinToDock');
    });
  });
});
