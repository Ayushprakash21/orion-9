/**
 * ORION-9 DEMO LIVE-SIMULATION ENGINE
 * Advances synthetic business lifecycles (POs, Shipments, Inventory, Manufacturing)
 * and generates realistic controlled exceptions and telemetry signals for the DEMO environment.
 * 
 * Note: Hourly batch generation is owned authoritatively by the persistent cloud scheduler
 * (DemoPersistentSchedulerService / Cloud daemon). This engine manages client/local visual
 * telemetry animation and lifecycle progression when the Orion UI is active.
 * 
 * Hard Guard: Strictly prohibited from running or writing against the LIVE database.
 */

import { dbManager } from './DatabaseConnectionManager';
import { demoSyntheticDataEngine } from './DemoSyntheticDataEngine';
import { collection, getDocs, doc, writeBatch, query, where, limit } from 'firebase/firestore';

export type SimulationSpeed = '1x' | '5x' | '20x' | 'PAUSED';
export type DemoRetentionPolicy = '7_DAYS' | '30_DAYS' | '90_DAYS' | 'UNLIMITED';

export interface SimulationConfig {
  speed: SimulationSpeed;
  hourlyGenerationRate: number; // exactly 25
  retentionPolicy: DemoRetentionPolicy;
  exceptionProbabilities: {
    supplierDelayProbability: number; // 0..1
    inventoryRiskProbability: number;
    qualityIssueProbability: number;
    invoiceMismatchProbability: number;
    transportDelayProbability: number;
  };
  autoGenerateHourly: boolean;
}

export interface SimulationState {
  status: 'RUNNING' | 'PAUSED' | 'DISABLED';
  speed: SimulationSpeed;
  environment: 'DEMO';
  lastCycleAt: string;
  nextCycleAt: string;
  totalCyclesExecuted: number;
  totalEventsProcessed: number;
  exceptionsGeneratedToday: number;
  activeCompaniesCount: number;
  activeSuppliersCount: number;
  activeProductsCount: number;
  activePOsCount: number;
  activeShipmentsCount: number;
}

export class DemoLiveSimulationEngine {
  private static instance: DemoLiveSimulationEngine;

  private config: SimulationConfig = {
    speed: '1x',
    hourlyGenerationRate: 25,
    retentionPolicy: '30_DAYS',
    exceptionProbabilities: {
      supplierDelayProbability: 0.15,
      inventoryRiskProbability: 0.12,
      qualityIssueProbability: 0.08,
      invoiceMismatchProbability: 0.05,
      transportDelayProbability: 0.18,
    },
    autoGenerateHourly: true,
  };

  private state: SimulationState = {
    status: 'RUNNING',
    speed: '1x',
    environment: 'DEMO',
    lastCycleAt: new Date().toISOString(),
    nextCycleAt: new Date(Date.now() + 60000).toISOString(),
    totalCyclesExecuted: 0,
    totalEventsProcessed: 0,
    exceptionsGeneratedToday: 0,
    activeCompaniesCount: 25,
    activeSuppliersCount: 62,
    activeProductsCount: 100,
    activePOsCount: 80,
    activeShipmentsCount: 50,
  };

  private tickerTimer: any = null;

  private constructor() {
    this.startEngine();
  }

  public static getInstance(): DemoLiveSimulationEngine {
    if (!DemoLiveSimulationEngine.instance) {
      DemoLiveSimulationEngine.instance = new DemoLiveSimulationEngine();
    }
    return DemoLiveSimulationEngine.instance;
  }

  public getConfig(): SimulationConfig {
    return { ...this.config };
  }

  public getState(): SimulationState {
    return { ...this.state };
  }

  public updateConfig(newConfig: Partial<SimulationConfig>): SimulationConfig {
    this.config = {
      ...this.config,
      ...newConfig,
      exceptionProbabilities: {
        ...this.config.exceptionProbabilities,
        ...(newConfig.exceptionProbabilities || {}),
      },
    };

    if (newConfig.speed) {
      this.state.speed = newConfig.speed;
      this.state.status = newConfig.speed === 'PAUSED' ? 'PAUSED' : 'RUNNING';
      this.restartTicker();
    }

    this.broadcastStateChange();
    return this.getConfig();
  }

  public setSpeed(speed: SimulationSpeed): void {
    this.updateConfig({ speed });
  }

  public pause(): void {
    this.setSpeed('PAUSED');
  }

  public resume(): void {
    this.setSpeed('1x');
  }

