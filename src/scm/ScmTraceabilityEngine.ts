/**
 * ORION-9 WAVE 4 — SCM TRANSACTION TRACEABILITY ENGINE
 * Constructs N-tier transaction lineage trees across the entire supply chain lifecycle.
 */

import { poLifecycleEngine } from './POLifecycleEngine';
import { sourcingEngine } from './SourcingEngine';
import { inboundLogisticsEngine } from './InboundLogisticsEngine';
import { receivingGRNEngine } from './ReceivingGRNEngine';
import { invoicingMatchingEngine } from './InvoicingMatchingEngine';

export interface ScmTraceNode {
  type: string;
  id: string;
  status: string;
  referenceId?: string;
  details?: Record<string, any>;
  children?: ScmTraceNode[];
}

export class ScmTraceabilityEngine {
  private static instance: ScmTraceabilityEngine;

  private constructor() {}

  public static getInstance(): ScmTraceabilityEngine {
    if (!ScmTraceabilityEngine.instance) {
      ScmTraceabilityEngine.instance = new ScmTraceabilityEngine();
    }
    return ScmTraceabilityEngine.instance;
  }

  public getTraceForPO(tenantId: string, poId: string): ScmTraceNode | undefined {
    const po = poLifecycleEngine.getPO(tenantId, poId);
    if (!po) return undefined;

    const node: ScmTraceNode = {
      type: 'PurchaseOrder',
      id: po.poId,
      status: po.status,
      details: { poNumber: po.poNumber, totalAmount: po.totalAmount, supplierId: po.supplierId },
      children: [],
    };

    if (po.prId) {
      const pr = sourcingEngine.getPR(tenantId, po.prId);
      if (pr) {
        node.children!.push({
          type: 'PurchaseRequisition',
          id: pr.prId,
          status: pr.status,
          details: { department: pr.department, priority: pr.priority },
        });
      }
    }

    if (po.rfqId) {
      const rfq = sourcingEngine.getRFQ(tenantId, po.rfqId);
      if (rfq) {
        node.children!.push({
          type: 'RFQ',
          id: rfq.rfqId,
          status: rfq.status,
          details: { title: rfq.title },
        });
      }
    }

    return node;
  }
}

export const scmTraceabilityEngine = ScmTraceabilityEngine.getInstance();
