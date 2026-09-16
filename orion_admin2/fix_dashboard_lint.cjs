const fs = require('fs');
const path = require('path');

const file1 = path.join(__dirname, 'src/components/Dashboard.tsx');
let content1 = fs.readFileSync(file1, 'utf8');

content1 = content1.replace(/onClick=\{\(\) => openEntity\(\{ type: 'action', id: act\.id \}\)\}/g, "onClick={() => openEntity('action', act.id)}");

fs.writeFileSync(file1, content1);
console.log("Fixed dashboard openEntity calls");
