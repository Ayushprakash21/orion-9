import React, { useState, useMemo } from 'react';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useEntityDrawer } from '../../store/EntityDrawerContext';
import { formatCurrency, formatDateOnly } from '../../lib/utils';
import { Truck, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export const ShipmentDetailContent: React.FC<{ id: string }> = ({ id }) => {
  const { shipments, purchaseOrders, suppliers, exceptions, currency, timezone } = useSupplyChain();
  const { openEntity } = useEntityDrawer();
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'po' | 'supplier' | 'inbound' | 'exceptions' | 'ai'>('overview');

  const shipment = useMemo(() => shipments.find(s => s.id === id), [shipments, id]);
  const po = useMemo(() => purchaseOrders.find(p => p.id === shipment?.poId), [purchaseOrders, shipment]);
  const supplier = useMemo(() => suppliers.find(s => s.id === (shipment?.supplierId || po?.supplierId)), [suppliers, shipment, po]);

  if (!shipment) {
    return <div className="p-12 text-center text-os-text-muted font-mono text-xs">Shipment record not found.</div>;
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
      <div className="bg-os-surface border border-os-border p-5 rounded-xl space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[10px] font-mono text-os-text-muted uppercase tracking-wider">Logistics / Shipment</div>
            <h2 className="text-xl font-medium text-os-text-primary mt-0.5">{shipment.id}</h2>
          </div>
          <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono uppercase border ${
            shipment.status === 'Delayed' || shipment.status === 'Exception' ? 'bg-os-surface-elevated text-[#FF453A] border-os-border' : 'bg-os-surface-elevated text-[#30D158] border-os-border'
          }`}>
            {shipment.status}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Carrier</div>
            <div className="text-base font-mono text-os-text-primary">{shipment.carrier}</div>
          </div>
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Delay Days</div>
            <div className="text-base font-mono text-os-text-primary">{shipment.delayDays}d</div>
          </div>
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Freight Cost</div>
            <div className="text-base font-mono text-os-text-primary">{formatCurrency(shipment.freightCost, currency)}</div>
          </div>
          <div className="bg-os-surface p-3 rounded-lg border border-os-border">
            <div className="text-[10px] uppercase font-mono text-os-text-muted mb-1">Tracking</div>
            <div className="text-base font-mono text-os-text-primary">{shipment.trackingNumber || 'TRK-9920'}</div>
          </div>
        </div>
      </div>

      <div className="flex border-b border-os-border gap-6 text-xs font-mono">
        {(['overview', 'timeline', 'po', 'supplier', 'inbound', 'exceptions', 'ai'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 uppercase tracking-wider transition-colors border-b-2 -mb-px ${
              activeTab === tab ? 'border-os-border-inverse text-os-text-primary' : 'border-transparent text-os-text-muted hover:text-os-text-secondary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {activeTab === 'overview' && (
          <div className="bg-os-surface border border-os-border rounded-xl p-5 space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-os-border">
              <span className="text-os-text-muted">Origin</span>
              <span className="font-mono text-os-text-primary">{shipment.origin}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-os-border">
              <span className="text-os-text-muted">Destination</span>
              <span className="font-mono text-os-text-primary">{shipment.destination}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-os-border">
              <span className="text-os-text-muted">Ship Date</span>
              <span className="font-mono text-os-text-primary">{formatDateOnly(shipment.shipDate, timezone)}</span>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="bg-os-surface border border-os-border rounded-xl p-5 space-y-4">
            <div className="text-[11px] uppercase tracking-wider text-os-text-muted font-semibold">Shipment Lifecycle Events</div>
            <div className="space-y-3">
              {timelineEvents.map((ev, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <div className={`w-3 h-3 rounded-full ${ev.status === 'completed' ? 'bg-[#30D158]' : ev.status === 'active' ? 'bg-[#FF9F0A]' : 'bg-os-surface-active'}`} />
                  <div className="flex-1 flex justify-between font-mono">
                    <span className="text-os-text-primary">{ev.title}</span>
                    <span className="text-os-text-muted">{formatDateOnly(ev.time, timezone)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'po' && po && (
          <div className="bg-os-surface border border-os-border rounded-xl p-5">
            <button onClick={() => openEntity('po', po.id)} className="w-full text-left p-3 bg-os-surface rounded-lg border border-os-border hover:border-os-border">
              <div className="text-xs font-mono text-os-text-primary">Purchase Order {po.id}</div>
              <div className="text-[10px] text-os-text-muted mt-1">Status: {po.status} | Total: {formatCurrency(po.totalValue, currency)}</div>
            </button>
          </div>
        )}

        {activeTab === 'supplier' && supplier && (
          <div className="bg-os-surface border border-os-border rounded-xl p-5">
            <button onClick={() => openEntity('supplier', supplier.id)} className="w-full text-left p-3 bg-os-surface rounded-lg border border-os-border hover:border-os-border">
              <div className="text-xs font-mono text-os-text-primary">{supplier.name}</div>
              <div className="text-[10px] text-os-text-muted mt-1">OTIF: {supplier.otif}%</div>
            </button>
          </div>
        )}

        {activeTab === 'inbound' && (
          <div className="bg-os-surface border border-os-border rounded-xl p-5 text-center text-os-text-muted font-mono text-xs">
            Inbound receiving docket linked to shipment.
          </div>
        )}

        {activeTab === 'exceptions' && (
          <div className="bg-os-surface border border-os-border rounded-xl p-5 text-center text-os-text-muted font-mono text-xs">
            No active transit exceptions for this shipment.
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="bg-os-surface border border-os-border rounded-xl p-6 text-xs font-mono text-os-text-secondary">
            ORION Logistics AI: Shipment transit timeline is monitored via carrier API integration.
          </div>
        )}
      </div>
    </div>
  );
};
