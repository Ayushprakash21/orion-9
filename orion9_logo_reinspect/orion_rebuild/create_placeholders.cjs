const fs = require('fs');

const createComponent = (name, title) => {
  const content = `
import React from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { AlertCircle } from 'lucide-react';

export const ${name} = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-2 border-b border-white/5">
        <div>
          <h2 className="text-2xl font-light text-slate-100 tracking-wide">${title}</h2>
          <p className="text-[10px] text-cyan-500 uppercase tracking-[0.3em] font-bold mt-2">OPERATIONAL MODULE</p>
        </div>
      </div>
      
      <div className="bg-[#020408]/50 border border-white/5 p-8 rounded-sm flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-lg text-slate-200 font-medium mb-2">Module Initializing</h3>
        <p className="text-sm text-slate-500 max-w-md">This operational module is being brought online. It will connect to integrated data sources automatically once configured.</p>
      </div>
    </div>
  );
};
  `;
  fs.writeFileSync(`src/components/${name}.tsx`, content.trim());
};

createComponent('Inbound', 'INBOUND COMMAND');
createComponent('Outbound', 'OUTBOUND COMMAND');
createComponent('Predictions', 'PREDICTIVE INTELLIGENCE');
createComponent('Scenarios', 'SCENARIO ENGINE');
createComponent('SyncMonitor', 'SYNC MONITOR');
createComponent('DataQuality', 'DATA QUALITY');

