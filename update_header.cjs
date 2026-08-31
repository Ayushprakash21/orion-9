const fs = require('fs');

let headerStr = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');
headerStr = headerStr.replace(
  '<h1 className="text-[10px] uppercase tracking-[0.4em] text-cyan-500 font-bold mb-0.5">Control Tower</h1>',
  '<h1 className="text-[10px] uppercase tracking-[0.4em] text-cyan-500 font-bold mb-0.5" title="AI Supply Chain Operating System">ORION-9 OS</h1>'
);
fs.writeFileSync('src/components/layout/Header.tsx', headerStr);

let indexStr = fs.readFileSync('index.html', 'utf8');
indexStr = indexStr.replace(/AI Supply Chain Control Tower/g, 'ORION-9: AI Supply Chain Operating System');
indexStr = indexStr.replace(/An enterprise-style supply-chain decision-support platform powered by Google Gemini, allowing managers to monitor performance, identify risks, and ask an AI assistant questions./g, 'ORION-9: AI Supply Chain Operating System. CONNECT. OBSERVE. PREDICT. ACT.');
fs.writeFileSync('index.html', indexStr);

