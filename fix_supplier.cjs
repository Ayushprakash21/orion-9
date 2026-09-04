const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/services/AnalyticsEngine.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import { Product, Warehouse, Inventory, Supplier, PurchaseOrder, Shipment, Exception } from '../types';", "import { Product, Warehouse, Inventory, Supplier, PurchaseOrder, Shipment, Exception } from '../types';\nimport { SupplierEngine } from './SupplierEngine';");

// Remove calculateSupplierScore and determineSupplierStatus
content = content.replace(/  static calculateSupplierScore[\s\S]*?determineSupplierStatus[\s\S]*?High Risk';\n  }\n/m, "");

content = content.replace(/this\.calculateSupplierScore\(s, settings\)/g, "SupplierEngine.calculateScore(s, settings).score");

fs.writeFileSync(file, content);
console.log("Analytics engine fixed");
