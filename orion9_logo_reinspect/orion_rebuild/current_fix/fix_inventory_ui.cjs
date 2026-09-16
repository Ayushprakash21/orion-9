const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/drawers/InventoryDetailContent.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import { AnalyticsEngine } from '../../services/AnalyticsEngine';", "import { AnalyticsEngine } from '../../services/AnalyticsEngine';\nimport { InventoryEngine } from '../../services/InventoryEngine';\nimport { ForecastEngine } from '../../services/ForecastEngine';");

// Update healthStats calculation to use metrics
const regex = /const available = \(invItem\?\.onHand \?\? 0\) - \(invItem\?\.reserved \?\? 0\);\n  const healthStats = invItem \n     \? AnalyticsEngine\.calculateInventoryHealth\(invItem, settings\) \n     : \{ available, daysOfSupply: null, status: 'Healthy', risk: 'Low' \};/m;

const replacement = `
  const metrics = invItem ? InventoryEngine.calculateMetrics(invItem, purchaseOrders, shipments, suppliers) : null;
  const forecast = invItem ? ForecastEngine.generateForecast(invItem) : null;
  
  const available = metrics ? metrics.available : ((invItem?.onHand ?? 0) - (invItem?.reserved ?? 0));
  const daysOfSupply = metrics ? metrics.daysOfSupply : null;
  const healthStats = invItem 
     ? AnalyticsEngine.calculateInventoryHealth(invItem, settings) 
     : { available, daysOfSupply: null, status: 'Healthy', risk: 'Low' };
`;

content = content.replace(regex, replacement);

const aiResponseRegex = /setAiResponse\(`ORION Diagnostic for SKU \$\{skuId\} \(\$\{product\?\.name \|\| 'Inventory Item'\}\\n\):- Current Available Stock: \$\{formatNumber\(available\)\} units across warehouses\.- Days of Supply: \$\{formattedDos\} days \(Threshold: \$\{settings\.criticalStockOutDays\} days\)\.- Risk Status: \$\{healthStats\.status\.toUpperCase\(\)\}\.- Linked POs: \$\{relatedPOs\.length\} active purchase orders\.- Recommendation: Maintain safety stock threshold and monitor inbound transit delays from \$\{supplier\?\.name \|\| 'primary supplier'\}\.`\);/m;

const aiResponseReplacement = `
      let analysis = \`ORION Diagnostic for SKU \${skuId} (\${product?.name || 'Inventory Item'}):\\n\\n\`;
      analysis += \`- Current Available Stock: \${formatNumber(available)} units\\n\`;
      analysis += \`- Demand Forecast: \${forecast ? forecast.trend : 'STABLE'} (\${forecast ? forecast.trendPercentage : 0}% change)\\n\`;
      analysis += \`- Days of Supply: \${formattedDos} days (Threshold: \${settings.criticalStockOutDays} days)\\n\`;
      if (metrics && metrics.stockOutDate) {
        analysis += \`- **CRITICAL RISK**: Projected stock-out on \${formatDateOnly(metrics.stockOutDate)}\\n\`;
      }
      analysis += \`- Incoming Supply: \${metrics ? formatNumber(metrics.incoming) : 0} units\\n\`;
      if (metrics && metrics.projectedShortage > 0) {
        analysis += \`- **SHORTAGE**: Projected deficit of \${formatNumber(metrics.projectedShortage)} units after all incoming shipments arrive.\\n\`;
      }
      analysis += \`- Recommendation: \${metrics && metrics.stockOutDate ? 'EXPEDITE OPEN POs OR CREATE EMERGENCY TRANSFER' : 'Monitor stock levels'}\`;
      setAiResponse(analysis);
`;

content = content.replace(aiResponseRegex, aiResponseReplacement);

fs.writeFileSync(file, content);
console.log("Inventory UI updated");
