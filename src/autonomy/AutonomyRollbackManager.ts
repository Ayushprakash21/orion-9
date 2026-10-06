import { AutonomyDecision } from './types';
import { kernelCommandBus } from '../kernel';

export interface RollbackRecord {
  rollbackId: string;
  decisionId: string;
  executionId: string;
  reason: string;
  success: boolean;
  timestamp: string;
}

export class AutonomyRollbackManager {
  private static rollbackLog: RollbackRecord[] = [];

  /**
   * Executes compensation transaction or rollback logic when an autonomous action fails or fails verification
   */
  public static async rollbackDecision(
    decision: AutonomyDecision,
    executionId: string,
    reason: string
  ): Promise<RollbackRecord> {
    const rollbackId = `roll-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    try {
      // Attempt safe compensation command via Kernel CommandBus
      await kernelCommandBus.dispatch(
        'CANCEL_ACTION',
        {
          decisionId: decision.decisionId,
          executionId,
          reason: `Autonomous Rollback: ${reason}`,
          tenantId: decision.tenantId
        },
        {
          actor: {
            id: 'SYSTEM_ROLLBACK_ENGINE',
            type: 'SYSTEM',
            role: 'platform_admin'
          },
          tenant: {
            tenantId: decision.tenantId,
            organizationId: decision.tenantId
          },
          entityType: 'purchase_order',
          requiredPermission: 'purchase_order:cancel',
          correlationId: `roll-corr-${rollbackId}`
        }
      );

      const record: RollbackRecord = {
        rollbackId,
        decisionId: decision.decisionId,
        executionId,
        reason,
        success: true,
        timestamp: new Date().toISOString()
      };

      this.rollbackLog.push(record);
      return record;
    } catch (err: any) {
      const record: RollbackRecord = {
        rollbackId,
        decisionId: decision.decisionId,
        executionId,
        reason: `Rollback failed: ${err.message || 'Unknown error'}`,
        success: false,
        timestamp: new Date().toISOString()
      };

      this.rollbackLog.push(record);
      return record;
    }
  }

  public static getRollbackLogs(): RollbackRecord[] {
    return [...this.rollbackLog];
  }
}
