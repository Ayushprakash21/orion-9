const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/services/PriorityEngine.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\.slice\(0, 3\);\n\n    return \{/g, ".slice(0, 20);\n\n    return {");

fs.writeFileSync(file, content);
console.log("PriorityEngine updated");
