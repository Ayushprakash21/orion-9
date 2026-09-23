import { describe, it, expect, beforeEach } from 'vitest';
import { masterDataService } from '../../data/MasterDataService';
import { aiSecurityGuard } from '../../ai/AISecurityGuard';

describe('MasterDataStewardshipLifecycle', () => {
  beforeEach(() => {
    // Reset service state
  });

  it('progresses a record through full governance lifecycle: DRAFT -> VALIDATED -> DUPLICATE_CHECKED -> APPROVAL_PENDING -> ACTIVE', () => {
    const proposed = masterDataService.proposeRecord({
      entityType: 'PRODUCT',
      data: {
        id: 'TEST-SKU-100',
        name: 'Carbon Fiber Strut',
        category: 'COMPOSITES',
        unitCost: 120,
        sellingPrice: 240,
        uom: 'EA',
      },
      sourceSystemType: 'SAP',
      actor: 'Procurement Specialist',
    });

    expect(proposed.state).toBe('DRAFT');
    expect(proposed.version).toBe(1);

    // Validate
    const valResult = masterDataService.validateRecord(proposed.id, 'System Validator');
    expect(valResult.isValid).toBe(true);
    expect(masterDataService.getRecord(proposed.id)?.state).toBe('VALIDATED');

    // Duplicate Check
    masterDataService.checkDuplicates(proposed.id, [], 'System Validator');
    expect(masterDataService.getRecord(proposed.id)?.state).toBe('DUPLICATE_CHECKED');

    // Submit for Approval
    const pending = masterDataService.submitForApproval(proposed.id, 'Procurement Lead');
    expect(pending.state).toBe('APPROVAL_PENDING');

    // Activate (Golden Record Creation)
    const activated = masterDataService.activateRecord(proposed.id, 'Lead Steward', 'Verified and compliant');
    expect(activated.state).toBe('ACTIVE');

    // Golden Record Verification
    const golden = masterDataService.getGoldenRecord('PRODUCT', proposed.id);
    expect(golden).toBeDefined();
    expect(golden?.version).toBe(1);
    expect(golden?.payload.name).toBe('Carbon Fiber Strut');
  });

  it('creates version N+1 upon update of an existing record', () => {
    const proposed = masterDataService.proposeRecord({
      entityType: 'PRODUCT',
      data: {
        id: 'SKU-VER-01',
        name: 'Initial Name',
        unitCost: 10,
        uom: 'EA',
      },
      sourceSystemType: 'MANUAL',
      actor: 'Admin',
    });

    masterDataService.validateRecord(proposed.id, 'System');
    masterDataService.checkDuplicates(proposed.id, [], 'System');
    masterDataService.submitForApproval(proposed.id, 'Admin');
    masterDataService.activateRecord(proposed.id, 'Lead Steward');

    // Update
    const updated = masterDataService.updateRecord(
      proposed.id,
      { name: 'Updated Name V2', unitCost: 15 },
      'Steward',
      'Price change update'
    );

    expect(updated.version).toBe(2);
    expect(updated.state).toBe('DRAFT');
  });

  it('allows rejection of records with auditable rejection comments', () => {
    const proposed = masterDataService.proposeRecord({
      entityType: 'SUPPLIER',
      data: { id: 'SUP-REJECT-01', name: 'Faulty Vendor' },
      sourceSystemType: 'MANUAL',
      actor: 'Buyer',
    });

    const rejected = masterDataService.rejectRecord(proposed.id, 'Lead Steward', 'Incomplete compliance documents');
    expect(rejected.state).toBe('REJECTED');
  });

  it('enforces AI security guard prohibiting AI agents from approving master data stewardship', () => {
    const aiApprover = {
      id: 'orion-autonomous-agent-01',
      name: 'Orion Auto Steward',
      type: 'AI_AGENT' as const,
      roles: ['ai_agent'],
    };

    const humanRequester = {
      id: 'human-user-01',
      name: 'Jane Doe',
      type: 'HUMAN_USER' as const,
      roles: ['procurement_specialist'],
    };

    expect(() => {
      aiSecurityGuard.assertCanApprove(aiApprover as any, humanRequester as any);
    }).toThrow(/AI Self-Approval Violation/);
  });
});
