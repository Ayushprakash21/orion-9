/**
 * ORION-9 WAVE 4 — SCM EVENT FABRIC
 * Emits standardized domain events for material SCM lifecycle transitions.
 */

import { kernelEventBus } from '../EventBus';
import { AuthorizationActor } from '../authorization/AuthorizationEngine';

export interface ScmDomainEvent {
  eventId: string;
  tenantId: string;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  actor: AuthorizationActor;
  timestamp: string;
  correlationId: string;
  causationId?: string;
  payloadReference?: any;
}

export class ScmEventFabric {
  private static instance: ScmEventFabric;

  private constructor() {}

  public static getInstance(): ScmEventFabric {
    if (!ScmEventFabric.instance) {
      ScmEventFabric.instance = new ScmEventFabric();
    }
    return ScmEventFabric.instance;
  }

  public publish(event: Omit<ScmDomainEvent, 'eventId' | 'timestamp'>): ScmDomainEvent {
    const fullEvent: ScmDomainEvent = {
      ...event,
      eventId: `EVT-SCM-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };

    // Emit onto core Kernel EventBus
    kernelEventBus.publish(fullEvent.eventType, fullEvent.payloadReference || {}, {
      actor: {
        id: fullEvent.actor.id,
        type: fullEvent.actor.type as any,
        name: fullEvent.actor.name,
      },
      tenant: {
        organizationId: fullEvent.tenantId,
      },
      entityId: fullEvent.aggregateId,
      entityType: fullEvent.aggregateType,
      correlationId: fullEvent.correlationId,
      causationId: fullEvent.causationId,
    });

    return fullEvent;
  }
}

export const scmEventFabric = ScmEventFabric.getInstance();
