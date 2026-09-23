import { describe, it, expect, beforeEach } from 'vitest';
import { ControlPolicyService } from '../../services/ControlPolicyService';
import { KernelCommandBus } from '../../kernel/CommandBus';
import { KernelAuditEngine } from '../../kernel/AuditEngine';
import { AuthorizationActor } from '../../kernel/authorization/AuthorizationEngine';

describe('Admin Control Center Unification & Governance Tests', () => {
  let policyService: ControlPolicyService;
  let commandBus: KernelCommandBus;
  let auditEngine: KernelAuditEngine;

  const mockAdminActor: AuthorizationActor = {
    id: 'usr_admin_001',
    type: 'USER',
    name: 'Admin User',
    roles: ['platform_admin', 'organization_admin'],
    organizationId: 'tenant_enterprise_alpha',
  };

  const mockNonAdminActor: AuthorizationActor = {
    id: 'usr_viewer_001',
    type: 'USER',
    name: 'Viewer User',
    roles: ['viewer'],
    organizationId: 'tenant_enterprise_alpha',
  };

  const mockAIAgentActor: AuthorizationActor = {
    id: 'ai_copilot_001',
    type: 'AI_AGENT',
    name: 'Orion Autonomy Agent',
    roles: ['ai_agent'],
    organizationId: 'tenant_enterprise_alpha',
  };

  const tenantA = 'tenant_enterprise_alpha';
  const tenantB = 'tenant_enterprise_beta';

  beforeEach(() => {
    policyService = ControlPolicyService.getInstance();
    commandBus = KernelCommandBus.getInstance();
    auditEngine = KernelAuditEngine.getInstance();
  });

  describe('1. Authoritative Policy Fetch & Tenant Isolation', () => {
    it('returns null or default when no custom policy has been saved yet', async () => {
      const policy = await policyService.getPolicy(tenantA, 'custom-nonexistent-capability');
      expect(policy).toBeNull();
    });

    it('enforces multi-tenant isolation so Tenant B cannot view Tenant A state mutations', async () => {
      // Update policy for Tenant A
      const resA = await policyService.updatePolicy({
        actor: mockAdminActor,
        tenantId: tenantA,
        organizationId: tenantA,
        domainId: 'users-rbac',
        capabilityId: 'role-management',
        mode: 'AI Copilot',
        policy: 'Strict',
        scope: 'Capability',
        approvalRequired: true,
        enabled: true,
      });

      expect(resA.success).toBe(true);

      // Verify Tenant A has updated policy
      const polA = await policyService.getPolicy(tenantA, 'role-management');
      expect(polA?.mode).toBe('AI Copilot');
      expect(polA?.policy).toBe('Strict');
      expect(polA?.tenantId).toBe(tenantA);

      // Tenant B should not see Tenant A's policy
      const polB = await policyService.getPolicy(tenantB, 'role-management');
      expect(polB).toBeNull();
    });
  });

  describe('2. Governed Mutation via CommandBus & RBAC Authorization', () => {
    it('allows platform_admin to update control policies', async () => {
      const updateResult = await policyService.updatePolicy({
        actor: mockAdminActor,
        tenantId: tenantA,
        organizationId: tenantA,
        domainId: 'security',
        capabilityId: 'security-controls',
        mode: 'Manual',
        policy: 'Strict',
        scope: 'Domain',
        approvalRequired: true,
        enabled: true,
      });

      expect(updateResult.success).toBe(true);
      const saved = await policyService.getPolicy(tenantA, 'security-controls');
      expect(saved?.policy).toBe('Strict');
      expect(saved?.version).toBeGreaterThan(0);
    });

    it('rejects unauthorized users from mutating policies', async () => {
      const nonAdminResult = await policyService.updatePolicy({
        actor: mockNonAdminActor,
        tenantId: tenantA,
        organizationId: tenantA,
        domainId: 'security',
        capabilityId: 'security-controls',
        mode: 'AI Autopilot',
        policy: 'Relaxed',
        scope: 'Capability',
        approvalRequired: false,
        enabled: true,
      });

      expect(nonAdminResult.success).toBe(false);
      expect(nonAdminResult.errorCode).toBe('UNAUTHORIZED');
    });

    it('strictly forbids AI Agents from directly mutating control policies', async () => {
      // Direct mutation by AI_AGENT must fail - AI must go through proposals!
      const aiResult = await policyService.updatePolicy({
        actor: mockAIAgentActor,
        tenantId: tenantA,
        organizationId: tenantA,
        domainId: 'security',
        capabilityId: 'security-controls',
        mode: 'AI Autopilot',
        policy: 'Relaxed',
        scope: 'Capability',
        approvalRequired: false,
        enabled: true,
      });

      expect(aiResult.success).toBe(false);
      expect(aiResult.errorCode).toBe('UNAUTHORIZED');
    });
  });

  describe('3. Governed AI Proposals & Human-in-the-Loop Safeguards', () => {
    it('allows AI Agents to create proposals with risk and rationale', async () => {
      const proposal = await policyService.createAIProposal({
        tenantId: tenantA,
        organizationId: tenantA,
        domainId: 'inventory',
        capabilityId: 'replenishment',
        risk: 'Low',
        proposerActor: {
          id: mockAIAgentActor.id,
          name: mockAIAgentActor.name || 'AI',
          type: 'AI_AGENT',
          roles: mockAIAgentActor.roles,
        },
        currentState: { mode: 'Manual', policy: 'Standard', scope: 'Capability' },
        proposedState: { mode: 'AI Copilot', policy: 'Strict', scope: 'Capability' },
        reason: 'Lead-time variance reduced by 40% across supplier nodes',
      });

      expect(proposal.id).toBeDefined();
      expect(proposal.status).toBe('PENDING');
      expect(proposal.risk).toBe('Low');
      expect(proposal.domainId).toBe('inventory');
    });

    it('rejects AI Agents from approving or self-approving proposals', async () => {
      const proposal = await policyService.createAIProposal({
        tenantId: tenantA,
        organizationId: tenantA,
        domainId: 'transportation',
        capabilityId: 'route-optimization',
        risk: 'High',
        proposerActor: {
          id: mockAIAgentActor.id,
          name: mockAIAgentActor.name || 'AI',
          type: 'AI_AGENT',
          roles: mockAIAgentActor.roles,
        },
        currentState: { mode: 'Manual', policy: 'Standard', scope: 'Capability' },
        proposedState: { mode: 'AI Autopilot', policy: 'Strict', scope: 'Capability' },
        reason: 'Severe weather avoidance requirement',
      });

      // AI attempting to approve must be blocked by aiSecurityGuard
      await expect(
        policyService.resolveProposal({
          proposalId: proposal.id,
          decision: 'APPROVED',
          approver: mockAIAgentActor,
          comments: 'AI self-approval attempt',
        })
      ).rejects.toThrow();
    });

    it('allows authorized human administrators to approve proposals and updates policy', async () => {
      const proposal = await policyService.createAIProposal({
        tenantId: tenantA,
        organizationId: tenantA,
        domainId: 'forecasting',
        capabilityId: 'demand-sensing',
        risk: 'Medium',
        proposerActor: {
          id: mockAIAgentActor.id,
          name: mockAIAgentActor.name || 'AI',
          type: 'AI_AGENT',
          roles: mockAIAgentActor.roles,
        },
        currentState: { mode: 'Manual', policy: 'Standard', scope: 'Capability' },
        proposedState: { mode: 'AI Copilot', policy: 'Strict', scope: 'Capability' },
        reason: 'Consensus demand model calibrated',
      });

      const res = await policyService.resolveProposal({
        proposalId: proposal.id,
        decision: 'APPROVED',
        approver: mockAdminActor,
        comments: 'Approved after reviewing calibration metrics',
      });

      expect(res.success).toBe(true);

      // Verify proposal is recorded as APPROVED
      const proposals = await policyService.listProposals(tenantA);
      const matched = proposals.find(p => p.id === proposal.id);
      expect(matched?.status).toBe('APPROVED');
      expect(matched?.reviewedBy).toBe(mockAdminActor.name);

      // Verify the policy was automatically applied to the domain capability
      const updatedPolicy = await policyService.getPolicy(tenantA, 'demand-sensing');
      expect(updatedPolicy?.mode).toBe('AI Copilot');
    });
  });

  describe('4. Simulation & Scenario Engine Zero-Mutation Guarantee', () => {
    it('executes simulation with realistic metrics while guaranteeing ZERO production state mutations', async () => {
      // Read initial policy or ensure baseline exists
      await policyService.updatePolicy({
        actor: mockAdminActor,
        tenantId: tenantA,
        organizationId: tenantA,
        domainId: 'inventory',
        capabilityId: 'stock-reallocation',
        mode: 'Manual',
        policy: 'Standard',
        scope: 'Capability',
        approvalRequired: true,
        enabled: true,
      });

      const beforePolicy = await policyService.getPolicy(tenantA, 'stock-reallocation');
      expect(beforePolicy?.mode).toBe('Manual');

      // Run simulation on hypothetical AI Autopilot configuration
      const simResult = await policyService.simulatePolicy({
        tenantId: tenantA,
        domainId: 'inventory',
        domainName: 'Inventory',
        capabilityId: 'stock-reallocation',
        capabilityName: 'Stock Reallocation',
        mode: 'AI Autopilot',
        policy: 'Strict',
        scope: 'Domain',
        actor: mockAdminActor,
      });

      expect(simResult.id).toBeDefined();
      expect(simResult.simulationMode).toBe(true);
      expect(simResult.result).toContain('0 production records modified');

      // Verify production state is completely unchanged
      const afterPolicy = await policyService.getPolicy(tenantA, 'stock-reallocation');
      expect(afterPolicy?.mode).toBe('Manual');
      expect(afterPolicy?.version).toBe(beforePolicy?.version);
    });
  });
});
