import React, { useState, useMemo } from 'react';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useEntityDrawer } from '../../store/EntityDrawerContext';
import { formatCurrency, formatDateOnly } from '../../lib/utils';
import { Truck, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export const ShipmentDetailContent: React.FC<{ id: string }> = ({ id }) => {
  const { shipments, purchaseOrders, suppliers, exceptions, currency } = useSupplyChain();
  const { openEntity } = useEntityDrawer();
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'po' | 'supplier' | 'inbound' | 'exceptions' | 'ai'>('overview');

  const shipment = useMemo(() => shipments.find(s => s.id === id), [shipments, id]);
  const po = useMemo(() => purchaseOrders.find(p => p.id === shipment?.poId), [purchaseOrders, shipment]);
  const supplier = useMemo(() => suppliers.find(s => s.id === (shipment?.supplierId || po?.supplierId)), [suppliers, shipment, po]);

  if (!shipment) {
    return <div className="p-12 text-center text-[#777777] font-mono text-xs">Shipment record not found.</div>;
  }

  const timelineEvents = [
    { title: 'Shipment Created', time: shipment.shipDate, status: 'completed' },
    { title: 'Carrier Booked', time: shipment.shipDate, status: 'completed' },
    { title: 'Picked Up at Origin', time: shipment.shipDate, status: 'completed' },
    { title: 'In Transit', time: shipment.shipDate, status: shipment.status === 'Delivered' ? 'completed' : 'active' },
    { title: 'Expected Arrival', time: shipment.expectedArrival, status: shipment.status === 'Delivered' ? 'completed' : 'pending' },
    { title: 'Delivered', time: shipment.actualArrival || 'Pending', status: shipment.status === 'Delivered' ? 'completed' : 'pending' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-[#151515] border border-[#2A2A2A] p-5 rounded-xl space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[10px] font-mono text-[#777777] uppercase tracking-wider">Logistics / Shipment</div>
            <h2 className="text-xl font-medium text-[#F5F5F5] mt-0.5">{shipment.id}</h2>
          </div>
          <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono uppercase border ${
            shipment.status === 'Delayed' || shipment.status === 'Exception' ? 'bg-[#1B1B1B] text-[#FF453A] border-[#2A2A2A]' : 'bg-[#1B1B1B] text-[#30D158] border-[#2A2A2A]'
          }`}>
            {shipment.status}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Carrier</div>
            <div className="text-base font-mono text-[#F5F5F5]">{shipment.carrier}</div>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Delay Days</div>
            <div className="text-base font-mono text-[#F5F5F5]">{shipment.delayDays}d</div>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Freight Cost</div>
            <div className="text-base font-mono text-[#F5F5F5]">{formatCurrency(shipment.freightCost, currency)}</div>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Tracking</div>
            <div className="text-base font-mono text-[#F5F5F5]">{shipment.trackingNumber || 'TRK-9920'}</div>
          </div>
        </div>
      </div>

      <div className="flex border-b border-[#2A2A2A] gap-6 text-xs font-mono">
        {(['overview', 'timeline', 'po', 'supplier', 'inbound', 'exceptions', 'ai'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 uppercase tracking-wider transition-colors border-b-2 -mb-px ${
              activeTab === tab ? 'border-[#F5F5F5] text-[#F5F5F5]' : 'border-transparent text-[#777777] hover:text-[#B3B3B3]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {activeTab === 'overview' && (
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl p-5 space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-[#2A2A2A]">
              <span className="text-[#777777]">Origin</span>
              <span className="font-mono text-[#F5F5F5]">{shipment.origin}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#2A2A2A]">
              <span className="text-[#777777]">Destination</span>
              <span className="font-mono text-[#F5F5F5]">{shipment.destination}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#2A2A2A]">
              <span className="text-[#777777]">Ship Date</span>
              <span className="font-mono text-[#F5F5F5]">{formatDateOnly(shipment.shipDate)}</span>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl p-5 space-y-4">
            <div className="text-[11px] uppercase tracking-wider text-[#777777] font-semibold">Shipment Lifecycle Events</div>
            <div className="space-y-3">
              {timelineEvents.map((ev, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <div className={`w-3 h-3 rounded-full ${ev.status === 'completed' ? 'bg-[#30D158]' : ev.status === 'active' ? 'bg-[#FF9F0A]' : 'bg-[#2A2A2A]'}`} />
                  <div className="flex-1 flex justify-between font-mono">
                    <span className="text-[#F5F5F5]">{ev.title}</span>
                    <span className="text-[#777777]">{formatDateOnly(ev.time)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'po' && po && (
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl p-5">
            <button onClick={() => openEntity('po', po.id)} className="w-full text-left p-3 bg-[#111111] rounded-lg border border-[#2A2A2A] hover:border-[#777777]">
              <div className="text-xs font-mono text-[#F5F5F5]">Purchase Order {po.id}</div>
              <div className="text-[10px] text-[#777777] mt-1">Status: {po.status} | Total: {formatCurrency(po.totalValue, currency)}</div>
            </button>
          </div>
        )}

        {activeTab === 'supplier' && supplier && (
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl p-5">
            <button onClick={() => openEntity('supplier', supplier.id)} className="w-full text-left p-3 bg-[#111111] rounded-lg border border-[#2A2A2A] hover:border-[#777777]">
              <div className="text-xs font-mono text-[#F5F5F5]">{supplier.name}</div>
              <div className="text-[10px] text-[#777777] mt-1">OTIF: {supplier.otif}%</div>
            </button>
          </div>
        )}

        {activeTab === 'inbound' && (
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl p-5 text-center text-[#777777] font-mono text-xs">
            Inbound receiving docket linked to shipment.
          </div>
        )}

        {activeTab === 'exceptions' && (
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl p-5 text-center text-[#777777] font-mono text-xs">
            No active transit exceptions for this shipment.
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl p-6 text-xs font-mono text-[#B3B3B3]">
            ORION Logistics AI: Shipment transit timeline is monitored via carrier API integration.
          </div>
        )}
      </div>
    </div>
  );
};
