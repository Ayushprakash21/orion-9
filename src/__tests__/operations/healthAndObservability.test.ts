/**
 * ORION-9 WAVE 10: ENTERPRISE PRODUCTION CONTROL PLANE
 * Unit Tests: Health Diagnostics, Observability, Telemetry & Alerts
 */

import { describe, it, expect } from 'vitest';
import {
  healthService,
  observabilityService,
  alertEngine,
} from '../../operations';

describe('Wave 10 Health, Observability & Alerts Suite', () => {
  // --------------------------------------------------------------------------
  // 1. HealthService
  // --------------------------------------------------------------------------
  describe('HealthService', () => {
    it('runs deep diagnostic health checks across all 8 subsystems', async () => {
      const report = await healthService.runHealthCheck();
      expect(report).toBeDefined();
      expect(report.overallStatus).toBe('HEALTHY');
      expect(report.readinessProbe).toBe(true);
      expect(report.livenessProbe).toBe(true);
      expect(report.startupProbe).toBe(true);

      const compNames = Object.keys(report.components);
      expect(compNames).toContain('firestore');
      expect(compNames).toContain('auth');
      expect(compNames).toContain('kernel');
      expect(compNames).toContain('ai');
      expect(compNames).toContain('eventBus');
      expect(compNames).toContain('jobQueue');
      expect(compNames).toContain('memory');
      expect(compNames).toContain('clockDrift');

      expect(report.components.firestore.status).toBe('HEALTHY');
      expect(report.components.kernel.status).toBe('HEALTHY');
    });
  });

  // --------------------------------------------------------------------------
  // 2. ObservabilityService
  // --------------------------------------------------------------------------
  describe('ObservabilityService', () => {
    it('scrubs sensitive tokens, API keys, passwords, and PII from log output', () => {
      const sensitiveMsg = 'Received Bearer secret-auth-token-12345 from user john.doe@enterprise.com with password=SuperSecretPass1!';
      const record = observabilityService.info(sensitiveMsg, { tenantId: 'TENANT_A' });

      expect(record.redacted).toBe(true);
      expect(record.message).not.toContain('secret-auth-token-12345');
      expect(record.message).not.toContain('SuperSecretPass1!');
      expect(record.message).toContain('Bearer [REDACTED_TOKEN]');
      expect(record.message).toContain('[REDACTED_SECRET]');
      expect(record.message).toContain('jo***@enterprise.com');
    });

    it('records and queries structured operational metrics', () => {
      observabilityService.recordMetric('http_request_duration_ms', 'HISTOGRAM', 42.5, {
        endpoint: '/api/v1/orders',
      });
      observabilityService.recordMetric('active_twin_nodes', 'GAUGE', 120, {
        tenantId: 'TENANT_A',
      });

      const orderMetrics = observabilityService.getMetrics('http_request_duration_ms');
      expect(orderMetrics.length).toBeGreaterThanOrEqual(1);
      expect(orderMetrics[0].value).toBe(42.5);
      expect(orderMetrics[0].tags.endpoint).toBe('/api/v1/orders');
    });

    it('creates and finishes distributed tracing spans with duration', () => {
      const span = observabilityService.startSpan('ERP_SYNC_PIPELINE');
      expect(span.spanId).toBeDefined();
      expect(span.traceId).toBeDefined();
      expect(span.startTime).toBeGreaterThan(0);

      const endedSpan = observabilityService.endSpan(span.spanId);
      expect(endedSpan).toBeDefined();
      expect(endedSpan?.endTime).toBeGreaterThanOrEqual(span.startTime);
      expect(typeof endedSpan?.durationMs).toBe('number');
    });
  });

  // --------------------------------------------------------------------------
  // 3. AlertEngine
  // --------------------------------------------------------------------------
  describe('AlertEngine', () => {
    it('triggers alerts and applies deduplication window to prevent storms', () => {
      const res1 = alertEngine.triggerAlert({
        ruleId: 'RULE_TEST_SPIKE',
        title: 'High Ingestion Error Rate',
        message: 'Error rate at 12%',
        severity: 'SEV2',
        source: 'IngestionPipeline',
        tenantId: 'TENANT_A',
      });

      expect(res1.suppressed).toBe(false);
      expect(res1.alert).toBeDefined();

      // Second identical trigger within cooldown window should be suppressed
      const res2 = alertEngine.triggerAlert({
        ruleId: 'RULE_TEST_SPIKE',
        title: 'High Ingestion Error Rate',
        message: 'Error rate still at 12%',
        severity: 'SEV2',
        source: 'IngestionPipeline',
        tenantId: 'TENANT_A',
      });

      expect(res2.suppressed).toBe(true);
      expect(res2.reason).toBe('COOLDOWN_WINDOW_ACTIVE');
    });

    it('allows operators to acknowledge alerts', () => {
      const active = alertEngine.getActiveAlerts();
      expect(active.length).toBeGreaterThan(0);

      const unacked = active.find(a => !a.acknowledged);
      if (unacked) {
        const acked = alertEngine.acknowledgeAlert(unacked.id, 'ops_engineer@orion.internal');
        expect(acked).toBe(true);
      }
    });
  });
});
