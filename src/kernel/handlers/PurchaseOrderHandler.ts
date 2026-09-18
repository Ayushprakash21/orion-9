/**
 * ORION-9 KERNEL — PURCHASE ORDER COMMAND HANDLER
 *
 * Implements the reference end-to-end Purchase Order workflow through the
 * Orion Kernel CommandBus. This is the canonical reference implementation
 * for all future command handlers.
 *
 * Workflow:
 *   CreatePurchaseOrder command
 *     → CommandBus (identity, auth, policy, approval gate)
 *     → PurchaseOrderHandler (Supabase upsert / IndexedDB fallback)
 *     → State transition: DRAFT → PENDING_APPROVAL or DRAFT → APPROVED
 *     → PurchaseOrderCreated event
 *     → Audit record
 *
 *   After human approval:
 *     → ApprovePurchaseOrder command
 *     → State transition: PENDING_APPROVAL → APPROVED
 *     → PurchaseOrderApproved event
 *     → Audit record
 */

import { CommandEnvelope, CommandResult } from '../types';
import { kernelCommandBus, CommandHandler } from '../CommandBus';
import { poStateMachine, POState } from '../StateMachine';
import { kernelEventBus } from '../EventBus';
import { kernelAuditEngine } from '../AuditEngine';
import { getSupabase } from '../../lib/supabaseClient';
import { db, loadData, saveData } from '../../data/db';
import { generateCorrelationId } from '../security/crypto';
import {
  COMMAND_CREATE_PO,
  COMMAND_APPROVE_PO,
  COMMAND_REJECT_PO,
  COMMAND_CANCEL_PO,
  registerPurchaseOrderPolicies,
} from '../policy/purchaseOrderPolicy';

