const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/DataCenter.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /await importData\(importPreview\.entityType, importPreview\.validData, importPreview\.filename, importPreview\.warnings\?\.length \|\| 0\);/g,
  'await importData(importPreview.entityType, importPreview.validData, importPreview.filename, { total: importPreview.validData.length + (importPreview.errors?.length || 0), failed: importPreview.errors?.length || 0, warnings: importPreview.warnings?.length || 0 });'
);

// We need to show errors in the preview
content = content.replace(
  /importPreview\.validData\.length > 0 && \(/g,
  'true && ('
);

content = content.replace(
  /<span className="text-emerald-500 font-mono">\{importPreview\.validData\.length\} VALID<\/span>/g,
  '<span className="text-emerald-500 font-mono">{importPreview.validData.length} VALID</span>\n<span className="text-red-500 font-mono">{importPreview.errors?.length || 0} REJECTED</span>'
);

fs.writeFileSync(file, content);
console.log("DataCenter import fix complete.");
