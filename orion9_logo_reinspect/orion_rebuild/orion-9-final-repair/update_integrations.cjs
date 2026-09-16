const fs = require('fs');

const content = `
import React from 'react';
import { Network, Database, Globe, Cpu, ArrowRight, ShieldCheck, AlertCircle, RefreshCw, Layers } from 'lucide-react';

const integrations = [
  {
    category: 'Enterprise Systems',
    items: [
      { id: 'sap', name: 'SAP S/4HANA', description: 'Enterprise Resource Planning connection', connectorStatus: 'AVAILABLE', connectionStatus: 'NOT CONFIGURED', type: 'ERP' },
      { id: 'oracle', name: 'Oracle Fusion', description: 'Enterprise Resource Planning connection', connectorStatus: 'AVAILABLE', connectionStatus: 'NOT CONFIGURED', type: 'ERP' },
      { id: 'dynamics', name: 'Dynamics 365', description: 'Enterprise Resource Planning connection', connectorStatus: 'AVAILABLE', connectionStatus: 'NOT CONFIGURED', type: 'ERP' },
      { id: 'salesforce', name: 'Salesforce', description: 'Customer Relationship Management', connectorStatus: 'AVAILABLE', connectionStatus: 'NOT CONFIGURED', type: 'CRM' },
      { id: 'wms', name: 'Manhattan WMS', description: 'Warehouse Management System', connectorStatus: 'AVAILABLE', connectionStatus: 'NOT CONFIGURED', type: 'WMS' },
      { id: 'tms', name: 'Blue Yonder TMS', description: 'Transportation Management System', connectorStatus: 'AVAILABLE', connectionStatus: 'NOT CONFIGURED', type: 'TMS' }
    ]
  },
  {
    category: 'B2B & External',
    items: [
      { id: 'suppliers', name: 'Supplier Network EDI', description: 'Direct vendor system linkages', connectorStatus: 'AVAILABLE', connectionStatus: 'NOT CONFIGURED', type: 'EDI' },
      { id: 'webhooks', name: 'Webhooks', description: 'Event-driven real-time updates', connectorStatus: 'AVAILABLE', connectionStatus: 'NOT CONFIGURED', type: 'HOOK' }
    ]
  },
  {
    category: 'Data & Storage',
    items: [
      { id: 'databases', name: 'SQL / NoSQL DB', description: 'Direct database connections', connectorStatus: 'AVAILABLE', connectionStatus: 'NOT CONFIGURED', type: 'DB' },
      { id: 'sftp', name: 'SFTP Server', description: 'Secure file transfer protocol', connectorStatus: 'AVAILABLE', connectionStatus: 'NOT CONFIGURED', type: 'SFTP' },
      { id: 'files', name: 'File Importer', description: 'CSV/Excel manual or automated drops', connectorStatus: 'AVAILABLE', connectionStatus: 'CONNECTED', type: 'FILE' }
    ]
  }
];

export const Integrations = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-light text-slate-100 tracking-wide">INTEGRATION HUB</h2>
          <p className="text-sm text-slate-400 mt-1">Data Ingestion & Integration Layer</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-sm text-xs text-slate-300 uppercase tracking-widest hover:bg-white/10 transition-colors">
            <RefreshCw size={14} />
            Sync All
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-sm text-xs uppercase tracking-widest hover:bg-cyan-500/20 transition-colors">
            <Network size={14} />
            Add Connection
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#020408]/50 border border-white/5 p-4 rounded-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-sm bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
            <Globe size={18} />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Active Connections</div>
            <div className="text-xl font-mono text-slate-200">1</div>
          </div>
        </div>
        <div className="bg-[#020408]/50 border border-white/5 p-4 rounded-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-sm bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
            <RefreshCw size={18} />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Syncing Now</div>
            <div className="text-xl font-mono text-slate-200">0</div>
          </div>
        </div>
        <div className="bg-[#020408]/50 border border-white/5 p-4 rounded-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-sm bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
            <Database size={18} />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Data Ingested (24h)</div>
            <div className="text-xl font-mono text-slate-200">0.0 GB</div>
          </div>
        </div>
        <div className="bg-[#020408]/50 border border-white/5 p-4 rounded-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-sm bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400">
            <AlertCircle size={18} />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Failed Syncs</div>
            <div className="text-xl font-mono text-slate-200">0</div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {integrations.map((section, idx) => (
          <div key={idx}>
            <h3 className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold mb-4 border-b border-white/5 pb-2">{section.category}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.items.map((item) => {
                let statusColor = "text-slate-500 bg-slate-500/10 border-slate-500/20";
                if (item.connectionStatus === 'CONNECTED') statusColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                
                return (
                  <div key={item.id} className="bg-black/40 border border-white/5 p-5 rounded-sm hover:border-white/10 transition-colors group cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                       <Layers size={64} />
                    </div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 group-hover:text-cyan-400 group-hover:border-cyan-500/30 transition-colors">
                        <Cpu size={18} />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] uppercase tracking-widest font-mono text-slate-500">
                          Connector: {item.connectorStatus}
                        </span>
                        <span className={\`text-[10px] uppercase tracking-widest font-mono px-2 py-1 border rounded-sm \${statusColor}\`}>
                          Connection: {item.connectionStatus}
                        </span>
                      </div>
                    </div>
                    
                    <h4 className="text-sm font-medium text-slate-200 mb-1">{item.name}</h4>
                    <p className="text-xs text-slate-500 h-8 line-clamp-2">{item.description}</p>
                    
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">TYPE: {item.type}</span>
                      <ArrowRight size={14} className="text-slate-600 group-hover:text-cyan-400 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
`
fs.writeFileSync('src/components/Integrations.tsx', content);
