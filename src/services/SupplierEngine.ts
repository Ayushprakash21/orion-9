import { Supplier } from '../types';

export class SupplierEngine {
  static calculateScore(supplier: Supplier, settings: any) {
    if (!supplier) return { score: 0, status: 'High Risk', riskLevel: 'High', drivers: [] };
    
    const otifWeight = settings.supplierWeightOtif || 40;
    const qualityWeight = settings.supplierWeightQuality || 30;
    const leadTimeWeight = settings.supplierWeightLeadTime || 15;
    const riskWeight = settings.supplierWeightRisk || 15;

    const otif = Math.min(100, Math.max(0, supplier.otif || 0));
    const quality = Math.min(100, Math.max(0, supplier.qualityRate || 0));
    
    const otifScore = (otif / 100) * otifWeight;
    const qualityScore = (quality / 100) * qualityWeight;
    const leadTimeScore = Math.max(0, (1 - ((supplier.leadTime || 0) / 30))) * leadTimeWeight;
    const riskScore = Math.max(0, (1 - ((supplier.defectRate || 0) / 5))) * riskWeight;

    const score = Math.min(100, Math.max(0, Math.round(otifScore + qualityScore + leadTimeScore + riskScore)));
    
    let status = 'High Risk';
    if (score >= 90) status = 'Preferred';
    else if (score >= 75) status = 'Approved';
    else if (score >= 60) status = 'Watchlist';
    
    let riskLevel = 'High';
    if (score >= 80) riskLevel = 'Low';
    else if (score >= 60) riskLevel = 'Medium';

    const drivers = [];
    if (otif < 80) drivers.push('Low OTIF');
    if (quality < 90) drivers.push('Quality concerns');
    if (supplier.leadTime > 20) drivers.push('Long lead time');
    if (supplier.defectRate > 2) drivers.push('High defect rate');

    return { score, status, riskLevel, drivers };
  }
}
