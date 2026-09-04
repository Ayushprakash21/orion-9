const fs = require('fs');
const path = require('path');
const srcDir = path.join(__dirname, 'src');
const servicesDir = path.join(srcDir, 'services');

const code = `import { Exception, Inventory, PurchaseOrder, Shipment, Supplier } from '../types';
import { RootCauseEngine } from './RootCauseEngine';

export class RiskEngine {
  static evaluateRisk(
    exception: Exception,
    inventory: Inventory[],
    pos: PurchaseOrder[],
    shipments: Shipment[],
    suppliers: Supplier[],
    allExceptions: Exception[]
  ) {
    const chain = RootCauseEngine.determineRootCause(exception, inventory, pos, shipments, suppliers, allExceptions);
    
    let confidence = 'Low';
    if (chain.length > 2) confidence = 'High';
    else if (chain.length === 2) confidence = 'Medium';
    
    let riskScore = 0;
    if (exception.severity === 'Critical') riskScore = 90;
    else if (exception.severity === 'High') riskScore = 75;
    else if (exception.severity === 'Medium') riskScore = 50;
    else riskScore = 25;
    
    // Evaluate evidence
    const evidence: string[] = [];
    chain.forEach(node => {
      if (node.type === 'Inventory') evidence.push(\`Inventory \${node.id} is impacted.\`);
      if (node.type === 'PO') evidence.push(\`PO \${node.id} is associated.\`);
      if (node.type === 'Shipment') evidence.push(\`Shipment \${node.id} is tracking this delivery.\`);
      if (node.type === 'Supplier') evidence.push(\`Supplier \${node.name || node.id} provides this material.\`);
      if (node.type === 'Exception') evidence.push(\`Exception \${node.id} is active.\`);
    });

    return {
      riskScore,
      severity: exception.severity,
      confidence,
      chain,
      evidence,
      impact: exception.estimatedImpact || 0,
      recommendedAction: exception.recommendedAction || 'Investigate root cause.'
    };
  }
}
`;
fs.writeFileSync(path.join(servicesDir, 'RiskEngine.ts'), code);
console.log("RiskEngine created");
