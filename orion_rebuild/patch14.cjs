const fs = require('fs');
let code = fs.readFileSync('src/services/InventoryEngine.ts', 'utf8');

const regex = /for \(let day = 0; day < horizon; day\+\+\) \{[\s\S]*?currentStock \+= supplyToday;/m;

const replacement = `
    const supplyMap = new Map<number, number>();
    const todayTime = today.getTime();
    incomingSupply.forEach(s => {
      const sDate = new Date(s.date);
      sDate.setHours(0, 0, 0, 0);
      const diffTime = sDate.getTime() - todayTime;
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < horizon) {
        supplyMap.set(diffDays, (supplyMap.get(diffDays) || 0) + s.qty);
      }
    });

    for (let day = 0; day < horizon; day++) {
      const supplyToday = supplyMap.get(day) || 0;
      currentStock += supplyToday;`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/services/InventoryEngine.ts', code);
