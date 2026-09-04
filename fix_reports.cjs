const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/Reports.tsx');
let content = fs.readFileSync(file, 'utf8');

const regex = /<div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-12">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/m;
const regex2 = /<div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">[\s\S]*?<\/div>\s*<\/div>/m;

const replacement2 = `
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          
          <div>
            <h3 className="text-[10px] uppercase tracking-widest text-[#B3B3B3] print:text-gray-800 font-bold mb-4 border-b border-[#2A2A2A] print:border-black pb-2">Sub-System Health</h3>
            <div className="space-y-4 font-mono text-xs text-[#F5F5F5] print:text-black">
              <div className="flex justify-between">
                <span className="text-[#777777] uppercase tracking-widest">Inventory</span>
                <span>{health.inventory}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#777777] uppercase tracking-widest">Suppliers</span>
                <span>{health.suppliers}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#777777] uppercase tracking-widest">Procurement</span>
                <span>{health.procurement}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#777777] uppercase tracking-widest">Logistics</span>
                <span>{health.logistics}/100</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-[10px] uppercase tracking-widest text-[#B3B3B3] print:text-gray-800 font-bold mb-4 border-b border-[#2A2A2A] print:border-black pb-2">Orion Health Drivers</h3>
            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-[#FF453A] uppercase tracking-widest font-bold">Negative Drivers</span>
                <ul className="list-disc pl-4 mt-1 text-xs text-[#F5F5F5] font-mono print:text-black space-y-1">
                  {health.primaryDrivers && health.primaryDrivers.length > 0 ? health.primaryDrivers.map((d: string, i: number) => <li key={i}>{d}</li>) : <li className="text-[#777777]">None</li>}
                </ul>
              </div>
              <div className="pt-2">
                <span className="text-[10px] text-[#30D158] uppercase tracking-widest font-bold">Positive Drivers</span>
                <ul className="list-disc pl-4 mt-1 text-xs text-[#F5F5F5] font-mono print:text-black space-y-1">
                  {health.positiveDrivers && health.positiveDrivers.length > 0 ? health.positiveDrivers.map((d: string, i: number) => <li key={i}>{d}</li>) : <li className="text-[#777777]">None</li>}
                </ul>
              </div>
            </div>
          </div>

        </div>
`;

content = content.replace(regex2, replacement2);
fs.writeFileSync(file, content);
console.log("Reports updated");
