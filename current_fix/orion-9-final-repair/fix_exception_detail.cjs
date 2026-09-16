const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/drawers/ExceptionDetailContent.tsx');
let content = fs.readFileSync(file, 'utf8');

const regex = /<div key=\{node\.id\}[\s\S]*?<\/div>/m;

const replacement = `
                    <div key={node.id} className="relative bg-[#111111] p-3 border border-[#2A2A2A] rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className={\`w-2 h-2 rounded-full \${node.status === 'Critical' || node.status === 'Delayed' || node.status === 'Overdue' ? 'bg-[#FF453A]' : 'bg-[#FF9F0A]'}\`}></div>
                          <span className="text-xs font-medium text-[#F5F5F5]">{node.label}</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#777777] uppercase px-1.5 py-0.5 bg-[#1B1B1B] rounded">
                          {node.type}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#B3B3B3] font-mono pl-4">{node.evidence}</div>
                      {node.causality && (
                        <div className="mt-2 pl-4">
                          <span className={\`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border \${
                            node.causality === 'ROOT CAUSE' ? 'bg-[#FF453A]/10 text-[#FF453A] border-[#FF453A]/20' :
                            node.causality === 'CONTRIBUTING FACTOR' ? 'bg-[#FF9F0A]/10 text-[#FF9F0A] border-[#FF9F0A]/20' :
                            'bg-[#30D158]/10 text-[#30D158] border-[#30D158]/20'
                          }\`}>
                            {node.causality}
                          </span>
                        </div>
                      )}
                    </div>`;

// Replace all occurrences just in case, but usually it's within a map
content = content.replace(/<div key=\{node\.id\} className="relative bg-\[#111111\] p-3 border border-\[#2A2A2A\] rounded-lg">[\s\S]*?<\/div>\s*<\/div>\s*\)\)\}/, 
`                    <div key={node.id} className="relative bg-[#111111] p-3 border border-[#2A2A2A] rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className={\`w-2 h-2 rounded-full \${node.status === 'Critical' || node.status === 'Delayed' || node.status === 'Overdue' ? 'bg-[#FF453A]' : 'bg-[#FF9F0A]'}\`}></div>
                          <span className="text-xs font-medium text-[#F5F5F5]">{node.label}</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#777777] uppercase px-1.5 py-0.5 bg-[#1B1B1B] rounded">
                          {node.type}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#B3B3B3] font-mono pl-4">{node.evidence}</div>
                      {node.causality && (
                        <div className="mt-2 pl-4">
                          <span className={\`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border \${
                            node.causality === 'ROOT CAUSE' ? 'bg-[#FF453A]/10 text-[#FF453A] border-[#FF453A]/20' :
                            node.causality === 'CONTRIBUTING FACTOR' ? 'bg-[#FF9F0A]/10 text-[#FF9F0A] border-[#FF9F0A]/20' :
                            'bg-[#30D158]/10 text-[#30D158] border-[#30D158]/20'
                          }\`}>
                            {node.causality}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}`);

fs.writeFileSync(file, content);
console.log("ExceptionDetailContent updated for root cause");
