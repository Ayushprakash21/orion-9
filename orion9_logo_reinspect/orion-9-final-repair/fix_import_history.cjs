const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/store/SupplyChainContext.tsx');
let content = fs.readFileSync(file, 'utf8');

// Change importData signature
content = content.replace(
  /importData: \(entityType: string, newRecords: any\[\], filename: string, warningsCount\?: number\) => Promise<void>;/,
  'importData: (entityType: string, newRecords: any[], filename: string, metrics?: { total: number; failed: number; warnings: number }) => Promise<void>;'
);

content = content.replace(
  /const importData = async \(entityType: string, newRecords: any\[\], filename: string, warningsCount: number = 0\) => \{/,
  'const importData = async (entityType: string, newRecords: any[], filename: string, metrics = { total: newRecords.length, failed: 0, warnings: 0 }) => {'
);

content = content.replace(
  /totalRows: newRecords\.length,\s*successfulRows: newRecords\.length,\s*failedRows: 0,\s*warnings: warningsCount,/m,
  'totalRows: metrics.total,\n        successfulRows: newRecords.length,\n        failedRows: metrics.failed,\n        warnings: metrics.warnings,'
);

content = content.replace(
  /status: warningsCount > 0 \? 'Success with warnings' : 'Success'/g,
  "status: metrics.failed > 0 && newRecords.length === 0 ? 'Failed' : (metrics.failed > 0 || metrics.warnings > 0) ? 'Success with warnings' : 'Success'"
);

fs.writeFileSync(file, content);
console.log("SupplyChainContext importData signature fixed.");
