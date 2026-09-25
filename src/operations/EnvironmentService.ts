/**
 * ORION-9 AUTHORITATIVE ENVIRONMENT SERVICE
 * Single Source of Truth for System-wide Runtime Environment & DEMO/LIVE Operating Mode
 */

import { dbManager } from '../core/database/DatabaseConnectionManager';
import { DatabaseEnvironmentMode, EnvironmentSwitchRequest, EnvironmentSwitchResult } from '../core/database/DatabaseEnvironment';
import { RuntimeEnvironment } from './types';

export class EnvironmentService {
  private static instance: EnvironmentService;
  private runtimeMode: RuntimeEnvironment;

  private constructor() {
    this.runtimeMode = this.detectRuntimeMode();
  }

  public static getInstance(): EnvironmentService {
    if (!EnvironmentService.instance) {
      EnvironmentService.instance = new EnvironmentService();
    }
    return EnvironmentService.instance;
  }

  private detectRuntimeMode(): RuntimeEnvironment {
    const nodeEnv = typeof process !== 'undefined' && process.env ? process.env.NODE_ENV : undefined;
    const viteMode = typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env.MODE : undefined;

    if (nodeEnv === 'production' || viteMode === 'production') return 'PRODUCTION';
    if (nodeEnv === 'test' || viteMode === 'test') return 'TEST';
    if (nodeEnv === 'staging' || viteMode === 'staging') return 'STAGING';
    return 'DEVELOPMENT';
  }

  /**
   * Node/Vite Runtime Environment ('PRODUCTION' | 'STAGING' | 'DEVELOPMENT' | 'TEST')
   */
  public getEnvironment(): RuntimeEnvironment {
    return this.runtimeMode;
  }

  /**
   * Primary Authoritative OS Operating Database Environment ('DEMO' | 'LIVE')
   */
  public getOperatingEnvironment(): DatabaseEnvironmentMode {
    return dbManager.getEnvironment();
  }

  public isDemo(): boolean {
    return this.getOperatingEnvironment() === 'DEMO';
  }

  public isLive(): boolean {
    return this.getOperatingEnvironment() === 'LIVE';
  }

  private subscribers: Array<(env: DatabaseEnvironmentMode) => void> = [];

  /**
   * Subscribe to authoritative environment changes.
   */
  public subscribeEnvironment(callback: (env: DatabaseEnvironmentMode) => void): () => void {
    this.subscribers.push(callback);

    const handler = (e: Event) => {
      const customEvt = e as CustomEvent;
      const newEnv = customEvt.detail?.current || dbManager.getEnvironment();
      callback(newEnv);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('orion-database-environment-changed', handler);
    }

    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
      if (typeof window !== 'undefined') {
        window.removeEventListener('orion-database-environment-changed', handler);
      }
    };
  }

  /**
   * Governed Environment Switching via Database Control Plane
   */
  public async switchEnvironment(request: EnvironmentSwitchRequest): Promise<EnvironmentSwitchResult> {
    const result = await dbManager.switchEnvironment(request);
    if (result.success) {
      this.subscribers.forEach((cb) => cb(result.currentEnvironment));
    }
    return result;
  }

  public isProduction(): boolean {
    return this.runtimeMode === 'PRODUCTION';
  }

  public isStaging(): boolean {
    return this.runtimeMode === 'STAGING';
  }

  public isTest(): boolean {
    return this.runtimeMode === 'TEST';
  }

  public isDevelopment(): boolean {
    return this.runtimeMode === 'DEVELOPMENT';
  }

  public setEnvironment(env: RuntimeEnvironment): void {
    this.runtimeMode = env;
  }

  public assertExecutionAllowed(actionName: string): { allowed: boolean; reason?: string } {
    return { allowed: true };
  }
}

export const environmentService = EnvironmentService.getInstance();
