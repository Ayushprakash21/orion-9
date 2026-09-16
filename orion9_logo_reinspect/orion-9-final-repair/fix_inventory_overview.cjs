const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/drawers/InventoryDetailContent.tsx');
let content = fs.readFileSync(file, 'utf8');

const regex = /<div className="flex justify-between py-2 border-b border-\[#2A2A2A\]">\s*<span className="text-\[#777777\]">Daily Demand<\/span>\s*<span className="font-mono text-\[#F5F5F5\]">\s*\{dailyDemand !== null && dailyDemand !== undefined \? \`\$\{formatNumber\(dailyDemand, 1\)\} units\/day\` : 'N\/A'\}\s*<\/span>\s*<\/div>/m;

const replacement = `
              <div className="flex justify-between py-2 border-b border-[#2A2A2A]">
                <span className="text-[#777777]">Daily Demand</span>
                <span className="font-mono text-[#F5F5F5]">
                  {dailyDemand !== null && dailyDemand !== undefined ? \`\${formatNumber(dailyDemand, 1)} units/day\` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#2A2A2A]">
                <span className="text-[#777777]">Projected Stock-Out Date</span>
                <span className={\`font-mono \${metrics?.stockOutDate ? 'text-[#FF453A]' : 'text-[#30D158]'}\`}>
                  {metrics?.stockOutDate ? formatDateOnly(metrics.stockOutDate) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#2A2A2A]">
                <span className="text-[#777777]">Forecast Trend</span>
                <span className="font-mono text-[#F5F5F5]">
                  {forecast ? \`\${forecast.trend} (\${forecast.trendPercentage}%)\` : 'N/A'}
                </span>
              </div>
`;

content = content.replace(regex, replacement);

const demandRegex = /<div className="bg-\[#111111\] p-4 rounded-lg border border-\[#2A2A2A\] flex justify-between items-center">\s*<span className="text-xs text-\[#777777\]">Average Daily Demand<\/span>\s*<span className="font-mono text-sm text-\[#F5F5F5\]">\{formatNumber\(dailyDemand, 1\)\} units\/day<\/span>\s*<\/div>\s*<div className="bg-\[#111111\] p-4 rounded-lg border border-\[#2A2A2A\] flex justify-between items-center">\s*<span className="text-xs text-\[#777777\]">30-Day Projected Consumption<\/span>\s*<span className="font-mono text-sm text-\[#F5F5F5\]">\{formatNumber\(Math\.round\(dailyDemand \* 30\)\)\} units<\/span>\s*<\/div>/m;

const demandReplacement = `
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#111111] p-4 rounded-lg border border-[#2A2A2A] space-y-1">
                    <span className="text-[10px] uppercase font-mono text-[#777777]">Average Daily Demand</span>
                    <div className="font-mono text-sm text-[#F5F5F5]">{formatNumber(dailyDemand, 1)} units/day</div>
                  </div>
                  <div className="bg-[#111111] p-4 rounded-lg border border-[#2A2A2A] space-y-1">
                    <span className="text-[10px] uppercase font-mono text-[#777777]">Demand Trend</span>
                    <div className="font-mono text-sm text-[#F5F5F5]">{forecast ? \`\${forecast.trend} (\${forecast.trendPercentage}%)\` : 'N/A'}</div>
                  </div>
                  <div className="bg-[#111111] p-4 rounded-lg border border-[#2A2A2A] space-y-1">
                    <span className="text-[10px] uppercase font-mono text-[#777777]">7-Day Forecast</span>
                    <div className="font-mono text-sm text-[#F5F5F5]">{forecast ? formatNumber(forecast.forecast7Day) : 'N/A'} units</div>
                  </div>
                  <div className="bg-[#111111] p-4 rounded-lg border border-[#2A2A2A] space-y-1">
                    <span className="text-[10px] uppercase font-mono text-[#777777]">30-Day Forecast</span>
                    <div className="font-mono text-sm text-[#F5F5F5]">{forecast ? formatNumber(forecast.forecast30Day) : formatNumber(Math.round(dailyDemand * 30))} units</div>
                  </div>
                </div>
`;

content = content.replace(demandRegex, demandReplacement);

fs.writeFileSync(file, content);
console.log("Inventory detail updated");
