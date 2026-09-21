/**
 * ORION-9 KERNEL — SCM COMMAND HANDLER
 *
 * Registers core SCM command handlers on kernelCommandBus:
 * - CREATE_PURCHASE_REQUISITION
 * - CREATE_RFQ
 * - CREATE_ASN
 * - CREATE_EXCEPTION
 * - CREATE_PAYMENT_HANDOFF
 */

import { CommandEnvelope } from '../types';
import { kernelCommandBus } from '../CommandBus';
import { kernelEventBus } from '../EventBus';
import { kernelAuditEngine } from '../AuditEngine';

export function registerScmCommandHandlers(): void {
  // CREATE_PURCHASE_REQUISITION
  kernelCommandBus.registerHandler('CREATE_PURCHASE_REQUISITION', async (command: CommandEnvelope) => {
    const prId = command.entityId || `PR-${Date.now().toString(36).toUpperCase()}`;
    const result = {
      prId,
      status: 'SUBMITTED',
      tenantId: command.tenant.organizationId,
      items: command.payload.items || [],
      estimatedTotal: command.payload.estimatedTotal || 0,
      createdAt: command.timestamp,
    };

    kernelEventBus.publish('PR_CREATED', result, {
      actor: command.actor,
      tenant: command.tenant,
      entityId: prId,
      entityType: 'PURCHASE_REQUISITION',
      correlationId: command.correlationId,
    });

    return result;
  });

  // CREATE_RFQ
  kernelCommandBus.registerHandler('CREATE_RFQ', async (command: CommandEnvelope) => {
    const rfqId = command.entityId || `RFQ-${Date.now().toString(36).toUpperCase()}`;
    const result = {
      rfqId,
      prId: command.payload.prId,
      status: 'PUBLISHED',
      tenantId: command.tenant.organizationId,
      targetSuppliers: command.payload.targetSuppliers || [],
      deadline: command.payload.deadline,
      createdAt: command.timestamp,
    };

    kernelEventBus.publish('RFQ_CREATED', result, {
      actor: command.actor,
      tenant: command.tenant,
      entityId: rfqId,
      entityType: 'RFQ',
      correlationId: command.correlationId,
    });

    return result;
  });

  // CREATE_ASN
  kernelCommandBus.registerHandler('CREATE_ASN', async (command: CommandEnvelope) => {
    const asnId = command.entityId || `ASN-${Date.now().toString(36).toUpperCase()}`;
    const result = {
      asnId,
      poId: command.payload.poId,
      supplierId: command.payload.supplierId,
      status: 'RECEIVED',
      tenantId: command.tenant.organizationId,
      items: command.payload.items || [],
      createdAt: command.timestamp,
    };

    kernelEventBus.publish('ASN_CREATED', result, {
      actor: command.actor,
      tenant: command.tenant,
      entityId: asnId,
      entityType: 'ASN',
      correlationId: command.correlationId,
    });

    return result;
  });

  // CREATE_EXCEPTION
  kernelCommandBus.registerHandler('CREATE_EXCEPTION', async (command: CommandEnvelope) => {
    const exceptionId = command.entityId || `EXC-${Date.now().toString(36).toUpperCase()}`;
    const result = {
      exceptionId,
      title: command.payload.title,
      severity: command.payload.severity || 'MEDIUM',
      description: command.payload.description,
      status: 'OPEN',
      tenantId: command.tenant.organizationId,
      createdAt: command.timestamp,
    };

    kernelEventBus.publish('EXCEPTION_CREATED', result, {
      actor: command.actor,
      tenant: command.tenant,
      entityId: exceptionId,
      entityType: 'EXCEPTION',
      correlationId: command.correlationId,
    });

    return result;
  });

  // CREATE_PAYMENT_HANDOFF
  kernelCommandBus.registerHandler('CREATE_PAYMENT_HANDOFF', async (command: CommandEnvelope) => {
    const handoffId = command.entityId || `PH-${Date.now().toString(36).toUpperCase()}`;
    const result = {
      handoffId,
      invoiceId: command.payload.invoiceId,
      amount: command.payload.amount,
      payee: command.payload.payee,
      status: 'PREPARED',
      tenantId: command.tenant.organizationId,
      createdAt: command.timestamp,
    };

    kernelEventBus.publish('PAYMENT_HANDOFF_CREATED', result, {
      actor: command.actor,
      tenant: command.tenant,
      entityId: handoffId,
      entityType: 'PAYMENT_HANDOFF',
      correlationId: command.correlationId,
    });

    return result;
  });
}

// Auto-register upon import
registerScmCommandHandlers();
