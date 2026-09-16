import { Exception } from '../types';
import { dataEngine } from '../data/DataEngine';

export class CoreExceptionEngine {
  private static instance: CoreExceptionEngine;
  private constructor() {}

  public static getInstance(): CoreExceptionEngine {
    if (!CoreExceptionEngine.instance) {
      CoreExceptionEngine.instance = new CoreExceptionEngine();
    }
    return CoreExceptionEngine.instance;
  }

  public getExceptions(): Exception[] {
    return dataEngine.getExceptions();
  }

  public createException(params: {
    type: any;
    title: string;
    description: string;
    severity: any;
    entityType: string;
    entityId: string;
  }): Exception | undefined {
    const existingExceptions = dataEngine.getExceptions();
    const isDuplicate = existingExceptions.some(e => e.entityId === params.entityId && e.type === params.type && e.status !== 'Resolved');
    
    if (isDuplicate) {
      return undefined; // Do not create duplicate open exceptions
    }

    const newException: Exception = {
      id: `EXC-${crypto.randomUUID()}`,
      date: new Date().toISOString().split('T')[0],
      type: params.type,
      title: params.title,
      description: params.description,
      severity: params.severity,
      status: 'Open',
      source: 'System',
      entityType: params.entityType,
      entityId: params.entityId,
      detectedAt: new Date().toISOString(),
      impact: 'High', // Default impact
      estimatedImpact: 0,
      owner: 'System',
      recommendedAction: 'Review issue details',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Push to dataEngine so the UI picks it up
    existingExceptions.push(newException as any);
    
    return newException;
  }

  public resolveException(id: string) {
    const exc = dataEngine.getExceptions().find(e => e.id === id);
    if (exc) {
      exc.status = 'Resolved';
      (exc as any).updatedAt = new Date().toISOString();
    }
  }
}

export const exceptionEngine = CoreExceptionEngine.getInstance();
