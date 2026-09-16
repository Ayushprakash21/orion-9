const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/services/AnalyticsEngine.ts');
let content = fs.readFileSync(file, 'utf8');

const regex = /    return \{\n      overall,\n      inventory: Math\.round\(invHealth\),\n      suppliers: Math\.round\(supHealth\),\n      procurement: Math\.round\(procHealth\),\n      logistics: Math\.round\(logHealth\)\n    \};\n  \}\n\}/m;

const replacement = `
    const primaryDrivers: string[] = [];
    if (criticalCount > 0) primaryDrivers.push(\`\${criticalCount} critical inventory risks\`);
    if (delayedShipments > 0) primaryDrivers.push(\`\${delayedShipments} delayed shipments\`);
    if (overduePos > 0) primaryDrivers.push(\`\${overduePos} overdue purchase orders\`);
    if (supHealth < 80) primaryDrivers.push(\`Supplier reliability deteriorating\`);
    
    const positiveDrivers: string[] = [];
    if (criticalCount === 0 && inventory.length > 0) positiveDrivers.push('No critical stock-outs');
    if (delayedShipments === 0 && activeShipments.length > 0) positiveDrivers.push('All active shipments on time');
    if (supHealth > 90) positiveDrivers.push('High supplier reliability');

    return {
      overall,
      inventory: Math.round(invHealth),
      suppliers: Math.round(supHealth),
      procurement: Math.round(procHealth),
      logistics: Math.round(logHealth),
      primaryDrivers,
      positiveDrivers
    };
  }
}
`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
console.log("AnalyticsEngine updated");
