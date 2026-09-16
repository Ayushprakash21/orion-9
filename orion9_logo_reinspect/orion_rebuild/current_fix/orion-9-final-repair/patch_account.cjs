const fs = require('fs');
let code = fs.readFileSync('src/components/layout/AccountMenu.tsx', 'utf8');

code = code.replace(
  /className="w-full flex items-center justify-between p-4 border-t border-os-border shrink-0 bg-transparent hover:bg-os-surface-hover transition-colors cursor-pointer outline-none"/,
  'className="flex items-center gap-2 p-1 pr-2 rounded-md bg-os-surface border border-transparent hover:border-os-border hover:bg-os-surface-secondary transition-colors cursor-pointer outline-none"'
);

// We need to change the inside of the button to be compact
const buttonInnerOld = `<div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-os-surface-secondary border border-os-border flex items-center justify-center shrink-0 overflow-hidden">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-medium text-os-text-primary">
                {profile?.displayName ? profile.displayName.substring(0,2).toUpperCase() : <User size={14} className="text-os-text-muted" />}
              </span>
            )}
          </div>
          <div className="overflow-hidden flex-1 text-left">
            <p className="text-xs font-medium text-os-text-primary truncate">{profile?.displayName || 'User Profile'}</p>
            <p className="text-[10px] uppercase tracking-wider text-os-text-muted truncate">{organization?.name || profile?.role || 'Unassigned'}</p>
          </div>
        </div>
        <ChevronDown size={16} className={\`text-os-text-muted transition-transform \${isOpen ? 'rotate-180' : ''}\`} />`;

const buttonInnerNew = `<div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-os-surface-secondary border border-os-border flex items-center justify-center shrink-0 overflow-hidden">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-medium text-os-text-primary">
                {profile?.displayName ? profile.displayName.substring(0,2).toUpperCase() : <User size={14} className="text-os-text-muted" />}
              </span>
            )}
          </div>
          <div className="hidden sm:block text-left max-w-[120px]">
            <p className="text-xs font-medium text-os-text-primary truncate">{profile?.displayName || 'User Profile'}</p>
            <p className="text-[9px] uppercase tracking-wider text-os-text-muted truncate">{organization?.name || profile?.role?.replace('_', ' ') || 'Unassigned'}</p>
          </div>
        </div>
        <ChevronDown size={14} className={\`text-os-text-muted transition-transform \${isOpen ? 'rotate-180' : ''}\`} />`;

code = code.replace(buttonInnerOld, buttonInnerNew);

fs.writeFileSync('src/components/layout/AccountMenu.tsx', code);
