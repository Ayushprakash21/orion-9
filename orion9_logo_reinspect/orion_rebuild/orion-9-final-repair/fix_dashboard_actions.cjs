const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/Dashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

// Use actions from context
content = content.replace("const { exceptions, inventory, purchaseOrders, shipments, suppliers, settings, currency } = useSupplyChain();", "const { exceptions, actions, inventory, purchaseOrders, shipments, suppliers, settings, currency } = useSupplyChain();");

// Remove local derivation
const actionDerivation = `  // 13. ACTION CENTER (Derived from Exceptions)
  const actions = exceptions.slice(0, 3).map((e, i) => ({
    id: \`ACT-\${i}\`,
    issue: e.type,
    entity: e.entityId,
    recommendation: e.recommendedAction || 'Investigate root cause and update planning parameters.',
    status: i === 0 ? 'PROPOSED' : 'AWAITING APPROVAL',
    priority: e.severity,
    impact: e.estimatedImpact
  }));`;

content = content.replace(actionDerivation, "// 13. ACTION CENTER (now from context)");
// wait, AWAITING APPROVAL vs AWAITING_APPROVAL might be hard to match. Let's just do a regex replace.
content = content.replace(/\/\/ 13\. ACTION CENTER \(Derived from Exceptions\)[\s\S]*?\/\/ 7\. SUPPLY CHAIN FLOW/m, "// 13. ACTION CENTER\n\n  // 7. SUPPLY CHAIN FLOW");

fs.writeFileSync(file, content);
console.log("Dashboard Action Center fixed");
