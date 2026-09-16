const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/DataCenter.tsx');
let content = fs.readFileSync(file, 'utf8');

// Replace record.items with record.lines
content = content.replace(/record\.items/g, 'record.lines');
content = content.replace(/!item\.sku/g, '!line.productId');
content = content.replace(/item\.sku/g, 'line.productId');
content = content.replace(/\(item: any\)/g, '(line: any)');
content = content.replace(/record\.sku/g, 'record.productId');
content = content.replace(/!record\.sku/g, '!record.productId');

fs.writeFileSync(file, content);
console.log("DataCenter fixed.");
