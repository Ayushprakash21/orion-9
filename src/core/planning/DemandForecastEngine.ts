import { Inventory, Product } from '../../types';

export type DemandProvenance =
  | 'ACTUAL'
  | 'IMPORTED'
  | 'SYNTHETIC_DEMO'
  | 'SIMULATED'
  | 'FORECAST'
  | 'ESTIMATED';

export interface ForecastResult {
  productId: string;
  locationId: string;
  forecastDate: string;
  predictedDemand: number;
  lowerBound: number;
  upperBound: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  method: string;
  trend: number;
  seasonality: number;
  anomalyFlag: boolean;
  generatedAt: string;
  isHistorical: boolean;
  provenance: DemandProvenance;
}

export class DemandForecastEngine {
  // Simple deterministic pseudo-random generator
  private static seededRandom(seed: number) {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  private static hashString(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  static generateForecast(
    inventory: Inventory[],
    products: Product[],
    horizonDays: number = 30,
    includeHistoryDays: number = 30
  ): ForecastResult[] {
    const forecasts: ForecastResult[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const inv of inventory) {
      const product = products.find(p => p.id === inv.productId);
      if (!product) continue;

      const baseDemand = inv.averageDailyDemand || inv.dailyDemand || 0;
      if (baseDemand === 0) continue;

      const productHash = this.hashString(inv.productId + inv.warehouseId);
      
      // Deterministic modifiers based on category
      const trendFactor = product.category === 'Electronics' ? 1.02 : 
                         product.category === 'Apparel' ? 1.05 : 1.0;
      
      const seasonalityFactor = 1.0 + (this.seededRandom(productHash) * 0.2 - 0.1); // +/- 10%

      // 1. Generate Historical Baseline Data (Clearly flagged with synthetic provenance)
      let currentDemand = baseDemand / Math.pow(trendFactor, includeHistoryDays / 7);
      
      for (let i = includeHistoryDays; i > 0; i--) {
        const histDate = new Date(today);
        histDate.setDate(today.getDate() - i);
        
        const dateHash = this.hashString(histDate.toISOString().split('T')[0]);
        const noise = (this.seededRandom(productHash + dateHash) - 0.5) * 0.3 * currentDemand; // +/- 15% noise
        
        let actualDemand = Math.max(0, currentDemand * seasonalityFactor + noise);
        
        if (i % 7 === 0) currentDemand = currentDemand * trendFactor;

        // Deterministic anomalies in history
        const anomalyFlag = this.seededRandom(productHash + dateHash + 1) > 0.95;
        if (anomalyFlag) actualDemand *= 1.8; // 80% spike

        forecasts.push({
          productId: inv.productId,
          locationId: inv.warehouseId,
          forecastDate: histDate.toISOString(),
          predictedDemand: Math.round(actualDemand),
          lowerBound: Math.round(actualDemand),
          upperBound: Math.round(actualDemand),
          confidence: 'HIGH',
          method: 'Synthetic Historical Baseline',
          trend: trendFactor,
          seasonality: seasonalityFactor,
          anomalyFlag,
          generatedAt: new Date().toISOString(),
          isHistorical: true,
          provenance: 'SYNTHETIC_DEMO'
        });
      }

      // 2. Generate Forecast Data
      currentDemand = baseDemand;
      
      for (let i = 0; i <= horizonDays; i++) {
        const forecastDate = new Date(today);
        forecastDate.setDate(today.getDate() + i);

        const dateHash = this.hashString(forecastDate.toISOString().split('T')[0]);
        const noise = (this.seededRandom(productHash + dateHash) - 0.5) * 0.2 * currentDemand;
        
        let predictedDemand = Math.max(0, currentDemand * seasonalityFactor + noise);
        
        if (i % 7 === 0) currentDemand = currentDemand * trendFactor;

        const confidence = baseDemand > 50 ? 'HIGH' : (baseDemand > 10 ? 'MEDIUM' : 'LOW');
        const anomalyFlag = this.seededRandom(productHash + dateHash + 2) > 0.95;
        if (anomalyFlag) predictedDemand *= 1.6;

        forecasts.push({
          productId: inv.productId,
          locationId: inv.warehouseId,
          forecastDate: forecastDate.toISOString(),
          predictedDemand: Math.round(predictedDemand),
          lowerBound: Math.max(0, Math.round(predictedDemand * 0.8)),
          upperBound: Math.round(predictedDemand * 1.2),
          confidence,
          method: 'Moving Average with Trend',
          trend: trendFactor,
          seasonality: seasonalityFactor,
          anomalyFlag,
          generatedAt: new Date().toISOString(),
          isHistorical: false,
          provenance: 'FORECAST'
        });
      }
    }
    return forecasts;
  }

  /**
   * Generates probabilistic forecast directly from verified empirical sales/demand history
   */
  static generateFromEmpiricalHistory(
    empiricalHistory: { date: string; quantity: number; productId: string; locationId: string }[],
    horizonDays: number = 30
  ): ForecastResult[] {
    if (empiricalHistory.length === 0) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sorted = [...empiricalHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const quantities = sorted.map(h => h.quantity);
    const avg = quantities.reduce((a, b) => a + b, 0) / quantities.length;
    const { productId, locationId } = sorted[0];

    const results: ForecastResult[] = [];
    
    // Add empirical history points
    sorted.forEach(h => {
      results.push({
        productId,
        locationId,
        forecastDate: h.date,
        predictedDemand: h.quantity,
        lowerBound: h.quantity,
        upperBound: h.quantity,
        confidence: 'HIGH',
        method: 'Empirical Historical Orders',
        trend: 1.0,
        seasonality: 1.0,
        anomalyFlag: false,
        generatedAt: new Date().toISOString(),
        isHistorical: true,
        provenance: 'ACTUAL'
      });
    });

    // Forecast projection
    for (let i = 1; i <= horizonDays; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(today.getDate() + i);
      results.push({
        productId,
        locationId,
        forecastDate: forecastDate.toISOString(),
        predictedDemand: Math.round(avg),
        lowerBound: Math.max(0, Math.round(avg * 0.85)),
        upperBound: Math.round(avg * 1.15),
        confidence: quantities.length >= 14 ? 'HIGH' : 'MEDIUM',
        method: 'Empirical Moving Average',
        trend: 1.0,
        seasonality: 1.0,
        anomalyFlag: false,
        generatedAt: new Date().toISOString(),
        isHistorical: false,
        provenance: 'FORECAST'
      });
    }

    return results;
  }
}
