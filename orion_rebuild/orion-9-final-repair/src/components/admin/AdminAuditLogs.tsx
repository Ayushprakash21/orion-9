import React, { useState } from 'react';
import { Search, Filter, Activity, Loader2 } from 'lucide-react';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { format } from 'date-fns';

export const AdminAuditLogs = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { auditEvents } = useSupplyChain();
  
  const filteredLogs = auditEvents.filter(log => 
    log.eventType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (typeof log.details === 'string' && log.details.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light tracking-tight mb-2">Audit Logs</h1>
          <p className="text-sm text-os-text-secondary">Review system-wide activity and security events.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-os-text-muted" />
            <input 
              type="text" 
              placeholder="Search logs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 bg-os-bg border border-os-border rounded-md py-2 pl-9 pr-4 text-sm text-os-text-primary focus:outline-none focus:border-os-border"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-os-surface-elevated border border-os-border rounded-md text-sm hover:bg-os-surface-active transition-colors">
            <Filter size={14} /> <span className="hidden sm:inline">Filter</span>
          </button>
        </div>
      </div>
      
      <div className="flex-1 rounded-lg border border-os-border bg-os-bg overflow-hidden flex flex-col">
        {filteredLogs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-os-surface border border-os-border flex items-center justify-center mb-4">
              <Activity size={24} className="text-os-text-muted" />
            </div>
            <h3 className="text-lg font-medium text-os-text-primary mb-2">No activity recorded</h3>
            <p className="text-os-text-secondary text-sm max-w-sm">
              There are no audit logs matching your criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-os-surface border-b border-os-border text-os-text-muted">
                <tr>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider text-[10px]">Timestamp</th>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider text-[10px]">User</th>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider text-[10px]">Action</th>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider text-[10px]">Resource</th>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider text-[10px]">Status</th>
                  <th className="px-6 py-3 font-medium uppercase tracking-wider text-[10px]">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-os-surface">
                    <td className="px-6 py-4 text-os-text-secondary font-mono text-xs">{format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}</td>
                    <td className="px-6 py-4 text-os-text-primary">{log.actor}</td>
                    <td className="px-6 py-4 text-os-text-primary">{log.eventType}</td>
                    <td className="px-6 py-4 text-os-text-secondary">{log.decisionId}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-[10px] uppercase font-mono font-medium rounded-full ${
                        log.eventType === 'FAILED' || log.eventType === 'REJECTED' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
                      }`}>
                        {log.eventType === 'FAILED' || log.eventType === 'REJECTED' ? 'FAILED' : 'SUCCESS'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-os-text-secondary text-xs">
                      {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
