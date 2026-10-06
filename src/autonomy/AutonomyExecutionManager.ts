import { AutonomyDecision } from './types';
import { kernelCommandBus } from '../kernel';
import { AutonomyRollbackManager } from './AutonomyRollbackManager';
import { AutonomyOutcomeManager } from './AutonomyOutcomeManager';

export interface ExecutionResult {
  success: boolean;
  decisionId: string;
  executionId: string;
  commandType: string;
  resultPayload: any;
  error?: string;
  timestamp: string;
}

export class AutonomyExecutionManager {
  private static executionHistory: Map<string, ExecutionResult> = new Map();

  /**
   * Executes a pre-approved or governed autonomous decision via the Kernel CommandBus
   */
  public static async executeDecision(
    decision: AutonomyDecision,
    commandType: string,
    commandPayload: Record<string, any>,
    actor: { id: string; role: string; isAi: boolean }
  ): Promise<ExecutionResult> {
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // AI Safety Guard: Verify non-bypassing Kernel Execution
    if (!commandType || typeof commandPayload !== 'object') {
      return {
        success: false,
        decisionId: decision.decisionId,
        executionId,
        commandType: commandType || 'UNKNOWN',
        resultPayload: null,
        error: 'AI Safety Guard Violation: Execution must specify valid Kernel command payload.',
        timestamp: new Date().toISOString()
      };
    }

    try {
      // Dispatch via Authoritative Kernel CommandBus
      const kernelResponse = await kernelCommandBus.dispatch(
        commandType,
        {
          ...commandPayload,
          decisionId: decision.decisionId,
          autonomyLevel: decision.calculatedAutonomyLevel,
          tenantId: decision.tenantId
        },
        {
          actor: {
            id: actor.id,
            type: (actor.isAi ? 'AI_AGENT' : 'SYSTEM') as any,
            role: 'platform_admin',
            agentId: actor.id
          },
          tenant: {
            tenantId: decision.tenantId,
            organizationId: decision.tenantId
          },
          entityType: 'purchase_order',
          requiredPermission: 'purchase_order:create',
          correlationId: `corr-${executionId}`
        }
      );

      const payload = (kernelResponse as any).data ?? kernelResponse.result;

      // 3. VERIFY EXECUTION RESULT
      const verified = this.verifyExecutionResult(commandType, payload);

      if (!verified) {
        // Trigger closed-loop rollback / self-healing
        await AutonomyRollbackManager.rollbackDecision(decision, executionId, 'Verification check failed after Kernel dispatch');
        throw new Error('Closed-loop verification failed post-execution');
      }

      const execResult: ExecutionResult = {
        success: true,
        decisionId: decision.decisionId,
        executionId,
        commandType,
        resultPayload: payload,
        timestamp: new Date().toISOString()
      };

      this.executionHistory.set(executionId, execResult);

      // 4. RECORD OUTCOME & LEARNING LOOP
      AutonomyOutcomeManager.recordOutcome(decision, execResult);

      return execResult;
    } catch (err: any) {
      const failedResult: ExecutionResult = {
        success: false,
        decisionId: decision.decisionId,
        executionId,
        commandType,
        resultPayload: null,
        error: err.message || 'Execution error',
        timestamp: new Date().toISOString()
      };

      this.executionHistory.set(executionId, failedResult);
      await AutonomyRollbackManager.rollbackDecision(decision, executionId, err.message);

      return failedResult;
    }
  }

  /**
   * Verifies that the executed command produced the intended state change
   */
  private static verifyExecutionResult(commandType: string, payload: any): boolean {
    if (!payload) return false;
    if (payload.status === 'FAILED' || payload.error) return false;
    return true;
  }

  public static getExecutionResult(executionId: string): ExecutionResult | undefined {
    return this.executionHistory.get(executionId);
  }
}
