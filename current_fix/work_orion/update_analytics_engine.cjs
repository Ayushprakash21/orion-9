const fs = require('fs');
let code = fs.readFileSync('src/services/AnalyticsEngine.ts', 'utf8');

const supplierScoreRegex = /static calculateSupplierScore\([^)]+\):\s*number\s*\{[\s\S]*?return Math\.min\(100, Math\.max\(0, totalScore\)\);\n  \}/;

const newSupplierScore = `static calculateSupplierScore(supplier: Supplier, settings: any): number {
    const otifWeight = settings.supplierWeightOtif || 40;
    const qualityWeight = settings.supplierWeightQuality || 30;
    const leadTimeWeight = settings.supplierWeightLeadTime || 15;
    const riskWeight = settings.supplierWeightRisk || 15;

    const otifScore = (supplier.otif / 100) * otifWeight;
    const qualityScore = (supplier.qualityRate / 100) * qualityWeight;
    
    // Normalize lead time (shorter is better). Assuming 30 days is 0%, 1 day is 100%
    const leadTimeScore = Math.max(0, (1 - (supplier.leadTime / 30))) * leadTimeWeight;
    
    // Risk score based on defect rate (lower is better). Assuming 5% defect is 0%, 0% defect is 100%
    const riskScore = Math.max(0, (1 - (supplier.defectRate / 5))) * riskWeight;
    
    const totalScore = Math.round(otifScore + qualityScore + leadTimeScore + riskScore);
    return Math.min(100, Math.max(0, totalScore));
  }`;

code = code.replace(supplierScoreRegex, newSupplierScore);

fs.writeFileSync('src/services/AnalyticsEngine.ts', code);
