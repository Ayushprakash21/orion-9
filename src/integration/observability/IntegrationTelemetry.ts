/**
 * ORION-9 WAVE 3.3 — INTEGRATION TELEMETRY & OBSERVABILITY ENGINE
 */

import { transportRegistry } from '../transport/TransportRegistry';
import { tradingPartnerRegistry } from '../tradingPartner/TradingPartnerRegistry';
import { messageLifecycleManager } from '../messaging/MessageLifecycleManager';
import { incidentManager } from '../incidents/IncidentManager';

export interface IntegrationFabricSummary {
  tenantId: string;
  totalTransports: number;
  activeTransports: number;
  failedTransports: number;
  totalTradingPartners: number;
  activeTradingPartners: number;
  totalMessages: number;
  completedMessages: number;
  failedMessages: number;
  dlqMessages: number;
  openIncidents: number;
  criticalIncidents: number;
}

export class IntegrationTelemetry {
  private static instance: IntegrationTelemetry;

  private constructor() {}

  public static getInstance(): IntegrationTelemetry {
    if (!IntegrationTelemetry.instance) {
      IntegrationTelemetry.instance = new IntegrationTelemetry();
    }
    return IntegrationTelemetry.instance;
  }

  public getTenantSummary(tenantId: string): IntegrationFabricSummary {
    const transports = transportRegistry.listTransports(tenantId);
    const partners = tradingPartnerRegistry.listPartners(tenantId);
    const messages = messageLifecycleManager.listMessages(tenantId);
    const incidents = incidentManager.listIncidents(tenantId);

    const activeTransports = transports.filter((t) => t.status === 'CONNECTED').length;
    const failedTransports = transports.filter((t) => t.status === 'ERROR' || t.status === 'AUTH_FAILED' || t.status === 'CERTIFICATE_ERROR').length;

    const activePartners = partners.filter((p) => p.status === 'ACTIVE').length;

    const completedMessages = messages.filter((m) => m.state === 'COMPLETED').length;
    const failedMessages = messages.filter((m) => m.state === 'FAILED' || m.state === 'REJECTED').length;
    const dlqMessages = messages.filter((m) => m.state === 'DLQ').length;

    const openIncidents = incidents.filter((i) => i.status === 'OPEN' || i.status === 'INVESTIGATING').length;
    const criticalIncidents = incidents.filter((i) => (i.status === 'OPEN' || i.status === 'INVESTIGATING') && i.severity === 'CRITICAL').length;

    return {
      tenantId,
      totalTransports: transports.length,
      activeTransports,
      failedTransports,
      totalTradingPartners: partners.length,
      activeTradingPartners: activePartners,
      totalMessages: messages.length,
      completedMessages,
      failedMessages,
      dlqMessages,
      openIncidents,
      criticalIncidents,
    };
  }
}

export const integrationTelemetry = IntegrationTelemetry.getInstance();
