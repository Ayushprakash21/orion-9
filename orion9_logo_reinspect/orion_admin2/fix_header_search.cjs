const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/layout/Header.tsx');
let content = fs.readFileSync(file, 'utf8');

const regex = /    const foundExc = exceptions\.find\(e => e\.id\.toLowerCase\(\) === q\);\n    if \(foundExc\) \{\n      openEntity\('exception', foundExc\.id\);\n      setSearchQuery\(''\);\n      return;\n    \}/m;

const replacement = `    const foundExc = exceptions.find(e => e.id.toLowerCase() === q);
    if (foundExc) {
      openEntity('exception', foundExc.id);
      setSearchQuery('');
      return;
    }
    
    // Check for Warehouse
    const { warehouses } = useSupplyChain.getState ? useSupplyChain.getState() : { warehouses: [] }; // or just rely on the ones we import from useSupplyChain()
`;

// But wait, warehouses is not destructured from useSupplyChain in Header.tsx
content = content.replace(/const \{ inventory, products, suppliers, purchaseOrders, shipments, exceptions \} = useSupplyChain\(\);/, 'const { inventory, products, suppliers, purchaseOrders, shipments, exceptions, warehouses } = useSupplyChain();');

const replacement2 = `    const foundExc = exceptions.find(e => e.id.toLowerCase() === q);
    if (foundExc) {
      openEntity('exception', foundExc.id);
      setSearchQuery('');
      return;
    }
    
    const foundWh = warehouses.find(w => w.id.toLowerCase() === q || w.name.toLowerCase().includes(q));
    if (foundWh) {
      // openEntity('warehouse', foundWh.id);
      alert('Warehouse ' + foundWh.name + ' found. Warehouse details not yet implemented.');
      setSearchQuery('');
      return;
    }`;

content = content.replace(regex, replacement2);
fs.writeFileSync(file, content);
console.log("Header Search updated");
