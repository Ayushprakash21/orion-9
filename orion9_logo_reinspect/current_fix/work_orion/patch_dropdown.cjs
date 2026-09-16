const fs = require('fs');
let code = fs.readFileSync('src/components/ui/SearchableDropdown.tsx', 'utf8');

code = code.replace(/bg-os-input-bg border border-os-border rounded-sm/g, 'bg-os-input-bg border border-os-border-strong rounded-lg');
code = code.replace(/bg-os-surface border border-os-border rounded-sm/g, 'bg-os-surface border border-os-border-strong rounded-lg overflow-hidden');
code = code.replace(/bg-os-surface-elevated/g, 'bg-os-surface-secondary');

fs.writeFileSync('src/components/ui/SearchableDropdown.tsx', code);
