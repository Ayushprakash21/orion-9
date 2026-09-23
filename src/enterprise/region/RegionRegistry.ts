/**
 * ORION-9 WAVE 11: MULTI-REGION ARCHITECTURE & REGION REGISTRY
 * Manages regional deployment topology, capacity limits, sovereign jurisdictions,
 * and operational status transitions across global regions.
 * 
 * Truthful Claims Discipline:
 * Multi-region failover and physical cloud topologies without physical external
 * infrastructure are transparently marked with runtimeVerificationStatus = 'SIMULATED' | 'UNVERIFIED'.
 */

export type RegionOperatingStatus = 
  | 'ACTIVE'
  | 'DEGRADED'
  | 'DRAINING'
  | 'FAILOVER'
  | 'OFFLINE'
  | 'MAINTENANCE';

export type RegionRole = 
  | 'PRIMARY'
  | 'SECONDARY'
  | 'DISASTER_RECOVERY'
  | 'EDGE_CACHE';

export type RuntimeVerificationStatus =
  | 'VERIFIED'
  | 'EMULATED'
  | 'SIMULATED'
  | 'SANDBOX'
  | 'STAGING'
  | 'PRODUCTION'
  | 'UNVERIFIED';

export interface RegionDefinition {
  regionId: string;
  name: string;
  cloudProvider: 'GCP' | 'AWS' | 'AZURE' | 'ON_PREMISE' | 'HYBRID_EDGE';
  providerRegion: string; // e.g. "us-east1", "europe-west3"
  role: RegionRole;
  status: RegionOperatingStatus;
  sovereigntyJurisdiction: string; // e.g. "US_FEDRAMP", "EU_GDPR", "APAC_SG"
  runtimeVerificationStatus: RuntimeVerificationStatus;
  endpointUrl: string;
  capabilities: {
    eventBroker: boolean;
    jobExecution: boolean;
    storagePersistence: boolean;
    erpConnectorGateway: boolean;
    ediTranslator: boolean;
  };
  capacity: {
    maxRps: number;
    currentRps: number;
    maxConcurrentJobs: number;
    activeWorkers: number;
  };
  healthMetrics: {
    latencyP95Ms: number;
    errorRatePercent: number;
    lastHeartbeat: string;
  };
  allowedTenantTiers: string[];
  lastFailoverDrill?: string;
  createdAt: string;
  updatedAt: string;
}

export class RegionRegistry {
  private static instance: RegionRegistry;
  private regions: Map<string, RegionDefinition> = new Map();

  private constructor() {
    this.seedDefaultRegions();
  }

  public static getInstance(): RegionRegistry {
    if (!RegionRegistry.instance) {
      RegionRegistry.instance = new RegionRegistry();
    }
    return RegionRegistry.instance;
  }

