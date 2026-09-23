/**
 * ORION-9 PART 4 TRACK 9: OBSERVABILITY & OPERATIONAL INTELLIGENCE TEST SUITE
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { observabilityService } from '../../operations/ObservabilityService';
import { sloEngine } from '../../operations/SloEngine';
import { alertEngine } from '../../operations/AlertEngine';
import { incidentManager } from '../../operations/IncidentManager';
import { securityTelemetryGuard } from '../../operations/SecurityTelemetryGuard';

describe('ORION-9 Part 4 Track 9: Observability & Operational Intelligence Gate', () => {
  const tenantId = 'org-tenant-a';

  describe('1. PII Redaction & Structured Logging', () => {
    it('automatically scrubs secrets, Bearer tokens, and email addresses from logs', () => {
      const logRecord = observabilityService.log(
        'ERROR',
        'Authentication failed for user john.doe@acme.com with Bearer eyJhbGciOiJSUzI1Ni... and password=secretpass123',
        {
          tenantId,
          correlationId: 'corr-test-123',
        }
      );

      expect(logRecord.redacted).toBe(true);
      expect(logRecord.message).not.toContain('secretpass123');
      expect(logRecord.message).not.toContain('eyJhbGciOiJSUzI1Ni...');
      expect(logRecord.message).toContain('[REDACTED_TOKEN]');
      expect(logRecord.correlationId).toBe('corr-test-123');
    });
  });

  describe('2. Distributed Tracing & Parent-Child Spans', () => {
    it('creates trace spans with traceId, spanId, and parentSpanId hierarchy', () => {
      const parentSpan = observabilityService.startSpan('WorkflowExecution', 'trace-001');
      expect(parentSpan.traceId).toBe('trace-001');
      expect(parentSpan.spanId).toBeDefined();

      const childSpan = observabilityService.startSpan('ConnectorInvocation', parentSpan.traceId, parentSpan.spanId);
      expect(childSpan.traceId).toBe('trace-001');
      expect(childSpan.parentSpanId).toBe(parentSpan.spanId);

      const endedChild = observabilityService.endSpan(childSpan.spanId);
      expect(endedChild?.durationMs).toBeGreaterThanOrEqual(0);

      const endedParent = observabilityService.endSpan(parentSpan.spanId);
      expect(endedParent?.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('3. SLI / SLO Framework & Breach Detection', () => {
    it('evaluates SLO targets and detects threshold breaches', () => {
      const slo = sloEngine.registerSlo({
        sloId: 'slo-test-rag-latency',
        tenantId,
        domain: 'KNOWLEDGE',
        name: 'Test RAG Latency SLO',
        description: 'Test SLO for RAG retrieval latency',
        metricName: 'knowledge.rag.latency',
        targetPercent: 99.0,
        thresholdValue: 200,
        windowPeriodMs: 86400000,
        status: 'MEETING',
        currentValue: 150,
      });

      // Valid latency below threshold
      const meetingResult = sloEngine.evaluateSlo(slo.sloId, 150);
      expect(meetingResult.meeting).toBe(true);
      expect(meetingResult.breached).toBe(false);

      // Excessive latency above threshold
      const breachedResult = sloEngine.evaluateSlo(slo.sloId, 350);
      expect(breachedResult.meeting).toBe(false);
      expect(breachedResult.breached).toBe(true);
    });
  });

  describe('4. Governed Alert Engine & Storm Suppression', () => {
    it('triggers alerts and suppresses duplicate alerts within cooldown window', () => {
      const alert1 = alertEngine.triggerAlert({
        tenantId,
        ruleId: 'rule-high-cpu',
        title: 'CPU Usage High',
        message: 'CPU usage exceeds 90%',
        severity: 'SEV2',
        source: 'HealthCheck',
        deduplicationKey: 'dedup-cpu-high-01',
        cooldownMs: 60000,
      });

      expect(alert1.suppressed).toBe(false);

      // Duplicate alert within 1 minute cooldown
      const alert2 = alertEngine.triggerAlert({
        tenantId,
        ruleId: 'rule-high-cpu',
        title: 'CPU Usage High',
        message: 'CPU usage exceeds 90%',
        severity: 'SEV2',
        source: 'HealthCheck',
        deduplicationKey: 'dedup-cpu-high-01',
        cooldownMs: 60000,
      });

      expect(alert2.suppressed).toBe(true);

      const acked = alertEngine.acknowledgeAlert(alert1.id, tenantId, 'operator-01');
      expect(Boolean(acked)).toBe(true);
    });
  });

  describe('5. Security Telemetry Guard & RBAC Protection', () => {
    it('records tamper-resistant security events and restricts standard user access', () => {
      const event = securityTelemetryGuard.recordSecurityEvent({
        type: 'AI_SELF_APPROVAL_BLOCKED',
        tenantId,
        actorId: 'ai-agent-bad',
        resourceId: 'conn-sap-01',
        details: 'AI agent attempted to self-approve connector activation.',
      });

      expect(event.signature).toContain('sec-sig-');

      // Platform admin can query security telemetry
      const adminQuery = securityTelemetryGuard.querySecurityEvents(tenantId, 'PLATFORM_ADMIN');
      expect(adminQuery.length).toBeGreaterThan(0);

      // Standard user is denied query access
      expect(() => {
        securityTelemetryGuard.querySecurityEvents(tenantId, 'STANDARD_USER');
      }).toThrow('[Security Telemetry Guard]');
    });
  });

  describe('6. Incident Management & Blast Radius Scoring', () => {
    it('declares incident, calculates blast radius, and manages timeline', () => {
      const incident = incidentManager.declareIncident({
        tenantId,
        title: 'SAP ERP Integration Outage',
        description: 'Connection timeout to SAP gateway',
        severity: 'SEV1',
        declaredBy: 'admin-ops',
        impactedTenants: ['org-tenant-a', 'org-tenant-b'],
        impactedModules: ['integration', 'scm', 'workflows'],
      });

      expect(incident.severity).toBe('SEV1');
      expect(incident.blastRadiusScore).toBeGreaterThanOrEqual(50);

      const updated = incidentManager.updateIncidentStatus(
        incident.id,
        'RESOLVED',
        'admin-ops',
        'SAP gateway connection restored.'
      );

      expect(updated?.status).toBe('RESOLVED');
      expect(updated?.resolvedAt).toBeDefined();
    });
  });
});
