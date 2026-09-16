const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/drawers/ActionDetailContent.tsx');
let content = fs.readFileSync(file, 'utf8');

const regex = /<div className="bg-\[#151515\] p-4 rounded-lg border border-\[#30D158\]\/30 space-y-2 mt-4 relative overflow-hidden">[\s\S]*?<\/div>/m;

const replacement = `
        <div className="bg-[#151515] p-4 rounded-lg border border-[#30D158]/30 space-y-2 mt-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#30D158]"></div>
          <div className="text-[10px] font-mono text-[#30D158] uppercase tracking-wider">Recommended Action</div>
          <p className="text-sm text-[#F5F5F5] font-medium">{action.recommendation}</p>
          <div className="pt-2">
            <button onClick={() => alert('Simulating scenario... Projected risk reduced to LOW. Estimated savings: ' + action.impact)} className="text-[10px] uppercase font-mono text-[#30D158] hover:underline flex items-center gap-1">
              <BrainCircuit size={12} /> Run What-If Simulation
            </button>
          </div>
        </div>
`;
content = content.replace(regex, replacement);

fs.writeFileSync(file, content);
console.log("Action Simulate updated");
