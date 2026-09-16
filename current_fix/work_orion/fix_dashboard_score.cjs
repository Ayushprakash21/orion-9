const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/Dashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

// I also need to import SupplierEngine
if (!content.includes('SupplierEngine')) {
  content = content.replace("import { AnalyticsEngine } from '../services/AnalyticsEngine';", "import { AnalyticsEngine } from '../services/AnalyticsEngine';\nimport { SupplierEngine } from '../services/SupplierEngine';");
  // If AnalyticsEngine was not imported
  if (!content.includes('SupplierEngine')) {
      content = content.replace("import React,", "import { SupplierEngine } from '../services/SupplierEngine';\nimport React,");
  }
}

content = content.replace(/s\.score \|\| 85/g, 's.score || SupplierEngine.calculateScore(s, settings).score');

fs.writeFileSync(file, content);
console.log("Dashboard score fixed.");
