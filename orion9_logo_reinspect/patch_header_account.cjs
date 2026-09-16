const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');

if (!code.includes("import { AccountMenu }")) {
  code = code.replace("import { NotificationCenter } from '../NotificationCenter';", "import { NotificationCenter } from '../NotificationCenter';\nimport { AccountMenu } from './AccountMenu';");
}

const statusModalBlock = `              <span className={\`h-2 w-2 rounded-full \${isLocalMode ? 'bg-cyan-500' : 'bg-emerald-500 animate-pulse'}\`}></span>
              <span>{isLocalMode ? 'Local / Demo Mode' : 'Operational'}</span>
            </button>
          </div>
        </div>
      </div>
      <SystemStatusModal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} />
    </header>`;

const newStatusModalBlock = `              <span className={\`h-2 w-2 rounded-full \${isLocalMode ? 'bg-cyan-500' : 'bg-emerald-500 animate-pulse'}\`}></span>
              <span>{isLocalMode ? 'Local / Demo Mode' : 'Operational'}</span>
            </button>
          </div>
          
          <div className="h-6 w-px bg-os-surface-active mx-1" aria-hidden="true" />
          
          <AccountMenu />
        </div>
      </div>
      <SystemStatusModal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} />
    </header>`;

code = code.replace(statusModalBlock, newStatusModalBlock);

fs.writeFileSync('src/components/layout/Header.tsx', code);
