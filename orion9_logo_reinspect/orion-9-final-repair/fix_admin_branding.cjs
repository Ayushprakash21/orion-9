const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminBranding.tsx', 'utf8');

code = code.replace(/ORION 9 OS/g, "ORION SCM OS");
code = code.replace(/<label className="text-\[10px\] uppercase tracking-wider text-os-text-muted font-semibold">Short Description<\/label>/g, '<label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold">Operating System Tagline</label>');

// Let's add the LIVE PREVIEW
// It needs to be placed inside the Core Identity div or near it.
// The structure is roughly:
// <div>
//   <h2 className="text-sm font-semibold uppercase tracking-wider text-os-text-primary mb-4">Core Identity</h2>
const livePreviewHTML = `
        <div className="mb-6 p-4 rounded border border-os-border bg-os-surface-secondary flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-os-text-muted font-bold mb-2">LIVE PREVIEW</div>
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt="Platform Logo" className="h-6 object-contain" />
              ) : (
                <div className="w-6 h-6 rounded bg-os-surface border border-os-border flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-os-text-muted">OS</span>
                </div>
              )}
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <span className="font-sans font-bold text-[13px] tracking-wider text-os-text-primary whitespace-nowrap">
                    {appName || 'ORION SCM OS'}
                  </span>
                </div>
                {description && (
                  <span className="text-[9px] font-mono text-os-text-muted uppercase tracking-widest whitespace-nowrap mt-0.5">
                    {description}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
`;

code = code.replace(/<h2 className="text-sm font-semibold uppercase tracking-wider text-os-text-primary mb-4">Core Identity<\/h2>/, 
  '<h2 className="text-sm font-semibold uppercase tracking-wider text-os-text-primary mb-4">Core Identity</h2>' + livePreviewHTML);

fs.writeFileSync('src/components/admin/AdminBranding.tsx', code);
