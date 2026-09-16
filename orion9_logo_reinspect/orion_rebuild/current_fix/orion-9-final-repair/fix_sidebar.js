const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

// The original string we want to replace:
// <BrandLogo size={24} variant="mark" />            <span className="font-mono font-bold text-sm tracking-wider text-os-text-primary group-hover:text-cyan-500 transition-colors truncate">              {branding.appName || "ORION SCM OS"}            </span>
// or something similar.

// Let's replace the whole header div
const headerRegex = /<div className="flex h-16 w-full items-center justify-between px-4 border-b border-os-border shrink-0 box-border bg-os-surface-secondary">.*?<\/button>\s*<\/div>/g;

const newHeader = `<div className="flex h-16 w-full items-center justify-between px-4 sm:px-5 border-b border-os-border shrink-0 box-border bg-os-surface-secondary overflow-hidden">
          <NavLink
            to="/"
            onClick={() => {
              if (window.innerWidth < 768) closeSidebar();
            }}
            className="flex items-center gap-3 group transition-opacity hover:opacity-90 shrink-0"
            title="Return to Command Center / Dashboard"
          >
            <div className="shrink-0">
              <BrandLogo size={24} variant="mark" />
            </div>
            <div className="flex flex-col justify-center shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-sans font-bold text-[13px] tracking-wider text-white whitespace-nowrap">
                  {branding.appName || "ORION SCM OS"}
                </span>
              </div>
              <span className="text-[9px] font-mono text-os-text-muted uppercase tracking-widest whitespace-nowrap mt-0.5">
                AI SCM OS
              </span>
            </div>
          </NavLink>
          <button
            type="button"
            onClick={closeSidebar}
            className="md:hidden p-1.5 -mr-1 text-os-text-secondary hover:text-os-text-primary hover:bg-os-surface-hover rounded transition-colors shrink-0"
            title="Close navigation"
          >
            <X size={18} />
          </button>
        </div>`;

code = code.replace(headerRegex, newHeader.replace(/\n/g, ' '));
code = code.replace(/w-64/g, 'w-[280px]');

fs.writeFileSync('src/components/layout/Sidebar.tsx', code);
