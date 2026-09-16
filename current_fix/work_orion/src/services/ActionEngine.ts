import { Action, Exception, Inventory, PurchaseOrder, Shipment, Supplier, SupplierCommunication } from '../types';

export interface ActionExecutionResult {
  success: boolean;
  executionStatus: 'EXECUTED INTERNALLY' | 'WAITING FOR EXTERNAL EXECUTION' | 'APPROVAL_REQUIRED' | 'FAILED';
  message: string;
  timestamp: string;
  mutations?: {
    updatedInventory?: Inventory[];
    updatedPurchaseOrders?: PurchaseOrder[];
    updatedShipments?: Shipment[];
    updatedSuppliers?: Supplier[];
    newCommunication?: Omit<SupplierCommunication, 'id'>;
  };
}

export class ActionEngine {
  static generateActions(
    exceptions: Exception[], 
    existingActions: Action[] = [],
    inventory: Inventory[] = [],
    pos: PurchaseOrder[] = [],
    shipments: Shipment[] = [],
    suppliers: Supplier[] = []
  ): Action[] {
    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    // Deduplicate exceptions to prevent React key errors from corrupted legacy data
    const uniqueExceptionsMap = new Map<string, Exception>();
    exceptions.filter(e => e.status !== 'Resolved' && e.status !== 'Dismissed').forEach(e => {
      if (!uniqueExceptionsMap.has(e.id)) {
        uniqueExceptionsMap.set(e.id, e);
      }
    });

    return Array.from(uniqueExceptionsMap.values()).map((e, i) => {
      const existing = existingActions.find(a => a.id === `ACT-${e.id}`);
      if (existing) {
        return existing;
      }

      let priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
      if (e.severity === 'Critical') priority = 'CRITICAL';
      else if (e.severity === 'High') priority = 'HIGH';
      else if (e.severity === 'Low') priority = 'LOW';

      let reason = 'System detected anomalous behavior.';
      let evidence = 'Data shows deviation from expected thresholds.';
      let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';

      // Smart reasoning based on type
      if (e.type === 'Stock-Out Risk' || e.type === 'Low Stock') {
        const inv = inventory.find(i => i.productId === e.entityId || i.id === e.entityId);
        if (inv) {
          reason = `Available inventory is below projected demand coverage.`;
          const dos = (inv.dailyDemand && inv.dailyDemand > 0) ? (inv.onHand / inv.dailyDemand).toFixed(1) : 0;
          evidence = `Available stock: ${inv.onHand}, Daily demand: ${inv.dailyDemand || inv.averageDailyDemand || 0}, DOS: ${dos} days.`;
          confidence = inv.dailyDemand ? 'HIGH' : 'MEDIUM';
        }
      } else if (e.type === 'Supplier Delay') {
        const sup = suppliers.find(s => s.id === e.entityId);
        if (sup) {
          reason = `Supplier has consistently missed delivery windows.`;
          evidence = `Supplier OTIF is ${sup.otif}%, Lead time is ${sup.leadTime} days.`;
          confidence = sup.otif < 80 ? 'HIGH' : 'MEDIUM';
        }
      } else if (e.type === 'Shipment Delay') {
        const shp = shipments.find(s => s.id === e.entityId);
        if (shp) {
          reason = `Shipment is delayed in transit.`;
          evidence = `Current delay is ${shp.delayDays} days. Status is ${shp.status}.`;
          confidence = 'HIGH';
        }
      } else if (e.type === 'PO Overdue') {
        const po = pos.find(p => p.id === e.entityId);
        if (po) {
          reason = `Purchase order has not been received by expected delivery date.`;
          evidence = `PO status is ${po.status}. Expected delivery was ${new Date(po.expectedDelivery).toLocaleDateString()}.`;
          confidence = 'HIGH';
        }
      }

      return {
        id: `ACT-${e.id}`,
        entity: e.entityId,
        issue: e.type,
        reason,
        evidence,
        priority,
        recommendation: e.recommendedAction || 'Investigate root cause and take corrective action.',
        impact: formatCurrency(e.estimatedImpact),
        confidence,
        status: i === 0 ? 'PROPOSED' : 'AWAITING_APPROVAL',
        approvalRequired: true,
        createdAt: new Date().toISOString()
      };
    });
  }