  private seedDefaultRegions(): void {
    const now = new Date().toISOString();
    const defaultRegions: RegionDefinition[] = [
      {
        regionId: 'reg-us-east',
        name: 'Americas North Primary (Northern Virginia)',
        cloudProvider: 'GCP',
        providerRegion: 'us-east4',
        role: 'PRIMARY',
        status: 'ACTIVE',
        sovereigntyJurisdiction: 'US_DOMESTIC',
        runtimeVerificationStatus: 'SIMULATED',
        endpointUrl: 'https://gateway-useast.orion9.enterprise.internal',
        capabilities: {
          eventBroker: true,
          jobExecution: true,
          storagePersistence: true,
          erpConnectorGateway: true,
          ediTranslator: true
        },
        capacity: {
          maxRps: 15000,
          currentRps: 2420,
          maxConcurrentJobs: 500,
          activeWorkers: 64
        },
        healthMetrics: {
          latencyP95Ms: 18.5,
          errorRatePercent: 0.01,
          lastHeartbeat: now
        },
        allowedTenantTiers: ['ENTERPRISE_GLOBAL', 'ENTERPRISE_PRO', 'STANDARD'],
        lastFailoverDrill: new Date(Date.now() - 14 * 86400000).toISOString(),
        createdAt: now,
        updatedAt: now
      },
      {
        regionId: 'reg-eu-central',
        name: 'Europe Central Sovereign (Frankfurt)',
        cloudProvider: 'GCP',
        providerRegion: 'europe-west3',
        role: 'SECONDARY',
        status: 'ACTIVE',
        sovereigntyJurisdiction: 'EU_GDPR',
        runtimeVerificationStatus: 'SIMULATED',
        endpointUrl: 'https://gateway-eucentral.orion9.enterprise.internal',
        capabilities: {
          eventBroker: true,
          jobExecution: true,
          storagePersistence: true,
          erpConnectorGateway: true,
          ediTranslator: true
        },
        capacity: {
          maxRps: 12000,
          currentRps: 1850,
          maxConcurrentJobs: 400,
          activeWorkers: 48
        },
        healthMetrics: {
          latencyP95Ms: 24.2,
          errorRatePercent: 0.02,
          lastHeartbeat: now
        },
        allowedTenantTiers: ['ENTERPRISE_GLOBAL', 'ENTERPRISE_PRO'],
        lastFailoverDrill: new Date(Date.now() - 30 * 86400000).toISOString(),
        createdAt: now,
        updatedAt: now
      },
      {
        regionId: 'reg-apac-sg',
        name: 'Asia Pacific Regional Hub (Singapore)',
        cloudProvider: 'AWS',
        providerRegion: 'ap-southeast-1',
        role: 'SECONDARY',
        status: 'ACTIVE',
        sovereigntyJurisdiction: 'APAC_SG',
        runtimeVerificationStatus: 'SIMULATED',
        endpointUrl: 'https://gateway-apacsg.orion9.enterprise.internal',
        capabilities: {
          eventBroker: true,
          jobExecution: true,
          storagePersistence: true,
          erpConnectorGateway: true,
          ediTranslator: false
        },
        capacity: {
          maxRps: 8000,
          currentRps: 620,
          maxConcurrentJobs: 200,
          activeWorkers: 24
        },
        healthMetrics: {
          latencyP95Ms: 38.1,
          errorRatePercent: 0.04,
          lastHeartbeat: now
        },
        allowedTenantTiers: ['ENTERPRISE_GLOBAL'],
        createdAt: now,
        updatedAt: now
      },
      {
        regionId: 'reg-us-west-dr',
        name: 'Americas Disaster Recovery (Oregon)',
        cloudProvider: 'GCP',
        providerRegion: 'us-west1',
        role: 'DISASTER_RECOVERY',
        status: 'ACTIVE',
        sovereigntyJurisdiction: 'US_DOMESTIC',
        runtimeVerificationStatus: 'SIMULATED',
        endpointUrl: 'https://gateway-uswest-dr.orion9.enterprise.internal',
        capabilities: {
          eventBroker: true,
          jobExecution: true,
          storagePersistence: true,
          erpConnectorGateway: true,
          ediTranslator: true
        },
        capacity: {
          maxRps: 15000,
          currentRps: 50,
          maxConcurrentJobs: 500,
          activeWorkers: 16 // Warm standby
        },
        healthMetrics: {
          latencyP95Ms: 16.0,
          errorRatePercent: 0.00,
          lastHeartbeat: now
        },
        allowedTenantTiers: ['ENTERPRISE_GLOBAL'],
        lastFailoverDrill: new Date(Date.now() - 7 * 86400000).toISOString(),
        createdAt: now,
        updatedAt: now
      }
    ];

    for (const r of defaultRegions) {
      this.regions.set(r.regionId, r);
    }
  }

  public registerRegion(region: RegionDefinition): RegionDefinition {
    this.regions.set(region.regionId, { ...region, updatedAt: new Date().toISOString() });
    return this.regions.get(region.regionId)!;
  }

  public getRegion(regionId: string): RegionDefinition | undefined {
    return this.regions.get(regionId);
  }

  public listRegions(): RegionDefinition[] {
    return Array.from(this.regions.values()).map(r => ({ ...r }));
  }

  public updateRegionStatus(regionId: string, status: RegionOperatingStatus): boolean {
    const region = this.regions.get(regionId);
    if (!region) return false;
    region.status = status;
    region.updatedAt = new Date().toISOString();
    this.regions.set(regionId, region);
    return true;
  }

  public updateRegionHealth(
    regionId: string, 
    health: { latencyP95Ms: number; errorRatePercent: number; currentRps?: number }
  ): boolean {
    const region = this.regions.get(regionId);
    if (!region) return false;
    region.healthMetrics = {
      latencyP95Ms: health.latencyP95Ms,
      errorRatePercent: health.errorRatePercent,
      lastHeartbeat: new Date().toISOString()
    };
    if (health.currentRps !== undefined) {
      region.capacity.currentRps = health.currentRps;
    }
    region.updatedAt = new Date().toISOString();
    this.regions.set(regionId, region);
    return true;
  }

  public getPrimaryRegion(): RegionDefinition | undefined {
    return Array.from(this.regions.values()).find(r => r.role === 'PRIMARY');
  }

  public getDisasterRecoveryRegion(): RegionDefinition | undefined {
    return Array.from(this.regions.values()).find(r => r.role === 'DISASTER_RECOVERY');
  }

  public clear(): void {
    this.regions.clear();
  }
}

export const regionRegistry = RegionRegistry.getInstance();
