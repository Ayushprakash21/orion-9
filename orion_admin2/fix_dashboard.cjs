const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/Dashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

const regex = /<div className="text-\[11px\] uppercase tracking-wider text-\[#F5F5F5\] font-semibold mb-4 flex items-center gap-2">\s*<BrainCircuit size=\{16\} className="text-\[#B3B3B3\]" \/>\s*ORION AI Assessment\s*<\/div>/m;

const replacement = `
          <div className="text-[11px] uppercase tracking-wider text-[#F5F5F5] font-semibold mb-4 flex items-center gap-2">
             <BrainCircuit size={16} className="text-[#30D158]" />
             ORION Management Cockpit
           </div>
           
           <div className="mb-4 bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
             <div className="text-[10px] text-[#777777] uppercase font-mono mb-1">What Requires Management Attention?</div>
             <p className="text-sm text-[#F5F5F5]">
               {primaryIssue ? \`Critical \${primaryIssue.type.toLowerCase()} threatening \${primaryIssue.entityId} requires immediate approval. Estimated financial exposure: \${formatCurrency(primaryIssue.estimatedImpact, currency)}.\` : 'No critical issues require management intervention at this time.'}
             </p>
           </div>
`;

content = content.replace(regex, replacement);

fs.writeFileSync(file, content);
console.log("Dashboard Management Cockpit updated");
