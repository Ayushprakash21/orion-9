import { Contract, Supplier } from '../types';
import { differenceInDays, parseISO } from 'date-fns';

export interface ContractRiskAnalysis {
  contractId: string;
  contractNumber: string;
  supplierId: string;
  supplierName: string;
  daysUntilExpiration: number;
  isRenewalWindowOpen: boolean;
  status: 'Active' | 'Expiring Soon' | 'Under Review' | 'Expired';
  otifGap: number; // actual supplier OTIF minus contract target
  penaltyRiskExposure: number; // estimated USD
  obligationsCompliance: 'COMPLIANT' | 'NEEDS_REVIEW' | 'BREACH_RISK';
  recommendations: string[];
}

export class ContractEngine {
  public static evaluateContracts(contracts: Contract[], suppliers: Supplier[]): ContractRiskAnalysis[] {
    const today = new Date();

    return contracts.map(contract => {
      const supplier = suppliers.find(s => s.id === contract.supplierId);
      const endDate = parseISO(contract.endDate);
      const daysUntilExpiration = differenceInDays(endDate, today);
      const isRenewalWindowOpen = daysUntilExpiration <= contract.renewalNoticeDays && daysUntilExpiration > 0;

      const actualOtif = supplier?.otif ?? 95.0;
      const otifGap = Math.round((actualOtif - contract.agreedOtifTarget) * 10) / 10;

      let obligationsCompliance: 'COMPLIANT' | 'NEEDS_REVIEW' | 'BREACH_RISK' = 'COMPLIANT';
      let penaltyRiskExposure = 0;

      if (otifGap < -5) {
        obligationsCompliance = 'BREACH_RISK';
        penaltyRiskExposure = Math.round(contract.annualValue * 0.02); // 2% liquidated damages exposure
      } else if (otifGap < 0 || isRenewalWindowOpen) {
        obligationsCompliance = 'NEEDS_REVIEW';
        penaltyRiskExposure = Math.round(contract.annualValue * 0.005);
      }

      const recommendations: string[] = [];
      if (isRenewalWindowOpen) {
        recommendations.push(`Renewal window open (${daysUntilExpiration} days remaining). Initiate commercial term renegotiations.`);
      }
      if (otifGap < -3) {
        recommendations.push(`Supplier OTIF (${actualOtif}%) is below agreed SLA (${contract.agreedOtifTarget}%). Issue formal SLA cure notice.`);
      }
      if (contract.riskRating === 'High') {
        recommendations.push(`High contractual risk exposure. Review backup dual-sourcing options.`);
      }
      if (recommendations.length === 0) {
        recommendations.push(`All key contractual terms and performance metrics currently compliant.`);
      }

      return {
        contractId: contract.id,
        contractNumber: contract.contractNumber,
        supplierId: contract.supplierId,
        supplierName: contract.supplierName,
        daysUntilExpiration,
        isRenewalWindowOpen,
        status: daysUntilExpiration <= 0 ? 'Expired' : isRenewalWindowOpen ? 'Expiring Soon' : contract.status as any,
        otifGap,
        penaltyRiskExposure,
        obligationsCompliance,
        recommendations
      };
    });
  }
}
