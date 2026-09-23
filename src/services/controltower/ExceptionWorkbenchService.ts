/**
 * ORION-9 SCM CONTROL TOWER — EXCEPTION WORKBENCH & GOVERNED ACTION SERVICE
 * Manages the complete lifecycle of operational exceptions and executes
 * governed corrective actions strictly through the Orion Kernel CommandBus.
 */

import {
  ExceptionWorkbenchItem,
  ExceptionWorkbenchStatus,
  ExceptionWorkbenchActionType,
  ControlTowerDomain,
} from './types';
import { ExceptionIntelligence, Signal, DecisionOption, Prediction, RootCause } from '../../intelligence/types';
import { rootCauseEngine } from '../../intelligence/RootCauseEngine';
import { predictionEngine } from '../../intelligence/PredictionEngine';
import { decisionOptionEngine } from '../../intelligence/DecisionOptionEngine';
import { decisionEvaluationEngine } from '../../intelligence/DecisionEvaluationEngine';
import { recommendationEngine } from '../../intelligence/RecommendationEngine';
import { decisionReplayEngine } from '../../intelligence/DecisionReplayEngine';
import { outcomeIntelligence } from '../../intelligence/OutcomeIntelligence';
import { kernelCommandBus } from '../../kernel/CommandBus';
import { AuthorizationActor } from '../../kernel/authorization/AuthorizationEngine';
import { getFirebaseFirestore } from '../../lib/firebaseClient';
import { doc, setDoc, Firestore } from 'firebase/firestore';
import '../../kernel/handlers/ScmCommandHandler';

export class ExceptionWorkbenchService {
  private static instance: ExceptionWorkbenchService;
  private workbenchItems: Map<string, ExceptionWorkbenchItem> = new Map();
  private firestore: Firestore | null = null;

  private constructor() {
    try {
      this.firestore = getFirebaseFirestore();
    } catch {
      this.firestore = null;
    }
  }

  public static getInstance(): ExceptionWorkbenchService {
    if (!ExceptionWorkbenchService.instance) {
      ExceptionWorkbenchService.instance = new ExceptionWorkbenchService();
    }
    return ExceptionWorkbenchService.instance;
  }

  private getKey(tenantId: string, id: string): string {
    return `${tenantId}:${id}`;
  }

