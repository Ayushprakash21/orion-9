const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /<LoadingSpinner size="lg" className="text-os-accent" \/>/g,
  '<div className="w-8 h-8 rounded-full border-t-2 border-os-accent animate-spin" />'
);

fs.writeFileSync('src/App.tsx', code);
