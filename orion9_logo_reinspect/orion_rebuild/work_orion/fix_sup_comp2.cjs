const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/Suppliers.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace("        riskScore", ""); // just remove the second one

fs.writeFileSync(file, content);
