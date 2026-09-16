const fs = require('fs');
let code = fs.readFileSync('src/components/Settings.tsx', 'utf8');

if (!code.includes("useAuth")) {
  code = code.replace("import { useSupplyChain} from '../store/SupplyChainContext';", "import { useSupplyChain} from '../store/SupplyChainContext';\nimport { useAuth } from '../store/AuthContext';");
}

code = code.replace(
  "export const Settings = () => {",
  "export const Settings = () => {\n  const { user, profile, hasRole } = useAuth();\n  const isAdmin = hasRole(['platform_admin']) || profile?.role === 'platform_admin' || user?.id === 'admin' || user?.id === 'local-admin';"
);

const adminSection = `
      {isAdmin && (
        <div className="bg-os-surface border border-os-border shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <div className="p-6 border-b border-os-border bg-black/40">
            <h3 className="text-[10px] uppercase tracking-widest font-bold text-[#FF9F0A] flex items-center gap-2">
              <Shield size={14} className="text-[#FF9F0A]" /> Platform Configuration (Admin)
            </h3>
            <p className="text-xs text-os-text-muted mt-1">Configure global application branding and identity.</p>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-medium text-os-text-secondary mb-2">Operating System Name</label>
                <input 
                  type="text"
                  value={localSettings.applicationName || ''}
                  onChange={(e) => setLocalSettings(prev => ({...prev, applicationName: e.target.value}))}
                  className="w-full bg-os-input-bg border border-os-border rounded-sm px-3 py-2 text-sm text-os-text-primary focus:outline-none focus:border-os-surface-hover"
                  placeholder="ORION SCM OS"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-medium text-os-text-secondary mb-2">Operating System Tagline</label>
                <input 
                  type="text"
                  value={localSettings.applicationTagline || ''}
                  onChange={(e) => setLocalSettings(prev => ({...prev, applicationTagline: e.target.value}))}
                  className="w-full bg-os-input-bg border border-os-border rounded-sm px-3 py-2 text-sm text-os-text-primary focus:outline-none focus:border-os-surface-hover"
                  placeholder="AI Supply Chain Operating System"
                />
              </div>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace(
  /<div className="bg-os-surface border border-os-border shadow-\[0_0_20px_rgba\(0,0,0,0\.5\)\]">\s*<div className="p-6 border-b border-os-border bg-black\/40">\s*<h3 className="text-\[10px\] uppercase tracking-widest font-bold text-os-text-primary flex items-center gap-2">\s*<Monitor size=\{14\} className="text-os-text-secondary" \/> Appearance\s*<\/h3>/,
  adminSection + '\n      <div className="bg-os-surface border border-os-border shadow-[0_0_20px_rgba(0,0,0,0.5)]">\n        <div className="p-6 border-b border-os-border bg-black/40">\n          <h3 className="text-[10px] uppercase tracking-widest font-bold text-os-text-primary flex items-center gap-2">\n            <Monitor size={14} className="text-os-text-secondary" /> Appearance\n          </h3>'
);

fs.writeFileSync('src/components/Settings.tsx', code);
