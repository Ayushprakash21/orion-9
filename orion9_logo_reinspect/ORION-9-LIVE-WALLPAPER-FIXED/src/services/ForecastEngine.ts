import { Inventory } from '../types';

export class ForecastEngine {
  static generateForecast(inv: Inventory) {
    const dailyDemand = inv.averageDailyDemand || 0;
    
    // In a real system, this would analyze historical time-series data.
    // For this simulation, we'll derive trends based on the daily demand and a deterministic variance.
    // We can simulate a slight upward or downward trend based on the SKU's hash or ID to make it consistent.
    
    const hash = inv.productId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const trendFactor = (hash % 10) / 100; // 0 to 0.09
    const isUpward = hash % 2 === 0;
    
    const trendMultiplier = isUpward ? (1 + trendFactor) : (1 - trendFactor);
    
    const forecast7Day = Math.round(dailyDemand * 7 * trendMultiplier);
    const forecast14Day = Math.round(dailyDemand * 14 * trendMultiplier);
    const forecast30Day = Math.round(dailyDemand * 30 * trendMultiplier);
    
    return {
      dailyDemand,
      trend: isUpward ? 'INCREASING' : 'DECLINING',
      trendPercentage: Math.round(trendFactor * 100),
      forecast7Day,
      forecast14Day,
      forecast30Day,
      confidence: dailyDemand > 0 ? 'HIGH' : 'LOW'
    };
  }
}
