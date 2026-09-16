const fs = require('fs');
let code = fs.readFileSync('src/components/DataCenter.tsx', 'utf8');

code = code.replace(
  'await importData(importPreview.entityType, importPreview.validData, importPreview.filename);',
  'await importData(importPreview.entityType, importPreview.validData, importPreview.filename, importPreview.warnings?.length || 0);'
);

fs.writeFileSync('src/components/DataCenter.tsx', code);