  /**
   * Initialize a workbench item from an ExceptionIntelligence object.
   */
  public async createWorkbenchItem(
    tenantId: string,
    exception: ExceptionIntelligence,
    signals: Signal[] = []
  ): Promise<ExceptionWorkbenchItem> {
    const now = new Date().toISOString();
    const item: ExceptionWorkbenchItem = {
      id: `WB-${exception.exceptionId}`,
      tenantId,
      exceptionId: exception.exceptionId,
      domain: (exception.category?.toLowerCase() || 'logistics') as ControlTowerDomain,
      title: exception.summary || exception.type,
      severity: exception.severity as any,
      status: 'OPEN',
      slaDeadline: new Date(Date.now() + (exception.slaMinutes || 120) * 60000).toISOString(),
      slaMinutesRemaining: exception.slaMinutes || 120,
      isBreached: false,
      capitalAtRisk: exception.financialImpact || 25000,
      signals,
      predictions: [],
      decisionOptions: [],
      history: [
        {
          action: 'ACKNOWLEDGE',
          actor: { 
            id: 'system', 
            type: 'SYSTEM', 
            name: 'Control Tower Bridge',
            roles: ['system_admin'],
            organizationId: tenantId,
          },
          timestamp: now,
          notes: 'Exception ingested and opened in Control Tower workbench.',
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    const key = this.getKey(tenantId, item.id);
    this.workbenchItems.set(key, item);

    if (this.firestore) {
      try {
        const ref = doc(this.firestore, 'exceptions', item.id);
        await setDoc(ref, item);
      } catch (err) {
        // Fall back to memory
      }
    }

    return item;
  }

  /**
   * Run automated diagnostic and decision option formulation for a workbench item.
   */
  public async investigateAndFormulate(
    tenantId: string,
    itemId: string,
    actor: AuthorizationActor
  ): Promise<ExceptionWorkbenchItem> {
    const key = this.getKey(tenantId, itemId);
    const item = this.workbenchItems.get(key);
    if (!item) {
      throw new Error(`Workbench item ${itemId} not found for tenant ${tenantId}`);
    }

    // 1. Root Cause Diagnosis
    const exceptionObj: ExceptionIntelligence = {
      exceptionId: item.exceptionId,
      tenantId,
      summary: item.title,
      type: item.title,
      category: (item.domain.toUpperCase() as any) || 'LOGISTICS',
      severity: item.severity,
      status: 'OPEN',
      entityReferences: [{ entityType: 'SCM_ENTITY', entityId: item.exceptionId }],
      slaMinutes: item.slaMinutesRemaining,
      financialImpact: item.capitalAtRisk,
      detectedAt: item.createdAt,
      createdAt: item.createdAt,
    };

    const rootCause = await rootCauseEngine.diagnoseRootCause(exceptionObj, item.signals);
    item.rootCause = rootCause;

    // 2. Calibrated Prediction
    const predictions = await predictionEngine.generatePredictions({
      tenantId,
      shipments: item.domain === 'logistics' ? [{
        id: item.exceptionId,
        delayDays: 4,
        status: 'DELAYED',
        estimatedArrival: new Date().toISOString(),
      }] : undefined,
    });
    item.predictions = predictions;

    // 3. Decision Options Formulation
    const primaryPrediction: Prediction = predictions[0] || {
      predictionId: 'PRED-FALLBACK',
      tenantId,
      modelVersion: '1.0',
      entityType: 'SHIPMENT',
      entityId: item.exceptionId,
      predictionType: 'SHIPMENT_DELAY_PROBABILITY',
      predictedValue: 4,
      probability: 0.85,
      confidence: 0.9,
      horizon: '7d',
      evidence: ['Historical transit telemetry'],
      modelStatus: 'RULE_BASED',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };

    const options = decisionOptionEngine.generateOptions({
      decisionId: `DEC-${item.id}`,
      exception: exceptionObj,
      rootCause,
      prediction: primaryPrediction,
    });
    item.decisionOptions = options;

    // 4. Recommendation Formulation
    const { recommendation } = await recommendationEngine.formulateRecommendation({
      tenantId,
      exception: exceptionObj,
      rootCause,
      prediction: primaryPrediction,
    });
    item.recommendedOptionId = recommendation.recommendedOption.optionId;

    // Update Status
    item.status = 'PROPOSAL_PENDING';
    item.updatedAt = new Date().toISOString();
    item.history.push({
      action: 'INVESTIGATE',
      actor,
      timestamp: item.updatedAt,
      notes: `Investigated with root cause (${rootCause.summary}) and formulated ${options.length} decision options.`,
    });

    return item;
  }

  /**
   * Execute a Governed Action through Kernel CommandBus.
   */
  public async executeGovernedAction(
    tenantId: string,
    itemId: string,
    optionId: string,
    actor: AuthorizationActor,
    notes?: string
  ): Promise<{
    item: ExceptionWorkbenchItem;
    commandResult: any;
  }> {
    const key = this.getKey(tenantId, itemId);
    const item = this.workbenchItems.get(key);
    if (!item) {
      throw new Error(`Workbench item ${itemId} not found for tenant ${tenantId}`);
    }

    const selectedOption = item.decisionOptions.find((o) => o.optionId === optionId);
    if (!selectedOption) {
      throw new Error(`Option ${optionId} not found on workbench item ${itemId}`);
    }

    item.status = 'ACTION_EXECUTING';
    const executionTimestamp = new Date().toISOString();

    // Map action type to Kernel command
    let commandType = 'CREATE_PURCHASE_REQUISITION';
    let commandPayload: Record<string, any> = {
      tenantId,
      requisitionNumber: `PR-CORR-${Date.now().toString(36).toUpperCase()}`,
      requestorId: actor.id,
      department: 'Supply Chain Operations',
      estimatedAmount: selectedOption.expectedCost || 5000,
      businessJustification: `Corrective action for exception ${item.exceptionId}: ${selectedOption.description}`,
      lines: [
        {
          productId: 'SKU-EXPEDITE',
          quantity: 1,
          estimatedUnitPrice: selectedOption.expectedCost || 5000,
        },
      ],
    };

    if (selectedOption.actionType === 'TRANSFER_INVENTORY') {
      commandType = 'CREATE_EXCEPTION';
      commandPayload = {
        tenantId,
        exceptionId: `EXC-REALLOC-${Date.now()}`,
        type: 'INVENTORY_REALLOCATION',
        severity: 'MEDIUM',
        notes: `Inventory transfer ordered to mitigate ${item.exceptionId}`,
      };
    } else if (selectedOption.actionType === 'EXPEDITE_SHIPMENT') {
      commandType = 'CREATE_ASN';
      commandPayload = {
        tenantId,
        asnNumber: `ASN-EXP-${Date.now().toString(36).toUpperCase()}`,
        poId: item.exceptionId,
        supplierId: 'SUP-EXPEDITE',
        carrierName: 'Air Freight Priority',
        trackingNumber: `TRK-EXP-${Date.now()}`,
        estimatedArrival: new Date(Date.now() + 86400000).toISOString(),
        lines: [{ poLineId: 'LINE-1', productId: 'SKU-01', quantityShipped: 100 }],
      };
    }

    // Execute via KernelCommandBus
    const commandResult = await kernelCommandBus.dispatch(
      commandType,
      commandPayload,
      {
        actor: {
          id: actor.id,
          type: (actor.type as any) || 'USER',
          name: actor.name,
          role: (actor.roles && actor.roles[0]) || 'operations_director',
        },
        tenant: {
          organizationId: tenantId,
        },
        entityId: item.exceptionId,
        entityType: 'CONTROL_TOWER_EXCEPTION',
        correlationId: item.id,
      }
    );

    if (commandResult.success) {
      item.status = 'RESOLVED';
      item.actionExecutedAt = executionTimestamp;
      item.executionResult = {
        success: true,
        transactionId: commandResult.commandId,
        message: `Action executed successfully: ${commandType}`,
      };

      // Record in Replay Engine
      await decisionReplayEngine.createSnapshot({
        replayId: `REP-${item.id}`,
        decisionId: `DEC-${item.id}`,
        tenantId,
        contextSnapshot: {
          signals: item.signals,
          exception: {
            exceptionId: item.exceptionId,
            tenantId,
            summary: item.title,
            type: item.title,
            category: (item.domain.toUpperCase() as any) || 'LOGISTICS',
            severity: item.severity,
            status: 'RESOLVED',
            entityReferences: [],
            slaMinutes: 0,
            financialImpact: item.capitalAtRisk,
            detectedAt: item.createdAt,
            createdAt: item.createdAt,
          },
          rootCause: item.rootCause,
          prediction: item.predictions[0],
        },
        optionsSnapshot: item.decisionOptions,
        evaluationSnapshot: item.decisionOptions.map((o) => decisionEvaluationEngine.evaluateOption(o)),
        recommendationSnapshot: {
          recommendationId: `REC-${item.id}`,
          decisionId: `DEC-${item.id}`,
          tenantId,
          recommendedOptionId: selectedOption.optionId,
          recommendedOption: selectedOption,
          alternatives: item.decisionOptions.filter((o) => o.optionId !== selectedOption.optionId),
          rationale: 'Highest multi-dimensional evaluation score',
          evidenceReferences: ['Evaluation matrix'],
          confidence: 0.95,
          policyReferences: ['POL-AUTO-01'],
          approvalRequirement: {
            required: false,
            thresholdValue: 10000,
            requiredRole: 'buyer',
            policyRuleId: 'POL-AUTO-01',
          },
          status: 'ACCEPTED',
          createdAt: executionTimestamp,
        },
      });

      // Record Empirical Outcome
      await outcomeIntelligence.recordOutcome({
        tenantId,
        decisionId: `DEC-${item.id}`,
        actionTaken: selectedOption.actionType,
        expectedCost: selectedOption.expectedCost,
        actualCost: selectedOption.expectedCost,
        expectedDelayDays: 1,
        actualDelayDays: 1,
        expectedServiceImpact: selectedOption.expectedServiceImpact,
        actualServiceImpact: 'Target Service Protected',
        predictedProbability: 0.9,
        actualEventOccurred: true,
      });

      item.history.push({
        action: 'EXECUTE_GOVERNED_ACTION',
        actor,
        timestamp: executionTimestamp,
        notes: notes || `Executed ${selectedOption.description} via Kernel Command ${commandType}`,
      });
    } else {
      item.status = 'PROPOSAL_PENDING';
      item.executionResult = {
        success: false,
        message: commandResult.error || 'Execution blocked by Kernel governance',
      };
      item.history.push({
        action: 'EXECUTE_GOVERNED_ACTION',
        actor,
        timestamp: executionTimestamp,
        notes: `Execution rejected: ${commandResult.error}`,
      });
    }

    item.updatedAt = new Date().toISOString();

    return { item, commandResult };
  }

  /**
   * Close or resolve a workbench item.
   */
  public async closeItem(
    tenantId: string,
    itemId: string,
    actor: AuthorizationActor,
    notes?: string
  ): Promise<ExceptionWorkbenchItem> {
    const key = this.getKey(tenantId, itemId);
    const item = this.workbenchItems.get(key);
    if (!item) {
      throw new Error(`Workbench item ${itemId} not found for tenant ${tenantId}`);
    }

    item.status = 'CLOSED';
    item.updatedAt = new Date().toISOString();
    item.history.push({
      action: 'CLOSE',
      actor,
      timestamp: item.updatedAt,
      notes: notes || 'Exception marked closed in Control Tower.',
    });

    return item;
  }

  public getWorkbenchItem(tenantId: string, itemId: string): ExceptionWorkbenchItem | undefined {
    return this.workbenchItems.get(this.getKey(tenantId, itemId));
  }

  public listWorkbenchItems(tenantId: string): ExceptionWorkbenchItem[] {
    const results: ExceptionWorkbenchItem[] = [];
    for (const [key, item] of this.workbenchItems.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        results.push(item);
      }
    }
    return results;
  }

  public reset(): void {
    this.workbenchItems.clear();
  }
}

export const exceptionWorkbenchService = ExceptionWorkbenchService.getInstance();
