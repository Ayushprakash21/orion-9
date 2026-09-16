const fs = require('fs');

let datacenter = fs.readFileSync('src/components/DataCenter.tsx', 'utf8');
datacenter = datacenter.replace(/p\.sku === record\.sku/g, 'p.id === record.sku');
datacenter = datacenter.replace(/p\.sku === item\.sku/g, 'p.id === item.sku');
fs.writeFileSync('src/components/DataCenter.tsx', datacenter);

let engine = fs.readFileSync('src/services/ExceptionEngine.ts', 'utf8');
engine = engine.replace('    const today = new Date();\n    \n    const addOrUpdate', '    const addOrUpdate');
fs.writeFileSync('src/services/ExceptionEngine.ts', engine);

