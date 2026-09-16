const fs = require('fs');
let code = fs.readFileSync('src/services/InventoryEngine.ts', 'utf8');

const replacement = `
    for (let day = 0; day < horizon; day++) {
      const supplyToday = supplyMap.get(day) || 0;
      currentStock += supplyToday;
      
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + day);`;

code = code.replace(/for \(let day = 0; day < horizon; day\+\+\) \{[\s\S]*?currentStock \+= supplyToday;/, replacement);
fs.writeFileSync('src/services/InventoryEngine.ts', code);
