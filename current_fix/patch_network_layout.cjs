const fs = require('fs');
let code = fs.readFileSync('src/components/deep-intelligence/NetworkIntelligenceView.tsx', 'utf8');

code = code.replace(
  /grid-cols-2 sm:grid-cols-3 lg:grid-cols-6/g,
  'grid-cols-1 sm:grid-cols-3 lg:grid-cols-6'
);

code = code.replace(
  /grid-cols-2 sm:grid-cols-4/g,
  'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
);

fs.writeFileSync('src/components/deep-intelligence/NetworkIntelligenceView.tsx', code);