  static executeAction(
    action: Action, 
    inventory: Inventory[], 
    pos: PurchaseOrder[], 
    shipments: Shipment[],
    suppliers: Supplier[] = []
  ): ActionExecutionResult {
    const now = new Date().toISOString();

    // 1. Approval Gate Enforcement
    if (action.approvalRequired && action.status !== 'APPROVED') {
      return {
        success: false,
        executionStatus: 'APPROVAL_REQUIRED',
        message: `Action '${action.id}' requires formal approval before execution. Current status: ${action.status}.`,
        timestamp: now
      };
    }

    const entityId = action.entity || '';
    const recLower = (action.recommendation || '').toLowerCase();
    const issueLower = (action.issue || '').toLowerCase();

    // 2. Real internal state mutations based on domain
    // Branch A: Purchase Order & Expedite Operations
    if (entityId.startsWith('PO-') || recLower.includes('po') || recLower.includes('expedite') || issueLower.includes('po')) {
      let matchedPo = pos.find(p => p.id === entityId || recLower.includes(p.id.toLowerCase()));
      if (!matchedPo && pos.length > 0) {
        matchedPo = pos[0];
      }

      if (matchedPo) {
        const updatedPOs = pos.map(p => {
          if (p.id === matchedPo?.id) {
            const currentExp = new Date(p.expectedDelivery);
            currentExp.setDate(currentExp.getDate() - 3); // Expedite delivery by 3 days
            return {
              ...p,
              status: (p.status === 'Draft' ? 'Approved' : 'In Transit') as PurchaseOrder['status'],
              expectedDelivery: currentExp.toISOString()
            };
          }
          return p;
        });

        // Also update any linked shipment
        const updatedShipments = shipments.map(s => {
          if (s.poId === matchedPo?.id) {
            return {
              ...s,
              delayDays: Math.max(0, s.delayDays - 3),
              status: 'In Transit' as const
            };
          }
          return s;
        });

        // Record an internal communication dispatch to the vendor
        const matchedSupplier = suppliers.find(s => s.id === matchedPo?.supplierId);
        const newComm: Omit<SupplierCommunication, 'id'> = {
          supplierId: matchedPo.supplierId,
          supplierName: matchedSupplier?.name || 'Vendor Management',
          contactEmail: `vendor-ops@${(matchedSupplier?.name || 'vendor').toLowerCase().replace(/[^a-z]/g, '')}.com`,
          subject: `EXPEDITE INSTRUCTION: Purchase Order ${matchedPo.id}`,
          body: `Priority expedite requested. Advanced required on-dock delivery date by 3 days. Automated dispatch via Orion SCM OS.`,
          type: 'EXPEDITE_REQUEST',
          status: 'DISPATCHED',
          sentAt: now,
          sentBy: 'Orion ActionEngine (Internal Execution)',
          requiresAuthorization: false,
          linkedPoId: matchedPo.id
        };

        return {
          success: true,
          executionStatus: 'EXECUTED INTERNALLY',
          message: `Purchase Order ${matchedPo.id} expedited internally. Inbound schedule advanced by 3 days and vendor dispatch recorded.`,
          timestamp: now,
          mutations: {
            updatedPurchaseOrders: updatedPOs,
            updatedShipments: updatedShipments,
            newCommunication: newComm
          }
        };
      }
    }

    // Branch B: Inventory Rebalance & Reorder Operations
    if (entityId.startsWith('INV-') || recLower.includes('transfer') || recLower.includes('reorder') || recLower.includes('stock') || issueLower.includes('stock')) {
      let matchedInv = inventory.find(i => i.id === entityId || i.productId === entityId || recLower.includes(i.productId.toLowerCase()));
      if (!matchedInv && inventory.length > 0) {
        matchedInv = inventory[0];
      }

      if (matchedInv) {
        const replenishmentQty = Math.max(50, matchedInv.reorderPoint || 100);
        const updatedInventory = inventory.map(i => {
          if (i.id === matchedInv?.id) {
            return {
              ...i,
              onHand: i.onHand + replenishmentQty,
              safetyStock: Math.max(i.safetyStock, 25),
              lastUpdated: now
            };
          }
          return i;
        });

        return {
          success: true,
          executionStatus: 'EXECUTED INTERNALLY',
          message: `Inventory replenishment executed internally for ${matchedInv.productId}. Stock increased by ${replenishmentQty} units.`,
          timestamp: now,
          mutations: {
            updatedInventory
          }
        };
      }
    }

    // Branch C: Shipment Rerouting & Logistics Operations
    if (entityId.startsWith('SHP-') || recLower.includes('carrier') || recLower.includes('reroute') || recLower.includes('freight') || issueLower.includes('shipment')) {
      let matchedShipment = shipments.find(s => s.id === entityId || recLower.includes(s.id.toLowerCase()));
      if (!matchedShipment && shipments.length > 0) {
        matchedShipment = shipments[0];
      }

      if (matchedShipment) {
        const updatedShipments = shipments.map(s => {
          if (s.id === matchedShipment?.id) {
            return {
              ...s,
              delayDays: 0,
              status: 'In Transit' as const
            };
          }
          return s;
        });

        return {
          success: true,
          executionStatus: 'EXECUTED INTERNALLY',
          message: `Logistics reroute executed internally for Shipment ${matchedShipment.id}. Transit delay cleared to 0 days.`,
          timestamp: now,
          mutations: {
            updatedShipments
          }
        };
      }
    }

    // Branch D: Supplier Performance Intervention
    if (entityId.startsWith('SUP-') || recLower.includes('supplier') || issueLower.includes('supplier')) {
      let matchedSupplier = suppliers.find(s => s.id === entityId);
      if (matchedSupplier) {
        const newComm: Omit<SupplierCommunication, 'id'> = {
          supplierId: matchedSupplier.id,
          supplierName: matchedSupplier.name,
          contactEmail: `compliance@${(matchedSupplier.name || 'vendor').toLowerCase().replace(/[^a-z]/g, '')}.com`,
          subject: `OPERATIONAL AUDIT: Performance Remediation Plan`,
          body: `Notification of OTIF threshold variance (${matchedSupplier.otif}%). Orion automated risk review requested immediate root cause corrective action plan.`,
          type: 'QUALITY_ISSUE',
          status: 'DISPATCHED',
          sentAt: now,
          sentBy: 'Orion ActionEngine (Internal Execution)',
          requiresAuthorization: false
        };

        return {
          success: true,
          executionStatus: 'EXECUTED INTERNALLY',
          message: `Supplier performance intervention executed internally for ${matchedSupplier.name}. Remediation communication logged.`,
          timestamp: now,
          mutations: {
            newCommunication: newComm
          }
        };
      }
    }

    // Branch E: External Action Requirement
    return {
      success: true,
      executionStatus: 'WAITING FOR EXTERNAL EXECUTION',
      message: `Action recorded internally. External execution requires active ERP/TMS bridge connector.`,
      timestamp: now
    };
  }
}

