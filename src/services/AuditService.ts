import { DecisionAuditEvent } from '../types';

export class AuditService {
  static createEvent(
    decisionId: string, 
    eventType: DecisionAuditEvent['eventType'], 
    actor: string, 
    details: any
  ): DecisionAuditEvent {
    return {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      decisionId,
      eventType,
      timestamp: new Date().toISOString(),
      actor,
      details
    };
  }
}
