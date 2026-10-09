/**
 * ORION-9 PROJECT MANAGEMENT, AR/AP, INVOICING & FLOW TRACKER INTEGRATION TESTS
 * Verifies end-to-end functionality for:
 * 1. Project Management Center (Projects, Tasks, Kanban, Budget Variance, SCM Linkage)
 * 2. Accounts Receivable (AR) & Dynamic 5-Bucket Aging
 * 3. Accounts Payable (AP) & 3-Way Matching Engine
 * 4. Unified Supply Chain Flow Tracker (O2C & P2P Pipelines, Milestones, Exceptions)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectManagementEngine } from '../../core/projects/ProjectManagementEngine';
import { FlowTrackerEngine } from '../../core/flow/FlowTrackerEngine';
import { financialLedgerEngine } from '../../scm/FinancialLedgerEngine';

describe('Project Management Engine', () => {
  const tenantId = 'test-tenant-proj-01';
  let projectEngine: ProjectManagementEngine;

  beforeEach(() => {
    projectEngine = ProjectManagementEngine.getInstance();
  });

  it('creates and retrieves a project with budget and milestones', async () => {
    const project = await projectEngine.createProject({
      tenantId,
      name: 'Cold-Chain Warehouse Expansion',
      description: 'Expand frozen storage capacity by 40% across Dallas DC',
      category: 'INFRASTRUCTURE',
      priority: 'HIGH',
      status: 'PLANNING',
      owner: 'Sarah Connor',
      startDate: '2026-10-01',
      targetEndDate: '2027-04-30',
      budget: {
        allocated: 500000,
        spent: 75000,
        committed: 120000,
        currency: 'USD',
      },
      milestones: [
        {
          id: 'ms-1',
          title: 'Site Engineering Approval',
          dueDate: '2026-11-15',
          completed: false,
        },
      ],
      risks: [
        {
          id: 'risk-1',
          title: 'Refrigerant Supply Chain Bottleneck',
          severity: 'HIGH',
          mitigation: 'Dual source suppliers in EU and NA',
          status: 'OPEN',
        },
      ],
      linkedScmEntities: [],
    });

    expect(project.id).toBeDefined();
    expect(project.name).toBe('Cold-Chain Warehouse Expansion');
    expect((project.budget as any).allocated).toBe(500000);

    const fetched = await projectEngine.getProject(tenantId, project.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.owner).toBe('Sarah Connor');
  });

  it('manages task lifecycle, Kanban status transitions, and progress recalculation', async () => {
    const project = await projectEngine.createProject({
      tenantId,
      name: 'Automated Guided Vehicle Deployment',
      description: 'AGV fleet setup for picking optimization',
      category: 'LOGISTICS',
      priority: 'CRITICAL',
      status: 'ACTIVE',
      owner: 'Alex Vance',
      startDate: '2026-10-01',
      targetEndDate: '2027-01-31',
      budget: { allocated: 250000, spent: 10000, committed: 40000, currency: 'USD' },
      milestones: [],
      risks: [],
      linkedScmEntities: [],
    });

    const task1 = await projectEngine.createTask({
      tenantId,
      projectId: project.id,
      title: 'Sensor Calibration on AGV-01 through AGV-10',
      status: 'TODO',
      priority: 'HIGH',
      assignee: 'Marcus Brody',
      estimatedHours: 40,
    });

    const task2 = await projectEngine.createTask({
      tenantId,
      projectId: project.id,
      title: 'Charging Dock Electrical Certification',
      status: 'TODO',
      priority: 'MEDIUM',
      assignee: 'Elena Fisher',
      estimatedHours: 20,
    });

    expect(task1.id).toBeDefined();
    expect(task2.id).toBeDefined();

    // Transition task 1 to DONE
    const updatedTask1 = await projectEngine.updateTaskStatus(tenantId, task1.id, 'DONE');
    expect(updatedTask1.status).toBe('DONE');
    expect(updatedTask1.completedAt).toBeDefined();

    // Verify project progress is now 50% (1 of 2 tasks completed)
    const refreshedProject = await projectEngine.getProject(tenantId, project.id);
    expect(refreshedProject?.progressPercentage).toBe(50);
  });

  it('links SCM entities (POs and Shipments) to projects', async () => {
    const project = await projectEngine.createProject({
      tenantId,
      name: 'Supplier Dual-Sourcing Transition',
      description: 'Transition electronic components from Single Source to Dual Source',
      category: 'SUPPLIER_ONBOARDING',
      priority: 'MEDIUM',
      status: 'ACTIVE',
      owner: 'David Kim',
      startDate: '2026-10-01',
      targetEndDate: '2026-12-31',
      budget: { allocated: 100000, spent: 15000, committed: 20000, currency: 'USD' },
      milestones: [],
      risks: [],
      linkedScmEntities: [],
    });

    const updated = await projectEngine.linkScmEntity(tenantId, project.id, {
      entityType: 'PURCHASE_ORDER',
      entityId: 'PO-2026-8801',
      referenceNumber: 'PO-2026-8801',
      description: 'Initial qualification batch order',
      amount: 45000,
    });

    expect(updated.linkedScmEntities.length).toBe(1);
    expect(updated.linkedScmEntities[0].entityType).toBe('PURCHASE_ORDER');
    expect(updated.linkedScmEntities[0].amount).toBe(45000);
  });

  it('accurately computes budget variance metrics', async () => {
    const project = await projectEngine.createProject({
      tenantId,
      name: 'Budget Test Project',
      description: 'Checking variance calculations',
      category: 'INVENTORY_REDUCTION',
      priority: 'LOW',
      status: 'ACTIVE',
      owner: 'Finance Team',
      startDate: '2026-10-01',
      targetEndDate: '2026-12-31',
      budget: { allocated: 100000, spent: 70000, committed: 40000, currency: 'USD' }, // Total committed+spent = 110,000 (Over budget)
      milestones: [],
      risks: [],
      linkedScmEntities: [],
    });

    const variance = projectEngine.calculateBudgetVariance(project);
    expect(variance.totalCommittedAndSpent).toBe(110000);
    expect(variance.varianceAmount).toBe(-10000);
    expect(variance.isOverBudget).toBe(true);
    expect(variance.status).toBe('OVER_BUDGET');
  });
});

describe('Accounts Receivable (AR) & 5-Bucket Aging', () => {
  const tenantId = 'test-tenant-ar-02';

  it('generates customer invoice with line items, calculating totals and taxes', () => {
    const invoice = financialLedgerEngine.generateCustomerInvoice({
      tenantId,
      orderId: 'SO-TEST-901',
      customerId: 'CUST-BIOPHARMA-01',
      subtotal: 10000,
      taxAmount: 800,
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      currency: 'USD',
      lineItems: [
        {
          lineItemId: 'line-1',
          sku: 'SKU-BIO-01',
          description: 'Reagent Kit Alpha',
          quantity: 20,
          unitPrice: 500,
          taxRate: 0.08,
          lineTotal: 10800,
        },
      ],
    });

    expect(invoice.invoiceId).toBeDefined();
    expect(invoice.totalAmount).toBe(10800);
    expect(invoice.outstandingBalance).toBe(10800);
    expect(['ISSUED', 'UNPAID']).toContain(invoice.status);
    expect(invoice.lineItems?.length).toBe(1);
    expect(invoice.arAgingBucket).toBe('CURRENT');
  });

  it('calculates 5-bucket AR aging correctly based on due dates', () => {
    const today = new Date();

    // 1. Current (due in future)
    financialLedgerEngine.generateCustomerInvoice({
      tenantId,
      orderId: 'SO-AGING-CURRENT',
      customerId: 'CUST-A',
      subtotal: 5000,
      taxAmount: 0,
      dueDate: new Date(today.getTime() + 10 * 86400000).toISOString().split('T')[0],
    });

    // 2. 1-30 days past due (due 15 days ago)
    financialLedgerEngine.generateCustomerInvoice({
      tenantId,
      orderId: 'SO-AGING-1-30',
      customerId: 'CUST-B',
      subtotal: 3000,
      taxAmount: 0,
      dueDate: new Date(today.getTime() - 15 * 86400000).toISOString().split('T')[0],
    });

    // 3. 31-60 days past due (due 45 days ago)
    financialLedgerEngine.generateCustomerInvoice({
      tenantId,
      orderId: 'SO-AGING-31-60',
      customerId: 'CUST-C',
      subtotal: 2000,
      taxAmount: 0,
      dueDate: new Date(today.getTime() - 45 * 86400000).toISOString().split('T')[0],
    });

    // 4. 61-90 days past due (due 75 days ago)
    financialLedgerEngine.generateCustomerInvoice({
      tenantId,
      orderId: 'SO-AGING-61-90',
      customerId: 'CUST-D',
      subtotal: 1500,
      taxAmount: 0,
      dueDate: new Date(today.getTime() - 75 * 86400000).toISOString().split('T')[0],
    });

    // 5. 90+ days past due (due 100 days ago)
    financialLedgerEngine.generateCustomerInvoice({
      tenantId,
      orderId: 'SO-AGING-90-PLUS',
      customerId: 'CUST-E',
      subtotal: 1000,
      taxAmount: 0,
      dueDate: new Date(today.getTime() - 100 * 86400000).toISOString().split('T')[0],
    });

    const aging = financialLedgerEngine.calculateArAging(tenantId, today.toISOString());

    expect(aging.CURRENT).toBeGreaterThanOrEqual(5000);
    expect(aging.BUCKET_1_30).toBeGreaterThanOrEqual(3000);
    expect(aging.BUCKET_31_60).toBeGreaterThanOrEqual(2000);
    expect(aging.BUCKET_61_90).toBeGreaterThanOrEqual(1500);
    expect(aging.BUCKET_90_PLUS).toBeGreaterThanOrEqual(1000);
    expect(aging.totalOutstanding).toBeGreaterThanOrEqual(12500);
  });

  it('allocates remittance across multiple customer invoices with partial and full settlement', () => {
    const inv1 = financialLedgerEngine.generateCustomerInvoice({
      tenantId,
      orderId: 'SO-ALLOC-1',
      customerId: 'CUST-MULTI-PAY',
      subtotal: 6000,
      taxAmount: 0,
      dueDate: '2026-11-01',
    });

    const inv2 = financialLedgerEngine.generateCustomerInvoice({
      tenantId,
      orderId: 'SO-ALLOC-2',
      customerId: 'CUST-MULTI-PAY',
      subtotal: 4000,
      taxAmount: 0,
      dueDate: '2026-11-01',
    });

    // Allocate payment: $6,000 for inv1 (fully paid), $2,000 for inv2 (partially paid)
    const result = financialLedgerEngine.allocateCustomerPayment(tenantId, {
      customerId: 'CUST-MULTI-PAY',
      paymentAmount: 8000,
      referenceNumber: 'WIRE-MULTI-8812',
      paymentMethod: 'WIRE',
      allocations: [
        { invoiceId: inv1.invoiceId, amount: 6000 },
        { invoiceId: inv2.invoiceId, amount: 2000 },
      ],
    });

    expect(result.paymentRecord.paymentId).toBeDefined();
    expect(result.paymentRecord.totalAmount).toBe(8000);
    expect(result.paymentRecord.allocations.length).toBe(2);

    const updatedInv1 = result.updatedInvoices.find(i => i.invoiceId === inv1.invoiceId);
    const updatedInv2 = result.updatedInvoices.find(i => i.invoiceId === inv2.invoiceId);

    expect(updatedInv1?.outstandingBalance).toBe(0);
    expect(updatedInv1?.status).toBe('PAID');

    expect(updatedInv2?.outstandingBalance).toBe(2000);
    expect(updatedInv2?.status).toBe('PARTIALLY_PAID');
  });
});

describe('Accounts Payable (AP) & 3-Way Matching Engine', () => {
  const tenantId = 'test-tenant-ap-03';

  it('completes 3-way match within tolerance thresholds', () => {
    const match = financialLedgerEngine.performThreeWayMatch(tenantId, {
      poId: 'PO-AP-MATCH-01',
      grnId: 'GRN-AP-MATCH-01',
      supplierInvoiceId: 'INV-SUP-MATCH-01',
      lines: [
        {
          poQuantity: 100,
          grnAcceptedQuantity: 100,
          invoiceQuantity: 100,
          poUnitPrice: 50,
          invoiceUnitPrice: 50.5, // 1% variance, within 2% tolerance
        },
      ],
      priceTolerancePercentage: 2.0,
      quantityTolerancePercentage: 1.0,
    });

    expect(match.matchStatus).toBe('3_WAY_MATCHED');
    expect(match.hasQuantityVariance).toBe(false);
    expect(match.hasPriceVariance).toBe(false);
  });

  it('detects quantity discrepancy exceeding tolerance', () => {
    const match = financialLedgerEngine.performThreeWayMatch(tenantId, {
      poId: 'PO-AP-QTY-DISC',
      grnId: 'GRN-AP-QTY-DISC',
      supplierInvoiceId: 'INV-SUP-QTY-DISC',
      lines: [
        {
          poQuantity: 100,
          grnAcceptedQuantity: 80, // 20 units missing from GRN
          invoiceQuantity: 100, // Invoiced full 100
          poUnitPrice: 50,
          invoiceUnitPrice: 50,
        },
      ],
      priceTolerancePercentage: 2.0,
      quantityTolerancePercentage: 1.0,
    });

    expect(match.matchStatus).toBe('DISCREPANCY_QUANTITY');
    expect(match.hasQuantityVariance).toBe(true);
  });

  it('detects price discrepancy exceeding tolerance', () => {
    const match = financialLedgerEngine.performThreeWayMatch(tenantId, {
      poId: 'PO-AP-PRICE-DISC',
      grnId: 'GRN-AP-PRICE-DISC',
      supplierInvoiceId: 'INV-SUP-PRICE-DISC',
      lines: [
        {
          poQuantity: 100,
          grnAcceptedQuantity: 100,
          invoiceQuantity: 100,
          poUnitPrice: 50,
          invoiceUnitPrice: 60, // 20% price increase, exceeds 2% tolerance
        },
      ],
      priceTolerancePercentage: 2.0,
      quantityTolerancePercentage: 1.0,
    });

    expect(match.matchStatus).toBe('DISCREPANCY_PRICE');
    expect(match.hasPriceVariance).toBe(true);
    expect(match.varianceAmount).toBe(1000);
  });

  it('schedules and executes AP payments in sequence', () => {
    const apRecord = financialLedgerEngine.createSupplierApRecord({
      tenantId,
      supplierInvoiceId: 'INV-SUP-FLOW-01',
      supplierId: 'SUPPLIER-CHEMS-INC',
      poId: 'PO-FLOW-909',
      totalPayableAmount: 18500,
      dueDate: '2026-11-20',
      matchStatus: '3_WAY_MATCHED',
    });

    expect(apRecord.paymentStatus).toBe('UNPAID');

    const scheduled = financialLedgerEngine.scheduleApPayment(
      tenantId,
      apRecord.apId,
      '2026-11-15',
      'WIRE'
    );
    expect(scheduled.paymentStatus).toBe('SCHEDULED');
    expect(scheduled.scheduledPaymentDate).toBe('2026-11-15');

    const paid = financialLedgerEngine.executeApPayment(
      tenantId,
      apRecord.apId,
      'FEDWIRE-DISBURSE-99214'
    );
    expect(paid.paymentStatus).toBe('PAID');
    expect(paid.outstandingBalance).toBe(0);
  });
});

describe('Unified Supply Chain Flow Tracker', () => {
  const tenantId = 'test-tenant-flow-04';
  let flowEngine: FlowTrackerEngine;

  beforeEach(() => {
    flowEngine = FlowTrackerEngine.getInstance();
  });

  it('creates an Order-to-Cash (O2C) pipeline with all initial stages', async () => {
    const flow = await flowEngine.createFlow({
      tenantId,
      flowId: `flow-o2c-test-${Date.now()}`,
      flowType: 'ORDER_TO_CASH',
      entityId: 'SO-O2C-8812',
      referenceNumber: 'SO-O2C-8812',
      counterpartyName: 'Precision Health Systems',
      currentStage: 'ORDER_CREATED',
      status: 'IN_PROGRESS',
      stages: [],
      exceptions: [],
      linkedDocuments: [
        {
          documentType: 'SALES_ORDER',
          documentId: 'SO-O2C-8812',
          reference: 'SO-O2C-8812',
          date: '2026-10-09',
        },
      ],
      totalAmount: 75000,
      currency: 'USD',
      sla: {
        targetCompletionDate: '2026-10-16',
        isBreached: false,
      },
    });

    expect(flow.id).toBeDefined();
    expect(flow.stages.length).toBe(7); // 7 O2C stages
    expect(flow.stages[0].id).toBe('ORDER_CREATED');
    expect(flow.stages[0].status).toBe('ACTIVE');
    expect(flow.stages[1].status).toBe('PENDING');
  });

  it('advances flow stages and activates subsequent milestones', async () => {
    const flow = await flowEngine.createFlow({
      tenantId,
      flowId: `flow-o2c-adv-${Date.now()}`,
      flowType: 'ORDER_TO_CASH',
      entityId: 'SO-O2C-ADV',
      referenceNumber: 'SO-O2C-ADV',
      counterpartyName: 'Global Bio Labs',
      currentStage: 'ORDER_CREATED',
      status: 'IN_PROGRESS',
      stages: [],
      exceptions: [],
      linkedDocuments: [],
      totalAmount: 12000,
      currency: 'USD',
      sla: { targetCompletionDate: '2026-10-20', isBreached: false },
    });

    const advanced = await flowEngine.advanceFlowStage(
      tenantId,
      flow.id,
      'ORDER_CREATED',
      'Sales Ops Lead',
      'Order validated against credit limit'
    );

    const completedStage = advanced.stages.find(s => s.id === 'ORDER_CREATED');
    const nextStage = advanced.stages.find(s => s.id === 'INVENTORY_ALLOCATED');

    expect(completedStage?.status).toBe('COMPLETED');
    expect(completedStage?.completedAt).toBeDefined();
    expect(completedStage?.actor).toBe('Sales Ops Lead');

    expect(nextStage?.status).toBe('ACTIVE');
    expect(advanced.currentStage).toBe('INVENTORY_ALLOCATED');
  });

  it('records, escalates, and resolves operational exceptions', async () => {
    const flow = await flowEngine.createFlow({
      tenantId,
      flowId: `flow-p2p-exc-${Date.now()}`,
      flowType: 'PROCURE_TO_PAY',
      entityId: 'PO-P2P-EXC',
      referenceNumber: 'PO-P2P-EXC',
      counterpartyName: 'Thermo Scientific Tech',
      currentStage: 'IN_TRANSIT',
      status: 'IN_PROGRESS',
      stages: [],
      exceptions: [],
      linkedDocuments: [],
      totalAmount: 45000,
      currency: 'USD',
      sla: { targetCompletionDate: '2026-10-18', isBreached: false },
    });

    // Record exception
    const withException = await flowEngine.recordException(tenantId, flow.id, {
      stage: 'IN_TRANSIT',
      severity: 'CRITICAL',
      type: 'DELIVERY_HOLD',
      title: 'Customs Quarantine at Port of Entry',
      description: 'Shipment held pending FDA import declaration clearance.',
    });

    expect(withException.status).toBe('EXCEPTION');
    expect(withException.exceptions.length).toBe(1);
    expect(withException.exceptions[0].resolved).toBe(false);

    // Resolve exception
    const resolvedFlow = await flowEngine.resolveException(
      tenantId,
      flow.id,
      withException.exceptions[0].id,
      'Compliance Officer J. Doe',
      'Customs broker submitted form 7501, release confirmed.'
    );

    expect(resolvedFlow.status).toBe('IN_PROGRESS');
    expect(resolvedFlow.exceptions[0].resolved).toBe(true);
    expect(resolvedFlow.exceptions[0].resolutionNotes).toContain('Customs broker submitted');
  });

  it('filters and searches flows by reference number and counterparty', async () => {
    await flowEngine.createFlow({
      tenantId,
      flowId: 'flow-search-alpha',
      flowType: 'ORDER_TO_CASH',
      entityId: 'SO-SEARCH-ALPHA',
      referenceNumber: 'SO-SEARCH-ALPHA',
      counterpartyName: 'Astra Biotech International',
      currentStage: 'ORDER_CREATED',
      status: 'IN_PROGRESS',
      stages: [],
      exceptions: [],
      linkedDocuments: [],
      totalAmount: 18000,
      currency: 'USD',
      sla: { targetCompletionDate: '2026-10-30', isBreached: false },
    });

    const results = await flowEngine.listFlows(tenantId, {
      searchTerm: 'Astra',
    });

    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some(r => r.counterpartyName.includes('Astra'))).toBe(true);
  });
});
