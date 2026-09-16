const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/Procurement.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /item\.status === 'Delayed' \? 'bg-\[#1B1B1B\] text-\[#FF453A\] border-\[#2A2A2A\]' :/g,
  "item.status === 'Delayed' || item.status === 'Overdue' ? 'bg-[#1B1B1B] text-[#FF453A] border-[#2A2A2A]' :"
);

fs.writeFileSync(file, content);
console.log("Procurement styles updated");
