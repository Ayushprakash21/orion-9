const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');

if (!code.includes("AccountMenu")) {
  code = code.replace("import { NotificationCenter } from '../NotificationCenter';", "import { NotificationCenter } from '../NotificationCenter';\nimport { AccountMenu } from './AccountMenu';");
  
  // Add to right side
  code = code.replace(
    /<SystemStatusModal isOpen=\{isStatusModalOpen\} onClose=\{\(\) => setIsStatusModalOpen\(false\)\} \/>/,
    `<SystemStatusModal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} />\n        <div className="hidden md:block md:h-6 md:w-px md:bg-os-surface-active" aria-hidden="true" />\n        <div className="relative">\n          <AccountMenu />\n        </div>`
  );
  
  fs.writeFileSync('src/components/layout/Header.tsx', code);
}
