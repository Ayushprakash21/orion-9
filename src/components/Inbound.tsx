import React, { useMemo } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useEntityDrawer } from '../store/EntityDrawerContext';
import { ArrowDownToLine, Package, Truck, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatDateOnly, formatCurrency } from '../lib/utils';
import { MobileRecordCard } from './MobileRecordCard';

export const Inbound = () => {
  const { purchaseOrders, shipments, currency } = useSupplyChain();
  const { openEntity } = useEntityDrawer();
  
  const inboundShipments = useMemo(() => shipments.filter(s => s.status !== 'Delivered' && s.status !== 'Cancelled'), [shipments]);
  
  const arrivingToday = inboundShipments.filter(s => {
    const today = formatDateOnly(new Date());
    return String(s.expectedArrival || '').startsWith(today);
  }).length;

  const delayed = inboundShipments.filter(s => s.delayDays > 0).length;
  const openPOs = purchaseOrders.filter(p => !['Received', 'Cancelled', 'Closed'].includes(p.status));
  const expectedValue = openPOs.reduce((sum, po) => sum + po.totalValue, 0);

  const openASN = Math.floor(inboundShipments.length * 0.8);
  const pendingReceipt = Math.floor(openPOs.length * 0.5);

  const workflowStages = [
    { name: 'PO CREATED', status: 'done' },
    { name: 'CONFIRMED', status: 'done' },
    { name: 'ASN CREATED', status: 'active' },
    { name: 'DISPATCHED', status: 'pending' },
    { name: 'IN TRANSIT', status: 'pending' },
    { name: 'ARRIVED', status: 'pending' },
    { name: 'DOCKED', status: 'pending' },
    { name: 'QC', status: 'pending' },
    { name: 'PUTAWAY', status: 'pending' }
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#2A2A2A]">
        <div>
          <h2 className="text-xl font-medium text-[#F5F5F5] tracking-tight">Inbound Command</h2>
          <p className="text-xs text-[#777777] mt-1 hidden sm:block">Manage inbound shipments, advanced shipping notices (ASNs), and dock receipts.</p>
        </div>
      </div>
      
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#151515] border border-[#2A2A2A] p-3 sm:p-4 rounded-xl">
          <div className="text-[10px] uppercase tracking-wider text-[#777777] font-semibold mb-1">Arriving Today</div>
          <div className="text-xl sm:text-2xl font-mono text-[#F5F5F5]">{arrivingToday}</div>
        </div>
        <div className="bg-[#151515] border border-[#2A2A2A] p-3 sm:p-4 rounded-xl">
          <div className="text-[10px] uppercase tracking-wider text-[#777777] font-semibold mb-1">Delayed</div>
          <div className="text-xl sm:text-2xl font-mono text-[#FF453A]">{delayed}</div>
        </div>
        <div className="bg-[#151515] border border-[#2A2A2A] p-3 sm:p-4 rounded-xl">
          <div className="text-[10px] uppercase tracking-wider text-[#777777] font-semibold mb-1">Open ASNs</div>
          <div className="text-xl sm:text-2xl font-mono text-[#F5F5F5]">{openASN}</div>
        </div>
        <div className="bg-[#151515] border border-[#2A2A2A] p-3 sm:p-4 rounded-xl">
          <div className="text-[10px] uppercase tracking-wider text-[#777777] font-semibold mb-1">Expected Value</div>
          <div className="text-xl sm:text-2xl font-mono text-[#F5F5F5] truncate">{formatCurrency(expectedValue, currency)}</div>
        </div>
      </div>

      {/* Workflow */}
      <div className="bg-[#151515] border border-[#2A2A2A] p-4 sm:p-5 rounded-xl">
        <div className="text-[11px] uppercase tracking-wider text-[#777777] font-semibold mb-4">Inbound Lifecycle Flow</div>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {workflowStages.map((stage, i) => (
             <React.Fragment key={stage.name}>
                <div className={`px-2 py-1.5 sm:px-3 sm:py-2 border rounded-lg text-[9px] sm:text-[10px] tracking-wider font-mono flex items-center gap-1 sm:gap-2
                  ${stage.status === 'done' ? 'bg-[#1B1B1B] border-[#2A2A2A] text-[#30D158]' : 
                    stage.status === 'active' ? 'bg-[#1B1B1B] border-[#2A2A2A] text-[#F5F5F5]' : 
                    'bg-[#111111] border-[#2A2A2A] text-[#777777]'}`}>
                  {stage.status === 'done' && <CheckCircle2 size={10} />}
                  {stage.status === 'active' && <Truck size={10} />}
                  {stage.status === 'pending' && <Clock size={10} />}
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
      <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl overflow-hidden w-full">
         <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b border-[#2A2A2A] text-[11px] uppercase tracking-wider text-[#777777] font-semibold">Active Inbound Shipments</div>
         
         {/* Mobile View: Cards */}
         <div className="sm:hidden divide-y divide-[#2A2A2A] w-full">
           {inboundShipments.slice(0, 20).map(s => (
             <MobileRecordCard
               key={s.id}
               onClick={() => openEntity('shipment', s.id)}
               title={s.id}
               subtitle={`PO: ${s.poId}`}
               statusNode={
                 <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono border ${
                   s.status === 'In Transit' ? 'bg-[#1B1B1B] text-[#F5F5F5] border-[#2A2A2A]' : 'bg-[#1B1B1B] text-[#FF9F0A] border-[#2A2A2A]'
                 }`}>
                   {s.status}
                 </span>
               }
               fields={[
                 { label: 'Carrier', value: s.carrier, valueClassName: 'text-[#B3B3B3]' },
                 { label: 'ETA', value: formatDateOnly(s.expectedArrival) }
               ]}
             />
           ))}
         </div>

         {/* Desktop View: Table */}
         <div className="hidden sm:block overflow-x-auto w-full">
            <table className="w-full text-left text-xs text-[#B3B3B3]">
              <thead>
                <tr className="border-b border-[#2A2A2A] bg-[#111111] text-[10px] font-mono text-[#777777] uppercase tracking-wider">
                  <th className="p-3">Shipment ID</th>
                  <th className="p-3">PO Ref</th>
                  <th className="p-3">Carrier</th>
                  <th className="p-3">ETA</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {inboundShipments.slice(0, 20).map(s => (
                  <tr key={s.id} onClick={() => openEntity('shipment', s.id)} className="hover:bg-[#202020] transition-colors cursor-pointer">
                    <td className="p-3 font-mono text-[#F5F5F5]">{s.id}</td>
                    <td className="p-3 font-mono text-[#B3B3B3]">{s.poId}</td>
                    <td className="p-3 text-[#B3B3B3]">{s.carrier}</td>
                    <td className="p-3 font-mono text-[#B3B3B3]">{formatDateOnly(s.expectedArrival)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono border ${
                        s.status === 'In Transit' ? 'bg-[#1B1B1B] text-[#F5F5F5] border-[#2A2A2A]' : 'bg-[#1B1B1B] text-[#FF9F0A] border-[#2A2A2A]'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};
