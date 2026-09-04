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
          <p className="text-sm text-[#A0A0A0]">Review system-wide activity and security events.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F6F6F]" />
            <input 
              type="text" 
              placeholder="Search logs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 bg-[#0A0A0A] border border-[#2A2A2A] rounded-md py-2 pl-9 pr-4 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#555555]"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-[#1C1C1C] border border-[#2A2A2A] rounded-md text-sm hover:bg-[#2A2A2A] transition-colors">
            <Filter size={14} /> <span className="hidden sm:inline">Filter</span>
          </button>
        </div>
      </div>
      
      <div className="flex-1 rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] overflow-hidden flex flex-col">
        {filteredLogs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#111111] border border-[#2A2A2A] flex items-center justify-center mb-4">
              <Activity size={24} className="text-[#6F6F6F]" />
            </div>
            <h3 className="text-lg font-medium text-[#F5F5F5] mb-2">No activity recorded</h3>
            <p className="text-[#A0A0A0] text-sm max-w-sm">
              There are no audit logs matching your criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#111111] border-b border-[#2A2A2A] text-[#6F6F6F]">
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
                  <tr key={log.id} className="hover:bg-[#111111]">
                    <td className="px-6 py-4 text-[#A0A0A0] font-mono text-xs">{format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}</td>
                    <td className="px-6 py-4 text-[#F5F5F5]">{log.actor}</td>
                    <td className="px-6 py-4 text-[#F5F5F5]">{log.eventType}</td>
                    <td className="px-6 py-4 text-[#A0A0A0]">{log.decisionId}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-[10px] uppercase font-mono font-medium rounded-full ${
                        log.eventType === 'FAILED' || log.eventType === 'REJECTED' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
                      }`}>
                        {log.eventType === 'FAILED' || log.eventType === 'REJECTED' ? 'FAILED' : 'SUCCESS'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#A0A0A0] text-xs">
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
