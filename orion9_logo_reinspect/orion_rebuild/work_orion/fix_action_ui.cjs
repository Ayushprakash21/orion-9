const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/drawers/ActionDetailContent.tsx');
let content = fs.readFileSync(file, 'utf8');

const regex = /<div className="bg-\[#111111\] p-4 rounded-lg border border-\[#2A2A2A\] space-y-2">[\s\S]*?<\/div>/m;

const replacement = `
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Issue (WHAT)</div>
            <div className="text-sm font-medium text-[#F5F5F5]">{action.issue}</div>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Affected Entity</div>
            <div className="text-sm font-medium text-[#F5F5F5]">{action.entity}</div>
          </div>
        </div>

        <div className="bg-[#111111] p-4 rounded-lg border border-[#2A2A2A] space-y-3">
          <div>
            <div className="text-[10px] font-mono text-[#777777] uppercase tracking-wider mb-1">Root Cause / Reason (WHY)</div>
            <p className="text-xs text-[#B3B3B3]">{action.reason || 'System identified pattern deviation.'}</p>
          </div>
          
          <div className="pt-3 border-t border-[#2A2A2A]">
            <div className="text-[10px] font-mono text-[#777777] uppercase tracking-wider mb-1">Evidence</div>
            <p className="text-xs text-[#B3B3B3]">{action.evidence || 'Anomaly detected in entity historical data.'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Impact Exposure</div>
            <div className="text-base font-mono text-[#FF453A]">{action.impact}</div>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">AI Confidence</div>
            <div className="text-base font-mono text-[#F5F5F5]">{action.confidence || 'MEDIUM'}</div>
          </div>
        </div>

        <div className="bg-[#151515] p-4 rounded-lg border border-[#30D158]/30 space-y-2 mt-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#30D158]"></div>
          <div className="text-[10px] font-mono text-[#30D158] uppercase tracking-wider">Recommended Action</div>
          <p className="text-sm text-[#F5F5F5] font-medium">{action.recommendation}</p>
        </div>
`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
console.log("Action UI updated");
