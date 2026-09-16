import { Inventory, Product } from '../../types';

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

      // 1. Generate Historical Data
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
          method: 'Actual History',
          trend: trendFactor,
          seasonality: seasonalityFactor,
          anomalyFlag,
          generatedAt: new Date().toISOString(),
          isHistorical: true
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
          isHistorical: false
        });
      }
    }
    return forecasts;
  }
}
