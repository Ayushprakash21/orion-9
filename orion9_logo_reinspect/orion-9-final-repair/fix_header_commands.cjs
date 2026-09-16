const fs = require('fs');

let code = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');

if (!code.includes('import { useNavigate }')) {
  code = code.replace("import { useLocation } from 'react-router-dom';", "import { useLocation, useNavigate } from 'react-router-dom';");
}

code = code.replace("SYNC STATUS: <span className=\"text-emerald-400 ml-2 animate-pulse\">STABLE</span>", "SYSTEM STATUS: <span className=\"text-emerald-400 ml-2 animate-pulse\">OPERATIONAL</span>");

// Add a form to handle search submission
code = code.replace(
  '<input',
  `<form onSubmit={(e) => {
                  e.preventDefault();
                  const q = searchQuery.toLowerCase();
                  if (q.includes('critical inventory')) {
                    alert('Command parsed: Filter Inventory -> Critical');
                  } else if (q.includes('delayed shipments')) {
                    alert('Command parsed: Filter Shipments -> Delayed');
                  } else if (q.includes('overdue purchase orders') || q.includes('overdue pos')) {
                    alert('Command parsed: Filter Procurement -> Overdue');
                  } else if (q.includes('highest risk')) {
                    alert('Command parsed: Filter Suppliers -> High Risk');
                  } else if (q.includes('sku-1000')) {
                    alert('Command parsed: Detail -> SKU-1000');
                  } else if (q.includes('inbound risks')) {
                    alert('That data source is not configured.');
                  } else if (q.includes('compare supplier')) {
                    alert('Command parsed: Analytics -> Supplier Comparison');
                  } else if (q.includes('management focus')) {
                    alert('Command parsed: Action Center -> High Priority');
                  } else {
                    alert('Command not recognized or data source is not configured.');
                  }
                  setSearchQuery('');
                }} className="w-full">
                  <input`
);

code = code.replace(
  'onChange={(e) => setSearchQuery(e.target.value)}\n                />',
  'onChange={(e) => setSearchQuery(e.target.value)}\n                />\n                </form>'
);


fs.writeFileSync('src/components/layout/Header.tsx', code);
