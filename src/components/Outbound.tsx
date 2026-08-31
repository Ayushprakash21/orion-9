import React, { useState } from 'react';
import { ArrowUpFromLine, CheckCircle2, Clock, Truck, PackageCheck, ListOrdered } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Outbound = () => {
  const navigate = useNavigate();
  const [orders] = useState([]);
  
  const workflowStages = [
    { name: 'CUSTOMER ORDER', status: 'pending' },
    { name: 'ALLOCATION', status: 'pending' },
    { name: 'PICK', status: 'pending' },
    { name: 'PACK', status: 'pending' },
    { name: 'SHIP', status: 'pending' },
    { name: 'DELIVERED', status: 'pending' }
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#2A2A2A]">
        <div>
          <h2 className="text-xl font-medium text-[#F5F5F5] tracking-tight">Outbound Command</h2>
          <p className="text-xs text-[#777777] mt-1 hidden sm:block">Manage customer orders, fulfillment pipelines, and outbound shipments.</p>
        </div>
      </div>
      
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 sm:gap-4">
        {[
          { label: 'Orders', val: '0' },
          { label: 'Ready to Ship', val: '0' },
          { label: 'Delayed', val: '0' },
          { label: 'Backlog', val: '0' },
          { label: 'Service Level', val: '--' },
          { label: 'At Risk', val: '0' },
        ].map(k => (
          <div key={k.label} className="bg-[#151515] border border-[#2A2A2A] p-3 sm:p-4 rounded-xl">
            <div className="text-[10px] uppercase tracking-wider text-[#777777] font-semibold mb-1">{k.label}</div>
            <div className="text-xl font-mono text-[#F5F5F5]">{k.val}</div>
          </div>
        ))}
      </div>

      {/* Workflow */}
      <div className="bg-[#151515] border border-[#2A2A2A] p-4 sm:p-5 rounded-xl">
        <div className="text-[11px] uppercase tracking-wider text-[#777777] font-semibold mb-4">Outbound Fulfillment Lifecycle</div>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {workflowStages.map((stage, i) => (
             <React.Fragment key={stage.name}>
                <div className="px-2 py-1.5 sm:px-3 sm:py-2 border border-[#2A2A2A] rounded-lg text-[9px] sm:text-[10px] tracking-wider font-mono flex items-center gap-1 sm:gap-2 bg-[#111111] text-[#777777]">
                  <Clock size={10} />
                  {stage.name}
                </div>
                {i < workflowStages.length - 1 && (
                  <div className="w-2 sm:w-3 h-[1px] bg-[#2A2A2A]"></div>
                )}
             </React.Fragment>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-[#111111] border border-[#2A2A2A] flex items-center justify-center text-[#777777] mb-4">
          <ListOrdered size={32} />
        </div>
        <h3 className="text-base text-[#F5F5F5] font-medium mb-1">CRM / OMS Integration Required</h3>
        <p className="text-xs text-[#777777] max-w-md mb-6">Outbound orders require a connection to an external Order Management System or CRM. Please configure a connector in the Integration Hub.</p>
        <button onClick={() => navigate('/integrations')} className="px-4 py-2 bg-[#1B1B1B] border border-[#2A2A2A] text-[#F5F5F5] rounded-lg text-xs uppercase tracking-wider font-medium hover:bg-[#202020] transition-colors">
          Go to Integration Hub
        </button>
      </div>
    </div>
  );
};
