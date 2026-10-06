export type SignalCategory = 
  | 'WEATHER'
  | 'PORT_CONGESTION'
  | 'STRIKE'
  | 'TARIFF'
  | 'SANCTION'
  | 'COMMODITY_PRICE'
  | 'FUEL_PRICE'
  | 'FX_FLUCTUATION'
  | 'SUPPLIER_FINANCIAL_RISK'
  | 'GEOPOLITICAL';

export interface ExternalSignal {
  signalId: string;
  category: SignalCategory;
  source: string;
  headline: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedLocation?: string;
  affectedEntities: { type: 'SUPPLIER' | 'CARRIER' | 'PORT' | 'ROUTE' | 'SKU'; id: string }[];
  impactScore: number; // 0 - 100
  timestamp: string;
}

export interface IngestedSignalImpact {
  signal: ExternalSignal;
  affectedShipmentIds: string[];
  affectedPurchaseOrderIds: string[];
  recommendedMissionTitle: string;
  riskClass: 'LOW' | 'MEDIUM' | 'MATERIAL' | 'HIGH' | 'CRITICAL';
}

export class ExternalSignalFabric {
  private static signalHistory: ExternalSignal[] = [];

  /**
   * Ingests external event signal, resolves entity relationships, and calculates supply chain risk propagation
   */
  public static ingestSignal(signal: ExternalSignal): IngestedSignalImpact {
    this.signalHistory.push(signal);

    const affectedShipmentIds = signal.affectedEntities
      .filter(e => e.type === 'CARRIER' || e.type === 'PORT' || e.type === 'ROUTE')
      .map(e => `SH-${e.id.substring(0, 6)}`);

    const affectedPurchaseOrderIds = signal.affectedEntities
      .filter(e => e.type === 'SUPPLIER' || e.type === 'SKU')
      .map(e => `PO-${e.id.substring(0, 6)}`);

    let riskClass: IngestedSignalImpact['riskClass'] = 'LOW';
    if (signal.severity === 'CRITICAL' || signal.impactScore > 80) {
      riskClass = 'CRITICAL';
    } else if (signal.severity === 'HIGH' || signal.impactScore > 60) {
      riskClass = 'HIGH';
    } else if (signal.severity === 'MEDIUM' || signal.impactScore > 40) {
      riskClass = 'MATERIAL';
    } else if (signal.impactScore > 20) {
      riskClass = 'MEDIUM';
    }

    return {
      signal,
      affectedShipmentIds,
      affectedPurchaseOrderIds,
      recommendedMissionTitle: `Mitigate ${signal.category.replace('_', ' ')} disruption for ${signal.headline}`,
      riskClass
    };
  }

  public static getRecentSignals(limit: number = 20): ExternalSignal[] {
    return [...this.signalHistory].reverse().slice(0, limit);
  }
}
