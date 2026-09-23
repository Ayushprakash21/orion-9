/**
 * ORION-9 WAVE 11: REGIONAL HEALTH MONITORING SERVICE
 * Gathers regional telemetry, evaluates SLO breaches, and determines
 * automated degradation or failover eligibility signals.
 */

import { regionRegistry, RegionDefinition, RegionOperatingStatus } from './RegionRegistry';

export interface RegionalHealthAssessment {
  regionId: string;
  name: string;
  status: RegionOperatingStatus;
  isHealthy: boolean;
  requiresAttention: boolean;
  breachedSlo: boolean;
  assessmentReasons: string[];
  metrics: {
    latencyP95Ms: number;
    errorRatePercent: number;
    capacityUtilizationPercent: number;
    secondsSinceHeartbeat: number;
  };
  recommendedAction: 'NONE' | 'THROTTLE_TRAFFIC' | 'DRAIN_WORKLOAD' | 'INITIATE_FAILOVER';
  evaluatedAt: string;
}

export class RegionHealthService {
  private static instance: RegionHealthService;

  // Thresholds
  private readonly MAX_LATENCY_MS = 250;
  private readonly MAX_ERROR_RATE_PERCENT = 2.0;
  private readonly MAX_CAPACITY_PERCENT = 90.0;
  private readonly HEARTBEAT_TIMEOUT_SECONDS = 60;

  private constructor() {}

  public static getInstance(): RegionHealthService {
    if (!RegionHealthService.instance) {
      RegionHealthService.instance = new RegionHealthService();
    }
    return RegionHealthService.instance;
  }

  public assessRegion(regionId: string): RegionalHealthAssessment | undefined {
    const region = regionRegistry.getRegion(regionId);
    if (!region) return undefined;

    const now = Date.now();
    const lastHeartbeatTime = new Date(region.healthMetrics.lastHeartbeat).getTime();
    const secondsSinceHeartbeat = Math.max(0, Math.floor((now - lastHeartbeatTime) / 1000));

    const capacityUtil = region.capacity.maxRps > 0
      ? (region.capacity.currentRps / region.capacity.maxRps) * 100
      : 0;

    const reasons: string[] = [];
    let breachedSlo = false;
    let requiresAttention = false;

    if (secondsSinceHeartbeat > this.HEARTBEAT_TIMEOUT_SECONDS) {
      reasons.push(`Heartbeat missed for ${secondsSinceHeartbeat}s (timeout: ${this.HEARTBEAT_TIMEOUT_SECONDS}s)`);
      breachedSlo = true;
      requiresAttention = true;
    }

    if (region.healthMetrics.latencyP95Ms > this.MAX_LATENCY_MS) {
      reasons.push(`Latency P95 ${region.healthMetrics.latencyP95Ms.toFixed(1)}ms exceeds threshold (${this.MAX_LATENCY_MS}ms)`);
      breachedSlo = true;
      requiresAttention = true;
    }

    if (region.healthMetrics.errorRatePercent > this.MAX_ERROR_RATE_PERCENT) {
      reasons.push(`Error rate ${region.healthMetrics.errorRatePercent.toFixed(2)}% exceeds threshold (${this.MAX_ERROR_RATE_PERCENT}%)`);
      breachedSlo = true;
      requiresAttention = true;
    }

    if (capacityUtil > this.MAX_CAPACITY_PERCENT) {
      reasons.push(`Capacity utilization ${capacityUtil.toFixed(1)}% exceeds saturation limit (${this.MAX_CAPACITY_PERCENT}%)`);
      requiresAttention = true;
    }

    if (region.status === 'DEGRADED') {
      reasons.push('Region is administratively marked as DEGRADED');
      requiresAttention = true;
    } else if (region.status === 'DRAINING') {
      reasons.push('Region is active in workload DRAINING phase');
      requiresAttention = true;
    } else if (region.status === 'OFFLINE') {
      reasons.push('Region is OFFLINE');
      breachedSlo = true;
      requiresAttention = true;
    }

    let recommendedAction: 'NONE' | 'THROTTLE_TRAFFIC' | 'DRAIN_WORKLOAD' | 'INITIATE_FAILOVER' = 'NONE';
    if (region.status === 'OFFLINE' || secondsSinceHeartbeat > this.HEARTBEAT_TIMEOUT_SECONDS * 2) {
      recommendedAction = 'INITIATE_FAILOVER';
    } else if (breachedSlo && capacityUtil > 95) {
      recommendedAction = 'DRAIN_WORKLOAD';
    } else if (requiresAttention) {
      recommendedAction = 'THROTTLE_TRAFFIC';
    }

    return {
      regionId: region.regionId,
      name: region.name,
      status: region.status,
      isHealthy: reasons.length === 0 && region.status === 'ACTIVE',
      requiresAttention,
      breachedSlo,
      assessmentReasons: reasons,
      metrics: {
        latencyP95Ms: region.healthMetrics.latencyP95Ms,
        errorRatePercent: region.healthMetrics.errorRatePercent,
        capacityUtilizationPercent: Number(capacityUtil.toFixed(2)),
        secondsSinceHeartbeat
      },
      recommendedAction,
      evaluatedAt: new Date().toISOString()
    };
  }

  public assessAllRegions(): RegionalHealthAssessment[] {
    const regions = regionRegistry.listRegions();
    return regions.map(r => this.assessRegion(r.regionId)!).filter(Boolean);
  }
}

export const regionHealthService = RegionHealthService.getInstance();
