export interface SupplierRiskInputs {
  supplierId: string;
  supplierName: string;
  financialRiskScore: number; // 0 - 100
  deliveryRiskScore: number; // 0 - 100
  qualityRiskScore: number; // 0 - 100
  capacityRiskScore: number; // 0 - 100
  geopoliticalRiskScore: number; // 0 - 100
  esgRiskScore: number; // 0 - 100
  singleSourceFlag: boolean;
}

export interface SupplierRiskAssessment {
  supplierId: string;
  supplierName: string;
  compositeRiskScore: number; // 0 - 100
  riskCategory: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  primaryRiskDriver: string;
  recommendedActions: {
    actionType: 'ALTERNATE_SUPPLIER' | 'SAFETY_STOCK_INCREASE' | 'ALLOCATION_SHIFT' | 'ACCELERATE_ORDER';
    details: string;
    targetAlternateSupplierId?: string;
    shiftPercentage?: number;
  }[];
}

export class SupplierIntelligenceEngine {
  /**
   * Calculates multi-dimensional supplier risk and automatically generates mitigation recommendations
   */
  public static evaluateSupplierRisk(inputs: SupplierRiskInputs): SupplierRiskAssessment {
    // Weighted composite risk formula
    const composite = (
      inputs.financialRiskScore * 0.25 +
      inputs.deliveryRiskScore * 0.25 +
      inputs.qualityRiskScore * 0.20 +
      inputs.capacityRiskScore * 0.15 +
      inputs.geopoliticalRiskScore * 0.10 +
      inputs.esgRiskScore * 0.05
    );

    const compositeRiskScore = Math.round(composite);

    let category: SupplierRiskAssessment['riskCategory'] = 'LOW';
    if (compositeRiskScore > 75 || inputs.singleSourceFlag && compositeRiskScore > 60) category = 'CRITICAL';
    else if (compositeRiskScore > 55) category = 'HIGH';
    else if (compositeRiskScore > 35) category = 'MEDIUM';

    // Identify primary risk driver
    const drivers = [
      { name: 'Financial Liquidity', score: inputs.financialRiskScore },
      { name: 'Delivery OTIF Breach', score: inputs.deliveryRiskScore },
      { name: 'Quality Defect Rate', score: inputs.qualityRiskScore },
      { name: 'Capacity Bottleneck', score: inputs.capacityRiskScore },
      { name: 'Geopolitical Instability', score: inputs.geopoliticalRiskScore }
    ];
    drivers.sort((a, b) => b.score - a.score);
    const primaryDriver = drivers[0].name;

    const recommendedActions: SupplierRiskAssessment['recommendedActions'] = [];

    if (category === 'CRITICAL' || category === 'HIGH') {
      recommendedActions.push({
        actionType: 'ALLOCATION_SHIFT',
        details: `Shift 30% sourcing allocation away from ${inputs.supplierName} due to ${primaryDriver} risk (${drivers[0].score}/100)`,
        targetAlternateSupplierId: 'SUP-9902-ALT',
        shiftPercentage: 30
      });

      recommendedActions.push({
        actionType: 'SAFETY_STOCK_INCREASE',
        details: `Increase regional safety stock buffer by 14 days for SKUs sourced from ${inputs.supplierName}`
      });
    } else if (category === 'MEDIUM') {
      recommendedActions.push({
        actionType: 'ACCELERATE_ORDER',
        details: `Accelerate open purchase orders with ${inputs.supplierName} to reduce exposure window`
      });
    }

    return {
      supplierId: inputs.supplierId,
      supplierName: inputs.supplierName,
      compositeRiskScore,
      riskCategory: category,
      primaryRiskDriver: primaryDriver,
      recommendedActions
    };
  }
}
