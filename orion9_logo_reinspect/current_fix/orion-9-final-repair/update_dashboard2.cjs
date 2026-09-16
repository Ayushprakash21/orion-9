const fs = require('fs');

let dashboard = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const returnStatement = `  return (
    <div className="space-y-6">
      {/* OS Tagline Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-2 border-b border-white/5">
        <div>
          <h2 className="text-2xl font-light text-slate-100 tracking-wide">SYSTEM OVERVIEW</h2>
          <p className="text-[10px] text-cyan-500 uppercase tracking-[0.3em] font-bold mt-2">CONNECT <span className="text-slate-600 mx-1">•</span> OBSERVE <span className="text-slate-600 mx-1">•</span> PREDICT <span className="text-slate-600 mx-1">•</span> ACT</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-sm text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            ALL SYSTEMS NOMINAL
          </div>
        </div>
      </div>
`;

dashboard = dashboard.replace('  return (\n    <div className="space-y-6">', returnStatement);
fs.writeFileSync('src/components/Dashboard.tsx', dashboard);
