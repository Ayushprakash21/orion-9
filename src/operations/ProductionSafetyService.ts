/**
 * ORION-9 WAVE 10: ENTERPRISE PRODUCTION CONTROL PLANE
 * ProductionSafetyService: Emergency Kill Switches & Production Write Locks
 */

import { ProductionSafetyControls } from './types';
import { observabilityService } from './ObservabilityService';

export class ProductionSafetyService {
  private static instance: ProductionSafetyService;
  private controls: Map<string, ProductionSafetyControls> = new Map(); // tenantId -> controls

  private constructor() {
    this.seedDefaultControls();
  }

  public static getInstance(): ProductionSafetyService {
    if (!ProductionSafetyService.instance) {
      ProductionSafetyService.instance = new ProductionSafetyService();
    }
    return ProductionSafetyService.instance;
  }

  private seedDefaultControls(): void {
    const defaultGlobal: ProductionSafetyControls = {
      tenantId: 'GLOBAL',
      maintenanceMode: false,
      productionWriteLock: false,
      aiActionKillSwitch: false,
      autonomousWorkflowKillSwitch: false,
      readOnlyMode: false,
      updatedAt: new Date().toISOString(),
      updatedBy: 'SYSTEM_BOOT',
    };
    this.controls.set('GLOBAL', defaultGlobal);
  }

  public getControls(tenantId: string = 'GLOBAL'): ProductionSafetyControls {
    const specific = this.controls.get(tenantId);
    if (specific) return specific;

    // Default to global
    const globalControls = this.controls.get('GLOBAL')!;
    return {
      ...globalControls,
      tenantId,
    };
  }

  public updateControls(
    tenantId: string,
    updates: Partial<ProductionSafetyControls>,
    updatedBy: string,
    reason?: string
  ): ProductionSafetyControls {
    const existing = this.getControls(tenantId);
    const updated: ProductionSafetyControls = {
      ...existing,
      ...updates,
      tenantId,
      updatedAt: new Date().toISOString(),
      updatedBy,
      reason,
    };

    this.controls.set(tenantId, updated);

    observabilityService.warn(`[SAFETY_CONTROLS_UPDATED] Safety controls modified for ${tenantId} by ${updatedBy}`, {
      tenantId,
      context: { updates, reason },
    });

    return updated;
  }

  /**
   * Asserts whether an action is allowed given the active safety controls.
   */
  public assertMutationAllowed(params: {
    tenantId: string;
    isAiAgent: boolean;
    isWorkflowEngine: boolean;
    actionType: 'READ' | 'WRITE';
    userRole?: string;
  }): { allowed: boolean; reason?: string } {
    const controls = this.getControls(params.tenantId);
    const globalControls = this.getControls('GLOBAL');

    // 1. Read-only check
    if (params.actionType === 'WRITE' && (controls.readOnlyMode || globalControls.readOnlyMode)) {
      return { allowed: false, reason: 'Platform is in READ-ONLY mode. Mutations are prohibited.' };
    }

    // 2. Maintenance mode
    if (controls.maintenanceMode || globalControls.maintenanceMode) {
      if (params.userRole !== 'platform_admin') {
        return { allowed: false, reason: 'Platform is in MAINTENANCE MODE. Only Platform Admins may perform operations.' };
      }
    }

    // 3. Production Write Lock
    if (params.actionType === 'WRITE' && (controls.productionWriteLock || globalControls.productionWriteLock)) {
      if (params.userRole !== 'platform_admin') {
        return { allowed: false, reason: 'Production Write Lock is ACTIVE. Writes are temporarily restricted.' };
      }
    }

    // 4. AI Action Kill Switch
    if (params.isAiAgent && (controls.aiActionKillSwitch || globalControls.aiActionKillSwitch)) {
      return { allowed: false, reason: 'AI Action Kill Switch is ENGAGED. Autonomous AI actions are paused.' };
    }

    // 5. Autonomous Workflow Kill Switch
    if (params.isWorkflowEngine && (controls.autonomousWorkflowKillSwitch || globalControls.autonomousWorkflowKillSwitch)) {
      return { allowed: false, reason: 'Autonomous Workflow Kill Switch is ENGAGED. Workflows require human approval.' };
    }

    return { allowed: true };
  }
}

export const productionSafetyService = ProductionSafetyService.getInstance();
