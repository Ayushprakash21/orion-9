import { DecisionAuditEvent } from '../types';

export class AuditService {
  static createEvent(
    decisionId: string, 
    eventType: DecisionAuditEvent['eventType'], 
    actor: string, 
    details: any
  ): DecisionAuditEvent {
    return {
      id: `AUD-${crypto.randomUUID()}`,
      decisionId,
      eventType,
      timestamp: new Date().toISOString(),
      actor,
      details
    };
  }
}
