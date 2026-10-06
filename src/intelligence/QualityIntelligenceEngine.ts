export interface QualityMetricData {
  supplierId: string;
  skuId: string;
  totalInspectedUnits: number;
  defectiveUnits: number;
  defectCategory: 'DIMENSIONAL' | 'SURFACE' | 'FUNCTIONAL' | 'PACKAGING' | 'MATERIAL';
  historicalDefectRatePct: number;
}

export interface QualityAnalysisResult {
  supplierId: string;
  skuId: string;
  currentDefectRatePct: number;
  spcUpperControlLimit: number;
  spcLowerControlLimit: number;
  outOfControl: boolean;
  predictedDefectTrend: 'STABLE' | 'DETERIORATING' | 'IMPROVING';
  supplierQualityScore: number; // 0 - 100
  recommendedCapaAction: string;
}

export class QualityIntelligenceEngine {
  /**
   * Performs Statistical Process Control (SPC), defect prediction, and CAPA generation
   */
  public static analyzeQuality(data: QualityMetricData): QualityAnalysisResult {
    const currentRate = (data.defectiveUnits / Math.max(1, data.totalInspectedUnits)) * 100;
    const meanRate = data.historicalDefectRatePct;
    const stdDev = Math.sqrt(meanRate * (100 - meanRate) / Math.max(1, data.totalInspectedUnits));
    
    const ucl = Number((meanRate + 3 * stdDev).toFixed(2));
    const lcl = Number(Math.max(0, meanRate - 3 * stdDev).toFixed(2));

    const outOfControl = currentRate > ucl;
    const qualityScore = Math.max(0, Math.round(100 - currentRate * 12));
    const trend = outOfControl ? 'DETERIORATING' : currentRate < meanRate ? 'IMPROVING' : 'STABLE';

    let capa = 'Maintain standard inspection frequency';
    if (outOfControl) {
      capa = `Issue automated CAPA ticket to supplier ${data.supplierId} for ${data.defectCategory} defect surge (${currentRate.toFixed(1)}% vs UCL ${ucl}%)`;
    }

    return {
      supplierId: data.supplierId,
      skuId: data.skuId,
      currentDefectRatePct: Number(currentRate.toFixed(2)),
      spcUpperControlLimit: ucl,
      spcLowerControlLimit: lcl,
      outOfControl,
      predictedDefectTrend: trend,
      supplierQualityScore: qualityScore,
      recommendedCapaAction: capa
    };
  }
}