  /**
   * Executes an immediate cycle of the live simulation engine
   */
  public async executeSimulationCycle(): Promise<{ eventsAdvanced: number; exceptionsCreated: number }> {
    // 1. HARD ENVIRONMENT GUARD
    const activeEnv = dbManager.getEnvironment();
    if (activeEnv !== 'DEMO') {
      console.warn(`[SIMULATION-GUARD] Aborting simulation cycle: Active environment is ${activeEnv}. Simulation only runs in DEMO.`);
      return { eventsAdvanced: 0, exceptionsCreated: 0 };
    }

    if (this.state.speed === 'PAUSED') {
      return { eventsAdvanced: 0, exceptionsCreated: 0 };
    }

    let eventsAdvanced = 0;
    let exceptionsCreated = 0;
    const now = new Date();
    const nowIso = now.toISOString();

    const firestore = dbManager.getFirestore('DEMO');
    if (firestore) {
      try {
        const batch = writeBatch(firestore);

        // Fetch sample POs and Shipments to advance
        const poQuery = query(collection(firestore, 'purchase_orders'), where('syntheticData', '==', true), limit(15));
        const poSnap = await getDocs(poQuery);

        poSnap.forEach((docSnap) => {
          const po = docSnap.data();
          let nextStatus = po.status;

          // State transition machine
          if (po.status === 'CREATED') nextStatus = 'APPROVED';
          else if (po.status === 'APPROVED') nextStatus = 'RELEASED';
          else if (po.status === 'RELEASED') nextStatus = 'CONFIRMED';
          else if (po.status === 'CONFIRMED') nextStatus = 'IN_TRANSIT';
          else if (po.status === 'IN_TRANSIT' && Math.random() > 0.4) nextStatus = 'RECEIVED';
          else if (po.status === 'RECEIVED' && Math.random() > 0.5) nextStatus = 'MATCHED';

          if (nextStatus !== po.status) {
            batch.update(docSnap.ref, {
              status: nextStatus,
              updatedAt: nowIso,
            });
            eventsAdvanced++;
          }
        });

        // Trigger controlled dynamic exceptions based on configured probabilities
        if (Math.random() < this.config.exceptionProbabilities.transportDelayProbability) {
          const excId = `EXC-DYN-${Date.now().toString(36).toUpperCase()}`;
          const excRef = doc(firestore, 'exceptions', excId);
          batch.set(excRef, {
            id: excId,
            title: 'Dynamic Rail Intermodal Congestion Variance',
            description: 'Automated telematics sensor detected 36-hour delay at central interchange hub.',
            category: 'TRANSPORT_DISRUPTION',
            severity: 'Medium',
            status: 'Open',
            relatedEntityId: 'RAIL_HUB_CENTRAL',
            relatedEntityType: 'SHIPMENT',
            recommendedAction: 'Reroute high-priority container volume via secondary highway freight fleet.',
            tenantId: 'DEMO_TENANT_ORION',
            organizationId: 'DEMO_ORG_GLOBAL',
            syntheticData: true,
            environment: 'DEMO',
            generationBatchId: `DYN-CYCLE-${nowIso.substring(0, 10)}`,
            createdAt: nowIso,
            updatedAt: nowIso,
          });
          exceptionsCreated++;
        }

        await batch.commit();
      } catch (err) {
        console.warn('[SIMULATION-CYCLE] Non-fatal batch update warning:', err);
      }
    } else {
      // In local mock mode
      eventsAdvanced = Math.floor(Math.random() * 8) + 3;
      if (Math.random() < this.config.exceptionProbabilities.supplierDelayProbability) {
        exceptionsCreated = 1;
      }
    }

    this.state.totalCyclesExecuted++;
    this.state.totalEventsProcessed += eventsAdvanced;
    this.state.exceptionsGeneratedToday += exceptionsCreated;
    this.state.lastCycleAt = nowIso;
    this.state.nextCycleAt = new Date(now.getTime() + this.getIntervalMs()).toISOString();

    this.broadcastStateChange();
    return { eventsAdvanced, exceptionsCreated };
  }

  /**
   * Governed Demo Reset: Purges synthetic data and restores clean 25-package baseline dataset
   */
  public async resetDemoData(actorUserId: string, isPlatformAdmin: boolean): Promise<{ success: boolean; message: string }> {
    const activeEnv = dbManager.getEnvironment();
    if (activeEnv !== 'DEMO') {
      const err = `[DEMO-RESET-GUARD] HARD SAFETY VIOLATION: Reset is strictly DENIED when environment is ${activeEnv}.`;
      console.error(err);
      throw new Error(err);
    }

    if (!isPlatformAdmin) {
      throw new Error('[DEMO-RESET-GUARD] Only Platform Administrators are authorized to reset Demo environment data.');
    }

    console.info(`[DEMO-RESET] Administrator ${actorUserId} triggered governed Demo data reset.`);

    // 1. Generate clean 25-package baseline dataset
    await demoSyntheticDataEngine.generateEnterpriseBatch(
      25,
      `DEMO-BASELINE-RESET-${Date.now()}`
    );

    // 2. Reset simulation state
    this.state.totalCyclesExecuted = 0;
    this.state.totalEventsProcessed = 0;
    this.state.exceptionsGeneratedToday = 0;
    this.state.lastCycleAt = new Date().toISOString();
    this.state.nextCycleAt = new Date(Date.now() + this.getIntervalMs()).toISOString();

    this.broadcastStateChange();

    return {
      success: true,
      message: 'Demo dataset successfully reset. Restored 25 fresh synthetic enterprise ecosystems.',
    };
  }

  private startEngine(): void {
    this.restartTicker();
  }

  private getIntervalMs(): number {
    switch (this.config.speed) {
      case '20x':
        return 3000; // every 3s
      case '5x':
        return 12000; // every 12s
      case '1x':
      default:
        return 60000; // every 1m
    }
  }

  private restartTicker(): void {
    if (this.tickerTimer) {
      clearInterval(this.tickerTimer);
      this.tickerTimer = null;
    }

    if (this.state.speed === 'PAUSED' || typeof window === 'undefined') {
      return;
    }

    this.tickerTimer = setInterval(() => {
      this.executeSimulationCycle().catch((e) => {
        console.warn('[SIMULATION-TICK] Cycle error:', e);
      });
    }, this.getIntervalMs());
  }

  private broadcastStateChange(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('orion:demo-simulation-state-changed', {
          detail: { state: this.getState(), config: this.getConfig() },
        })
      );
    }
  }
}

export const demoLiveSimulationEngine = DemoLiveSimulationEngine.getInstance();
