/**
 * ORION-9 WAVE 7: AUTONOMOUS OPERATIONS + WORKFLOW ORCHESTRATION
 * SCM Workflow Templates
 * 
 * Pre-configured, versioned, deterministic supply chain workflow definitions.
 * All material steps route exclusively through Kernel CommandBus and approval gates.
 */

import { WorkflowDefinition } from '../types';

export function createSupplierDelayWorkflow(tenantId: string): WorkflowDefinition {
  return {
    workflowId: 'WF-SUPPLIER-DELAY-RESPONSE',
    tenantId,
    name: 'Supplier Disruption & Expedited Recovery',
    description: 'Autonomous detection of inbound vendor delays with risk-gated expedite draft and buyer approval',
    version: '1.0.0',
    status: 'ACTIVE',
    riskClass: 'HIGH',
    autonomyLevel: 'LEVEL_3_APPROVAL_GATED',
    trigger: {
      triggerId: 'TRIG-SUPPLIER-DELAY',
      tenantId,
      sourceType: 'SIGNAL',
      sourceId: 'SIG-SUPPLIER-OTIF-DROP',
      eventType: 'SUPPLIER_DELAY',
      correlationId: 'CORR-SUPPLIER-DELAY',
      timestamp: new Date().toISOString(),
      payloadReference: {}
    },
    steps: [
      {
        stepId: 'ST-01-EVALUATE-DELAY',
        name: 'Evaluate Delay Severity & Safety Stock',
        order: 1,
        type: 'CONDITION',
        condition: {
          id: 'COND-DELAY-SEVERITY',
          operator: 'AND',
          clauses: [
            { field: 'delayDays', operator: 'GREATER_THAN', value: 2 },
            { field: 'daysOfSupply', operator: 'LESS_THAN', value: 7 }
          ]
        }
      },
      {
        stepId: 'ST-02-CREATE-EXCEPTION',
        name: 'Create Supply Disruption Exception',
        order: 2,
        type: 'ACTION',
        action: {
          actionId: 'ACT-CREATE-EXC',
          type: 'CREATE_EXCEPTION',
          payload: { category: 'SUPPLIER', severity: 'HIGH' },
          riskClass: 'LOW',
          isMaterial: false
        }
      },
      {
        stepId: 'ST-03-DRAFT-EXPEDITE',
        name: 'Draft Premium Freight Expedite & Alternate Route',
        order: 3,
        type: 'ACTION',
        action: {
          actionId: 'ACT-DRAFT-EXPEDITE',
          type: 'DRAFT_EXPEDITE',
          payload: { expediteMethod: 'AIR_FREIGHT', estimatedCost: 4500 },
          riskClass: 'HIGH',
          commandType: 'scm:shipment:expedite',
          isMaterial: true
        },
        approval: {
          requiredRole: 'procurement_director',
          timeoutMs: 24 * 60 * 60 * 1000
        },
        compensatingStepId: 'ST-05-CANCEL-EXPEDITE'
      },
      {
        stepId: 'ST-04-NOTIFY-BUYER',
        name: 'Notify Buyer & Operations Lead',
        order: 4,
        type: 'ACTION',
        action: {
          actionId: 'ACT-NOTIFY-BUYER',
          type: 'SEND_NOTIFICATION',
          payload: { message: 'Expedited recovery plan approved and executed' },
          riskClass: 'LOW',
          isMaterial: false
        }
      },
      {
        stepId: 'ST-05-CANCEL-EXPEDITE',
        name: 'Compensate Freight Expedite Reservation',
        order: 5,
        type: 'COMPENSATION',
        action: {
          actionId: 'ACT-COMP-EXPEDITE',
          type: 'COMPENSATE',
          payload: { reason: 'Downstream workflow failure' },
          riskClass: 'MEDIUM',
          commandType: 'scm:compensation:execute',
          isMaterial: true
        }
      }
    ],
    approvalPolicy: {
      requireApprovalForRisk: ['HIGH', 'CRITICAL'],
      disallowAiSelfApproval: true
    },
    createdBy: 'SYSTEM_ADMIN',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function createLowInventoryWorkflow(tenantId: string): WorkflowDefinition {
  return {
    workflowId: 'WF-LOW-INVENTORY-RESPONSE',
    tenantId,
    name: 'Stockout Prevention & Reorder Orchestration',
    description: 'Automated reorder drafting and buffer rebalancing when stock breaches safety thresholds',
    version: '1.0.0',
    status: 'ACTIVE',
    riskClass: 'MEDIUM',
    autonomyLevel: 'LEVEL_4_GOVERNED_AUTONOMOUS',
    trigger: {
      triggerId: 'TRIG-LOW-INVENTORY',
      tenantId,
      sourceType: 'PREDICTION',
      sourceId: 'PRED-STOCKOUT-RISK',
      eventType: 'LOW_INVENTORY',
      correlationId: 'CORR-LOW-INVENTORY',
      timestamp: new Date().toISOString(),
      payloadReference: {}
    },
    steps: [
      {
        stepId: 'ST-11-CHECK-THRESHOLD',
        name: 'Verify Stockout Probability',
        order: 1,
        type: 'CONDITION',
        condition: {
          id: 'COND-STOCKOUT-PROB',
          operator: 'AND',
          clauses: [
            { field: 'stockoutProbability', operator: 'GREATER_THAN', value: 0.75 }
          ]
        }
      },
      {
        stepId: 'ST-12-DRAFT-REORDER',
        name: 'Draft Replenishment PO',
        order: 2,
        type: 'ACTION',
        action: {
          actionId: 'ACT-DRAFT-REORDER',
          type: 'DRAFT_PO_CHANGE',
          payload: { reorderQuantity: 500, reason: 'Automated stockout mitigation' },
          riskClass: 'MEDIUM',
          commandType: 'scm:purchase_order:update',
          isMaterial: true
        }
      }
    ],
    createdBy: 'SYSTEM_ADMIN',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function createShipmentDelayWorkflow(tenantId: string): WorkflowDefinition {
  return {
    workflowId: 'WF-SHIPMENT-DELAY-RESPONSE',
    tenantId,
    name: 'In-Transit Shipment Delay Rerouting',
    description: 'Dynamic carrier telemetry evaluation with automated rerouting recommendations',
    version: '1.0.0',
    status: 'ACTIVE',
    riskClass: 'HIGH',
    autonomyLevel: 'LEVEL_3_APPROVAL_GATED',
    trigger: {
      triggerId: 'TRIG-SHIPMENT-DELAY',
      tenantId,
      sourceType: 'EVENT',
      sourceId: 'EVT-CARRIER-EXCEPTION',
      eventType: 'SHIPMENT_DELAY',
      correlationId: 'CORR-SHIPMENT-DELAY',
      timestamp: new Date().toISOString(),
      payloadReference: {}
    },
    steps: [
      {
        stepId: 'ST-21-CHECK-DELAY',
        name: 'Check Port Congestion & ETA Delta',
        order: 1,
        type: 'CONDITION',
        condition: {
          id: 'COND-ETA-DELTA',
          operator: 'AND',
          clauses: [
            { field: 'etaDelayHours', operator: 'GREATER_THAN', value: 24 }
          ]
        }
      },
      {
        stepId: 'ST-22-DRAFT-REROUTE',
        name: 'Draft Alternate Feeder Port Reroute',
        order: 2,
        type: 'ACTION',
        action: {
          actionId: 'ACT-DRAFT-REROUTE',
          type: 'DRAFT_REROUTE',
          payload: { newPort: 'USLAX_SECONDARY', etaAdjustmentDays: -2 },
          riskClass: 'HIGH',
          commandType: 'scm:shipment:reroute',
          isMaterial: true
        },
        approval: {
          requiredRole: 'admin'
        }
      }
    ],
    createdBy: 'SYSTEM_ADMIN',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function createPOConfirmationEscalationWorkflow(tenantId: string): WorkflowDefinition {
  return {
    workflowId: 'WF-PO-CONFIRMATION-ESCALATION',
    tenantId,
    name: 'Purchase Order Confirmation SLA Escalation',
    description: 'Escalates vendor acknowledgment delays breaching 48-hour SLA contracts',
    version: '1.0.0',
    status: 'ACTIVE',
    riskClass: 'LOW',
    autonomyLevel: 'LEVEL_4_GOVERNED_AUTONOMOUS',
    trigger: {
      triggerId: 'TRIG-PO-CONFIRM-DELAY',
      tenantId,
      sourceType: 'EXCEPTION',
      sourceId: 'EXC-PO-UNACKNOWLEDGED',
      eventType: 'PO_CONFIRMATION_DELAY',
      correlationId: 'CORR-PO-CONFIRM-DELAY',
      timestamp: new Date().toISOString(),
      payloadReference: {}
    },
    steps: [
      {
        stepId: 'ST-31-SEND-VENDOR-REMINDER',
        name: 'Request Automated Supplier EDI Confirmation',
        order: 1,
        type: 'ACTION',
        action: {
          actionId: 'ACT-REQ-CONFIRM',
          type: 'REQUEST_SUPPLIER_CONFIRMATION',
          payload: { noticeType: 'EDI_855_CHASER' },
          riskClass: 'LOW',
          commandType: 'scm:supplier:confirm',
          isMaterial: true
        }
      },
      {
        stepId: 'ST-32-WAIT-CONFIRMATION',
        name: 'Wait for Supplier EDI 855 Acknowledgement',
        order: 2,
        type: 'WAIT_EXTERNAL',
        waitConfig: {
          eventType: 'SUPPLIER_EDI_855_RECEIVED',
          correlationKey: 'PO-1001-ACK',
          timeoutMs: 24 * 60 * 60 * 1000,
          onTimeoutAction: 'ESCALATE'
        }
      }
    ],
    createdBy: 'SYSTEM_ADMIN',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function createCustomerServiceRiskWorkflow(tenantId: string): WorkflowDefinition {
  return {
    workflowId: 'WF-CUSTOMER-SERVICE-RISK',
    tenantId,
    name: 'Customer OTIF SLA Risk Mitigation',
    description: 'Proactively identifies service level agreement breach risks and prioritizes fulfillment allocations',
    version: '1.0.0',
    status: 'ACTIVE',
    riskClass: 'HIGH',
    autonomyLevel: 'LEVEL_3_APPROVAL_GATED',
    trigger: {
      triggerId: 'TRIG-SERVICE-RISK',
      tenantId,
      sourceType: 'DECISION',
      sourceId: 'DEC-SLA-BREACH-RISK',
      eventType: 'SERVICE_RISK',
      correlationId: 'CORR-SERVICE-RISK',
      timestamp: new Date().toISOString(),
      payloadReference: {}
    },
    steps: [
      {
        stepId: 'ST-41-CHECK-RISK-SCORE',
        name: 'Verify SLA Breach Risk Severity',
        order: 1,
        type: 'CONDITION',
        condition: {
          id: 'COND-RISK-SCORE',
          operator: 'AND',
          clauses: [
            { field: 'riskScore', operator: 'GREATER_THAN_OR_EQUAL', value: 80 }
          ]
        }
      },
      {
        stepId: 'ST-42-NOTIFY-ACCOUNT-TEAM',
        name: 'Dispatch Urgent Account Alert',
        order: 2,
        type: 'ACTION',
        action: {
          actionId: 'ACT-NOTIFY-ACCT',
          type: 'SEND_NOTIFICATION',
          payload: { alert: 'Tier 1 customer order delayed; expedited fulfillment suggested' },
          riskClass: 'LOW',
          isMaterial: false
        }
      }
    ],
    createdBy: 'SYSTEM_ADMIN',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function getAllStandardWorkflowTemplates(tenantId: string): WorkflowDefinition[] {
  return [
    createSupplierDelayWorkflow(tenantId),
    createLowInventoryWorkflow(tenantId),
    createShipmentDelayWorkflow(tenantId),
    createPOConfirmationEscalationWorkflow(tenantId),
    createCustomerServiceRiskWorkflow(tenantId)
  ];
}
