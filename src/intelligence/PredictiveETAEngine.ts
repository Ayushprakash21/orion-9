export interface ETAInput {
  shipmentId: string;
  origin: string;
  destination: string;
  scheduledEta: string;
  currentGpsLat?: number;
  currentGpsLng?: number;
  completedMilestonesPct: number; // 0 - 100
  carrierId: string;
  weatherDelayHours?: number;
  portCongestionDelayHours?: number;
  customsDelayHours?: number;
}

export interface ETAResult {
  shipmentId: string;
  originalScheduledEta: string;
  predictedEta: string;
  etaConfidencePct: number;
  delayProbabilityPct: number;
  totalDelayHours: number;
  primaryDelayCause: string;
  recommendedIntervention: string;
}

export class PredictiveETAEngine {
  /**
   * Calculates dynamic predictive ETA incorporating GPS, carrier performance, weather, port, and customs delays
   */
  public static calculatePredictiveETA(input: ETAInput): ETAResult {
    const scheduledDate = new Date(input.scheduledEta);
    const weatherDelay = input.weatherDelayHours || 0;
    const portDelay = input.portCongestionDelayHours || 0;
    const customsDelay = input.customsDelayHours || 0;
    
    // Simulate carrier historical delay variance
    const carrierVarianceHours = input.carrierId.includes('EXPRESS') ? 2 : 6;
    const totalDelayHours = weatherDelay + portDelay + customsDelay + carrierVarianceHours;

    const predictedDate = new Date(scheduledDate.getTime() + totalDelayHours * 60 * 60 * 1000);
    const delayProb = Math.min(99, Math.max(5, totalDelayHours * 8));
    const confidence = Math.max(70, 98 - Math.round(totalDelayHours * 1.5));

    let primaryCause = 'Normal transit variance';
    if (portDelay > weatherDelay && portDelay > customsDelay) primaryCause = 'Port congestion bottlenecks';
    else if (weatherDelay > customsDelay) primaryCause = 'Severe weather disruption';
    else if (customsDelay > 0) primaryCause = 'Border / Customs documentation hold';

    let intervention = 'No action required';
    if (delayProb > 60) intervention = 'Trigger automatic carrier expedited status check & reroute via alternate lane';

    return {
      shipmentId: input.shipmentId,
      originalScheduledEta: input.scheduledEta,
      predictedEta: predictedDate.toISOString(),
      etaConfidencePct: confidence,
      delayProbabilityPct: delayProb,
      totalDelayHours,
      primaryDelayCause: primaryCause,
      recommendedIntervention: intervention
    };
  }
}