// Re-export command type constants for convenient single-import usage.
export { COMMAND_CREATE_PO, COMMAND_APPROVE_PO, COMMAND_REJECT_PO, COMMAND_CANCEL_PO };

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreatePurchaseOrderPayload {
  title: string;
  supplierId?: string;
  supplierName?: string;
  amount: number;
  currency?: string;
  description?: string;
  requestedDeliveryDate?: string;
  lines?: Array<{
    productId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface ApprovePurchaseOrderPayload {
  purchaseOrderId: string;
  comments?: string;
}

export interface RejectPurchaseOrderPayload {
  purchaseOrderId: string;
  reason: string;
}

export interface CancelPurchaseOrderPayload {
  purchaseOrderId: string;
  reason: string;
}

export interface PurchaseOrder {
  id: string;
  commandId: string;
  correlationId: string;
  organizationId: string;
  title: string;
  supplierId?: string;
  supplierName?: string;
  amount: number;
  currency: string;
  description?: string;
  requestedDeliveryDate?: string;
  state: POState;
  lines: CreatePurchaseOrderPayload['lines'];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

// ─── Local fallback store ─────────────────────────────────────────────────────

const LOCAL_PO_KEY = 'SC_PURCHASE_ORDERS';

async function getLocalPOs(): Promise<PurchaseOrder[]> {
  try {
    if (typeof window === 'undefined') return [];
    const stored = await loadData<PurchaseOrder>(db.purchaseOrders || { name: LOCAL_PO_KEY } as any);
    return stored || [];
  } catch {
    return [];
  }
}

async function saveLocalPO(po: PurchaseOrder): Promise<void> {
  try {
    if (typeof window === 'undefined') return;
    const existing = await getLocalPOs();
    const idx = existing.findIndex(p => p.id === po.id);
    if (idx >= 0) {
      existing[idx] = po;
    } else {
      existing.push(po);
    }
    await saveData(db.purchaseOrders || { name: LOCAL_PO_KEY } as any, existing);
  } catch (err) {
    console.warn('[POHandler] Local save failed:', err);
  }
}

// ─── CREATE PURCHASE ORDER ────────────────────────────────────────────────────

const handleCreatePurchaseOrder: CommandHandler<CreatePurchaseOrderPayload, PurchaseOrder> = async (
  command: CommandEnvelope<CreatePurchaseOrderPayload>
) => {
  const { payload, actor, tenant, commandId, correlationId } = command;
  const supabase = getSupabase();

  const poId = `po-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  // Initial state is always DRAFT; the CommandBus policy gate determines whether
  // it will immediately proceed or require PENDING_APPROVAL approval.
  const initialState: POState = 'DRAFT';

  const po: PurchaseOrder = {
    id: poId,
    commandId,
    correlationId,
    organizationId: tenant.organizationId,
    title: payload.title,
    supplierId: payload.supplierId,
    supplierName: payload.supplierName,
    amount: payload.amount,
    currency: payload.currency || 'USD',
    description: payload.description,
    requestedDeliveryDate: payload.requestedDeliveryDate,
    state: initialState,
    lines: payload.lines || [],
    createdBy: actor.id,
    createdAt: now,
    updatedAt: now,
  };

  // Persist to Supabase if available, otherwise local IndexedDB.
  if (supabase) {
    const { error } = await supabase.from('purchase_orders').insert({
      id: po.id,
      command_id: po.commandId,
      correlation_id: po.correlationId,
      organization_id: po.organizationId,
      title: po.title,
      supplier_id: po.supplierId,
      supplier_name: po.supplierName,
      amount: po.amount,
      currency: po.currency,
      description: po.description,
      requested_delivery_date: po.requestedDeliveryDate,
      state: po.state,
      lines: po.lines,
      created_by: po.createdBy,
      created_at: po.createdAt,
      updated_at: po.updatedAt,
    });

    if (error) {
      console.warn('[POHandler] Supabase insert failed, falling back to local:', error.message);
      await saveLocalPO(po);
    }
  } else {
    await saveLocalPO(po);
  }

  // Publish creation event.
  kernelEventBus.publish(
    'PURCHASE_ORDER_CREATED',
    { purchaseOrderId: po.id, state: po.state, amount: po.amount },
    {
      actor,
      tenant,
      correlationId,
      entityId: po.id,
      entityType: 'purchase_order',
    }
  );

  return po;
};

// ─── APPROVE PURCHASE ORDER ───────────────────────────────────────────────────

const handleApprovePurchaseOrder: CommandHandler<ApprovePurchaseOrderPayload, PurchaseOrder> = async (
  command: CommandEnvelope<ApprovePurchaseOrderPayload>
) => {
  const { payload, actor, tenant, correlationId } = command;
  const supabase = getSupabase();

  // Fetch the PO.
  let po: PurchaseOrder | null = null;

  if (supabase) {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('id', payload.purchaseOrderId)
      .eq('organization_id', tenant.organizationId)
      .single();

    if (!error && data) {
      po = {
        id: data.id,
        commandId: data.command_id,
        correlationId: data.correlation_id,
        organizationId: data.organization_id,
        title: data.title,
        supplierId: data.supplier_id,
        supplierName: data.supplier_name,
        amount: data.amount,
        currency: data.currency,
        description: data.description,
        state: data.state,
        lines: data.lines || [],
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }
  }

  if (!po) {
    // Fallback to local store.
    const local = await getLocalPOs();
    po = local.find(p => p.id === payload.purchaseOrderId && p.organizationId === tenant.organizationId) || null;
  }

  if (!po) {
    throw new Error(`Purchase order '${payload.purchaseOrderId}' not found.`);
  }

  // Validate state transition: must be in PENDING_APPROVAL (or DRAFT for auto-approve path).
  const fromState = po.state as POState;
  const toState: POState = 'APPROVED';
  const validFrom: POState[] = ['PENDING_APPROVAL', 'DRAFT'];

  if (!validFrom.includes(fromState)) {
    throw new Error(
      `Cannot approve purchase order in state '${fromState}'. Expected: PENDING_APPROVAL or DRAFT.`
    );
  }

  // Apply state transition via the canonical state machine.
  poStateMachine.transition(po.id, fromState, toState, {
    actorId: actor.id,
    actorRole: actor.role as string,
    correlationId,
    tenantId: tenant.organizationId,
  });

  const now = new Date().toISOString();
  po.state = toState;
  po.approvedBy = actor.id;
  po.approvedAt = now;
  po.updatedAt = now;

  // Persist update.
  if (supabase) {
    await supabase
      .from('purchase_orders')
      .update({ state: toState, approved_by: actor.id, approved_at: now, updated_at: now })
      .eq('id', po.id)
      .eq('organization_id', tenant.organizationId);
  } else {
    await saveLocalPO(po);
  }

  // Publish approved event.
  kernelEventBus.publish(
    'PURCHASE_ORDER_APPROVED',
    { purchaseOrderId: po.id, approvedBy: actor.id, amount: po.amount },
    {
      actor,
      tenant,
      correlationId,
      entityId: po.id,
      entityType: 'purchase_order',
    }
  );

  return po;
};

// ─── REJECT PURCHASE ORDER ────────────────────────────────────────────────────

const handleRejectPurchaseOrder: CommandHandler<RejectPurchaseOrderPayload, { purchaseOrderId: string; state: POState }> = async (
  command: CommandEnvelope<RejectPurchaseOrderPayload>
) => {
  const { payload, actor, tenant, correlationId } = command;
  const supabase = getSupabase();
  const now = new Date().toISOString();

  if (supabase) {
    await supabase
      .from('purchase_orders')
      .update({
        state: 'REJECTED',
        rejected_by: actor.id,
        rejected_at: now,
        rejection_reason: payload.reason,
        updated_at: now,
      })
      .eq('id', payload.purchaseOrderId)
      .eq('organization_id', tenant.organizationId);
  } else {
    const local = await getLocalPOs();
    const po = local.find(p => p.id === payload.purchaseOrderId);
    if (po) {
      po.state = 'REJECTED';
      po.rejectedBy = actor.id;
      po.rejectedAt = now;
      po.rejectionReason = payload.reason;
      po.updatedAt = now;
      await saveLocalPO(po);
    }
  }

  kernelEventBus.publish(
    'PURCHASE_ORDER_REJECTED',
    { purchaseOrderId: payload.purchaseOrderId, rejectedBy: actor.id, reason: payload.reason },
    { actor, tenant, correlationId, entityId: payload.purchaseOrderId, entityType: 'purchase_order' }
  );

  return { purchaseOrderId: payload.purchaseOrderId, state: 'REJECTED' };
};

// ─── CANCEL PURCHASE ORDER ────────────────────────────────────────────────────

const handleCancelPurchaseOrder: CommandHandler<CancelPurchaseOrderPayload, { purchaseOrderId: string; state: POState }> = async (
  command: CommandEnvelope<CancelPurchaseOrderPayload>
) => {
  const { payload, actor, tenant, correlationId } = command;
  const supabase = getSupabase();
  const now = new Date().toISOString();

  if (supabase) {
    await supabase
      .from('purchase_orders')
      .update({ state: 'CANCELLED', updated_at: now })
      .eq('id', payload.purchaseOrderId)
      .eq('organization_id', tenant.organizationId);
  } else {
    const local = await getLocalPOs();
    const po = local.find(p => p.id === payload.purchaseOrderId);
    if (po) {
      po.state = 'CANCELLED';
      po.updatedAt = now;
      await saveLocalPO(po);
    }
  }

  kernelEventBus.publish(
    'PURCHASE_ORDER_CANCELLED',
    { purchaseOrderId: payload.purchaseOrderId, reason: payload.reason },
    { actor, tenant, correlationId, entityId: payload.purchaseOrderId, entityType: 'purchase_order' }
  );

  return { purchaseOrderId: payload.purchaseOrderId, state: 'CANCELLED' };
};

// ─── REGISTRATION ─────────────────────────────────────────────────────────────

let _registered = false;

/**
 * Registers all Purchase Order command handlers and policies.
 * Must be called once at application startup (e.g., in main.tsx or App.tsx).
 */
export function registerPurchaseOrderHandlers(): void {
  if (_registered) return;
  _registered = true;

  // Register governance policies.
  registerPurchaseOrderPolicies();

  // Register command handlers with the global CommandBus.
  kernelCommandBus.registerHandler(COMMAND_CREATE_PO, handleCreatePurchaseOrder);
  kernelCommandBus.registerHandler(COMMAND_APPROVE_PO, handleApprovePurchaseOrder);
  kernelCommandBus.registerHandler(COMMAND_REJECT_PO, handleRejectPurchaseOrder);
  kernelCommandBus.registerHandler(COMMAND_CANCEL_PO, handleCancelPurchaseOrder);
}

// ─── CONVENIENCE DISPATCHERS ──────────────────────────────────────────────────

/**
 * Creates a new Purchase Order via the kernel command pipeline.
 * Automatically routes through authorization, policy, and approval gates.
 */
export async function createPurchaseOrder(
  payload: CreatePurchaseOrderPayload,
  context: Parameters<typeof kernelCommandBus.dispatch>[2]
): Promise<CommandResult<PurchaseOrder>> {
  return kernelCommandBus.dispatch<CreatePurchaseOrderPayload, PurchaseOrder>(
    COMMAND_CREATE_PO,
    payload,
    {
      ...context,
      entityType: 'purchase_order',
      amount: payload.amount,
    }
  );
}

/**
 * Approves a Purchase Order via the kernel command pipeline.
 */
export async function approvePurchaseOrder(
  payload: ApprovePurchaseOrderPayload,
  context: Parameters<typeof kernelCommandBus.dispatch>[2]
): Promise<CommandResult<PurchaseOrder>> {
  return kernelCommandBus.dispatch<ApprovePurchaseOrderPayload, PurchaseOrder>(
    COMMAND_APPROVE_PO,
    payload,
    {
      ...context,
      entityType: 'purchase_order',
      entityId: payload.purchaseOrderId,
    }
  );
}
