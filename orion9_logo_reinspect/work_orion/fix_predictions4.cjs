const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/Predictions.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/View \{pred\.shortageQuantity\} Related Events/g, "View Entity {pred.entityId}");

fs.writeFileSync(file, content);
console.log("Predictions UI updated again");
