const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');

// First remove the bad injection
code = code.replace(
  /<SystemStatusModal isOpen=\{isStatusModalOpen\} onClose=\{\(\) => setIsStatusModalOpen\(false\)\} \/>\n        <div className="hidden md:block md:h-6 md:w-px md:bg-os-surface-active" aria-hidden="true" \/>\n        <div className="relative">\n          <AccountMenu \/>\n        <\/div>/g,
  '<SystemStatusModal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} />'
);

// Inject correctly inside the flex container
code = code.replace(
  /<\/div>\n      <\/div>\n      <SystemStatusModal/g,
  `</div>\n        <div className="hidden md:block md:h-6 md:w-px md:bg-os-surface-active" aria-hidden="true" />\n        <div className="relative">\n          <AccountMenu />\n        </div>\n      </div>\n      <SystemStatusModal`
);

fs.writeFileSync('src/components/layout/Header.tsx', code);
