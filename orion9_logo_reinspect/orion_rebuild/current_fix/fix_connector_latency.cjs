const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const file = path.join(srcDir, 'services/ConnectorFramework.ts');
let content = fs.readFileSync(file, 'utf8');

// Replace fake latency with simulated flags
content = content.replace(/latency: '72ms'/g, "latency: 'SIMULATED'");
content = content.replace(/this\.latency = '72ms';/g, "this.latency = 'SIMULATED';");
content = content.replace(/latency: '350ms'/g, "latency: '-'");

fs.writeFileSync(file, content);

const file2 = path.join(srcDir, 'components/Integrations.tsx');
let content2 = fs.readFileSync(file2, 'utf8');

content2 = content2.replace(/CONNECTED \(Latency: ' \+ testResult\.latency \+ '\)/g, "CONNECTED (SIMULATED)");
// Replace 'CONNECTED' visually
content2 = content2.replace(/<span className="text-\[10px\] font-mono uppercase tracking-wider text-green-500 bg-green-500\/10 px-2 py-0\.5 rounded">Connected<\/span>/g, '<span className="text-[10px] font-mono uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded" title="This is a simulated connection">SIMULATION MODE</span>');

fs.writeFileSync(file2, content2);
console.log("Connector fixed.");
