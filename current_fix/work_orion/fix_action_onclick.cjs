const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/Dashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

// The mobile action card
content = content.replace(/<MobileRecordCard[\s\n]*key=\{act\.id\}[\s\n]*onClick=\{\(\) => navigate\('\/exceptions'\)\}/g, `<MobileRecordCard
                key={act.id}
                onClick={() => openEntity('action', act.id)}`);

fs.writeFileSync(file, content);
console.log("Dashboard mobile onclick fixed");
