const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/Dashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

// Ah! act.impact is a string ("12000") but formatCurrency expects a number.
content = content.replace(/formatCurrency\(act\.impact, currency\)/g, "formatCurrency(Number(act.impact), currency)");

fs.writeFileSync(file, content);
console.log("Fixed act.impact formatCurrency");
