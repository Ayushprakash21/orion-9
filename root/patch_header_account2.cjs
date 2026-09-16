const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');

if (!code.includes("import { AccountMenu }")) {
  code = code.replace("import { NotificationCenter } from '../NotificationCenter';", "import { NotificationCenter } from '../NotificationCenter';\nimport { AccountMenu } from './AccountMenu';");
}

code = code.replace(
  /<span>\{isLocalMode \? 'Local \/ Demo Mode' : 'Operational'\}<\/span>\s*<\/button>\s*<\/div>\s*<\/div>\s*<\/div>/g,
  `<span>{isLocalMode ? 'Local / Demo Mode' : 'Operational'}</span>
            </button>
          </div>
          
          <div className="h-6 w-px bg-os-surface-active mx-1" aria-hidden="true" />
          
          <AccountMenu />
        </div>
      </div>`
);

fs.writeFileSync('src/components/layout/Header.tsx', code);
