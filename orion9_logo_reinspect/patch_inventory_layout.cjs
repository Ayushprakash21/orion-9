const fs = require('fs');
let code = fs.readFileSync('src/components/Inventory.tsx', 'utf8');

code = code.replace(
  /className="grid grid-cols-2 sm:grid-cols-4 gap-2/g,
  'className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2'
);

code = code.replace(
  /className="grid grid-cols-2 sm:grid-cols-5 gap-2"/g,
  'className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2"'
);

// Also look at Highest Risk SKU Card
code = code.replace(
  /className="mt-4 grid grid-cols-2 gap-3/g,
  'className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3'
);

fs.writeFileSync('src/components/Inventory.tsx', code);
