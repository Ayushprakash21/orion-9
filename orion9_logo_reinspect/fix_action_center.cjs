const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/Dashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

const regex = /<div className="space-y-3">\s*<div className="text-\[10px\] uppercase tracking-wider text-\[#FF9F0A\] font-semibold flex items-center gap-1"><CheckCircle2 size=\{12\}\/> Actions Requiring Approval<\/div>[\s\S]*?\{priorities\.pendingActions\.length === 0 && <div className="text-xs text-\[#777777\]">No pending actions\.<\/div>\}\s*<\/div>/m;

const replacement = `
           <div className="space-y-3 h-full flex flex-col">
             <div className="text-[10px] uppercase tracking-wider text-[#FF9F0A] font-semibold flex items-center gap-1"><CheckCircle2 size={12}/> Orion Action Center</div>
             <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
               {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(level => {
                 const levelActions = priorities.pendingActions.filter(a => a.priority === level);
                 if (levelActions.length === 0) return null;
                 return (
                   <div key={level} className="space-y-2">
                     <div className="text-[10px] text-[#777777] font-mono tracking-wider">{level} ({levelActions.length})</div>
                     {levelActions.map(a => (
                       <div key={a.id} className="bg-[#111111] p-3 border border-[#2A2A2A] rounded-lg cursor-pointer hover:border-[#777777]" onClick={() => openEntity('action', a.id)}>
                         <div className="flex justify-between items-start mb-1">
                           <div className="text-[10px] text-[#B3B3B3] font-mono truncate max-w-[70%]">{a.issue}</div>
                           <div className={\`text-[9px] font-mono px-1 rounded \${level === 'CRITICAL' ? 'bg-[#FF453A]/20 text-[#FF453A]' : level === 'HIGH' ? 'bg-[#FF9F0A]/20 text-[#FF9F0A]' : 'bg-[#30D158]/20 text-[#30D158]'}\`}>{level}</div>
                         </div>
                         <div className="text-xs font-medium text-[#F5F5F5] line-clamp-2">{a.recommendation}</div>
                       </div>
                     ))}
                   </div>
                 );
               })}
               {priorities.pendingActions.length === 0 && <div className="text-xs text-[#777777] mt-4">No pending actions. System optimal.</div>}
             </div>
           </div>
`;

content = content.replace(regex, replacement);

fs.writeFileSync(file, content);
console.log("Action Center updated");
