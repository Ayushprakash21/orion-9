const fs = require('fs');
let code = fs.readFileSync('src/components/Shipments.tsx', 'utf8');

// Ensure we get all instances
code = code.replace(/item.status === 'Preparing'/g, "item.status === 'Planned'");
code = code.replace(/item.status === 'Customs'/g, "item.status === 'Exception'");
code = code.replace(/item.status === 'Out for Delivery'/g, "item.status === 'Picked Up'");

code = code.replace(/=== 'Preparing'/g, "=== 'Planned'");
code = code.replace(/=== 'Customs'/g, "=== 'Exception'");
code = code.replace(/=== 'Out for Delivery'/g, "=== 'Picked Up'");

fs.writeFileSync('src/components/Shipments.tsx', code);
