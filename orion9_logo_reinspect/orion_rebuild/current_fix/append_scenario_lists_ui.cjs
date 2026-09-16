const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/Scenarios.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace("affectedInventory: [], // Left blank for now or populate if needed", "affectedInventory: result.affectedInventoryList || [],");
content = content.replace("affectedPos: [],", "affectedPos: result.affectedPosList || [],");
content = content.replace("affectedPosCount: result.affectedPos,", "affectedPosCount: result.affectedPosCount || result.affectedPos || 0,");

fs.writeFileSync(file, content);
console.log("Scenarios UI updated lists");
