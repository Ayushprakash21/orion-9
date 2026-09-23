/**
 * ORION-9 WAVE 11: REGIONAL ROUTING SERVICE
 * Governs traffic routing decisions, sovereign boundary compliance,
 * and failover diversion across distributed regions.
 */

import { regionRegistry, RegionDefinition } from './RegionRegistry';
import { regionHealthService } from './RegionHealthService';

export interface RoutingDecision {
  targetRegionId: string;
  targetEndpointUrl: string;
  routingMode: 'DIRECT' | 'FAILOVER_DIVERTED' | 'SPILLOVER' | 'READ_REPLICA';
  rationale: string;
  sovereigntyCompliant: boolean;
  evaluatedAt: string;
}

export interface RoutingRequest {
  tenantId: string;
  preferredRegionId?: string;
  requiredSovereignty?: string; // e.g. "EU_GDPR"
  operationType: 'READ' | 'WRITE' | 'JOB_EXECUTION' | 'ERP_SYNC';
  allowCrossRegionFailover?: boolean;
}

export class RegionRoutingService {
  private static instance: RegionRoutingService;

  private constructor() {}

  public static getInstance(): RegionRoutingService {
    if (!RegionRoutingService.instance) {
      RegionRoutingService.instance = new RegionRoutingService();
    }
    return RegionRoutingService.instance;
  }

  /**
   * Determine the optimal, policy-compliant execution region for a given request
   */
  public resolveTargetRegion(req: RoutingRequest): RoutingDecision {
    const allRegions = regionRegistry.listRegions();
    const evaluatedAt = new Date().toISOString();

    // 1. Check preferred region first
    if (req.preferredRegionId) {
      const preferred = regionRegistry.getRegion(req.preferredRegionId);
      if (preferred) {
        const health = regionHealthService.assessRegion(preferred.regionId);
        const isSovereign = !req.requiredSovereignty || preferred.sovereigntyJurisdiction === req.requiredSovereignty;

        if (!isSovereign) {
          throw new Error(`Sovereignty mismatch: Preferred region ${preferred.regionId} (${preferred.sovereigntyJurisdiction}) does not satisfy required jurisdiction ${req.requiredSovereignty}`);
        }

        // If preferred is healthy and active, route direct
        if (preferred.status === 'ACTIVE' && health?.isHealthy) {
          return {
            targetRegionId: preferred.regionId,
            targetEndpointUrl: preferred.endpointUrl,
            routingMode: 'DIRECT',
            rationale: `Target resolved to preferred active region ${preferred.name}`,
            sovereigntyCompliant: true,
            evaluatedAt
          };
        }

        // If preferred is degraded or draining or offline, check if failover is allowed
        if (!req.allowCrossRegionFailover) {
          // Strict affinity requested: do not divert, route with warning or fail
          if (preferred.status === 'OFFLINE') {
            throw new Error(`Preferred region ${preferred.regionId} is OFFLINE and cross-region failover is disabled for this workload.`);
          }
          return {
            targetRegionId: preferred.regionId,
            targetEndpointUrl: preferred.endpointUrl,
            routingMode: 'DIRECT',
            rationale: `Routed to preferred region ${preferred.regionId} in status ${preferred.status} (cross-region failover disabled)`,
            sovereigntyCompliant: true,
            evaluatedAt
          };
        }
      }
    }

    // 2. Find eligible active failover regions respecting sovereignty
    const eligibleRegions = allRegions.filter(r => {
      if (r.status !== 'ACTIVE') return false;
      if (req.requiredSovereignty && r.sovereigntyJurisdiction !== req.requiredSovereignty) {
        return false;
      }
      return true;
    });

    if (eligibleRegions.length === 0) {
      // Check if DR region is available
      const dr = regionRegistry.getDisasterRecoveryRegion();
      if (dr && dr.status === 'ACTIVE' && (!req.requiredSovereignty || dr.sovereigntyJurisdiction === req.requiredSovereignty)) {
        return {
          targetRegionId: dr.regionId,
          targetEndpointUrl: dr.endpointUrl,
          routingMode: 'FAILOVER_DIVERTED',
          rationale: `All primary regions degraded or unavailable; routing diverted to Disaster Recovery region ${dr.name}`,
          sovereigntyCompliant: true,
          evaluatedAt
        };
      }

      throw new Error(`No available region meets the sovereignty (${req.requiredSovereignty || 'ANY'}) and availability criteria.`);
    }

    // Sort by lowest latency and capacity utilization
    eligibleRegions.sort((a, b) => {
      const utilA = a.capacity.maxRps > 0 ? a.capacity.currentRps / a.capacity.maxRps : 0;
      const utilB = b.capacity.maxRps > 0 ? b.capacity.currentRps / b.capacity.maxRps : 0;
      return (a.healthMetrics.latencyP95Ms + utilA * 100) - (b.healthMetrics.latencyP95Ms + utilB * 100);
    });

    const chosen = eligibleRegions[0];
    const isFailover = req.preferredRegionId && chosen.regionId !== req.preferredRegionId;

    return {
      targetRegionId: chosen.regionId,
      targetEndpointUrl: chosen.endpointUrl,
      routingMode: isFailover ? 'FAILOVER_DIVERTED' : 'DIRECT',
      rationale: isFailover
        ? `Failover diverted from ${req.preferredRegionId} to optimal candidate ${chosen.name}`
        : `Target resolved to optimal active candidate ${chosen.name}`,
      sovereigntyCompliant: true,
      evaluatedAt
    };
  }
}

export const regionRoutingService = RegionRoutingService.getInstance();
