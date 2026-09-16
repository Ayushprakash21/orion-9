const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminLayout.tsx', 'utf8');

code = code.replace(
  /<div className="p-4">\s*<NavLink\s*to="\/"\s*className="flex items-center gap-2 px-3 py-2 text-sm text-os-text-secondary hover:text-os-text-primary hover:bg-os-surface rounded-md transition-colors border border-transparent hover:border-os-border"\s*>\s*<ArrowLeft size={16} \/>\s*Back to App\s*<\/NavLink>\s*<\/div>/,
  ''
);

fs.writeFileSync('src/components/admin/AdminLayout.tsx', code);
