const fs = require('fs');

function updateFile(file) {
  let code = fs.readFileSync(file, 'utf8');

  // Replace daysOfSupply calc
  code = code.replace(
    'const daysOfSupply = available / (inventory.averageDailyDemand || 1);',
    'const daysOfSupply = (inventory.averageDailyDemand && inventory.averageDailyDemand > 0) ? available / inventory.averageDailyDemand : null;'
  );
  code = code.replace(
    'const daysOfSupply = available / (inv.averageDailyDemand || 1);',
    'const daysOfSupply = (inv.averageDailyDemand && inv.averageDailyDemand > 0) ? available / inv.averageDailyDemand : null;'
  );

  // Replace logic
  const oldLogic = `if (daysOfSupply <= settings.criticalStockOutDays) {
      status = 'Critical';
      risk = 'High';
    } else if (daysOfSupply <= (inventory.reorderPoint / (inventory.averageDailyDemand || 1))) {
      status = 'Low Stock';
      risk = 'Medium';
    } else if (daysOfSupply >= settings.excessInventoryDays) {
      status = 'Excess';
      risk = 'Medium';
    }`;

  const newLogic = `if (daysOfSupply !== null) {
      if (daysOfSupply <= settings.criticalStockOutDays) {
        status = 'Critical';
        risk = 'High';
      } else if (daysOfSupply <= (inventory.reorderPoint / inventory.averageDailyDemand)) {
        status = 'Low Stock';
        risk = 'Medium';
      } else if (daysOfSupply >= settings.excessInventoryDays) {
        status = 'Excess';
        risk = 'Medium';
      }
    }`;

  code = code.replace(oldLogic, newLogic);
  
  // Also fix ExceptionEngine
  const exceptionLogicOld = `if (daysOfSupply <= settings.criticalStockOutDays) {`;
  const exceptionLogicNew = `if (daysOfSupply !== null && daysOfSupply <= settings.criticalStockOutDays) {`;
  code = code.replace(exceptionLogicOld, exceptionLogicNew);
  
  const exceptionLogicOld2 = `} else if (daysOfSupply <= (inv.reorderPoint / (inv.averageDailyDemand || 1))) {`;
  const exceptionLogicNew2 = `} else if (daysOfSupply !== null && daysOfSupply <= (inv.reorderPoint / inv.averageDailyDemand)) {`;
  code = code.replace(exceptionLogicOld2, exceptionLogicNew2);
  
  const exceptionLogicOld3 = `} else if (daysOfSupply >= settings.excessInventoryDays) {`;
  const exceptionLogicNew3 = `} else if (daysOfSupply !== null && daysOfSupply >= settings.excessInventoryDays) {`;
  code = code.replace(exceptionLogicOld3, exceptionLogicNew3);

  fs.writeFileSync(file, code);
}

updateFile('src/services/AnalyticsEngine.ts');
updateFile('src/services/ExceptionEngine.ts');

