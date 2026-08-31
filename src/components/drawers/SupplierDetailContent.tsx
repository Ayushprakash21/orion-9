import React, { useState, useMemo } from 'react';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useEntityDrawer } from '../../store/EntityDrawerContext';
import { formatCurrency, formatNumber } from '../../lib/utils';
import { Truck, ShieldAlert, BrainCircuit, CheckCircle2 } from 'lucide-react';

export const SupplierDetailContent: React.FC<{ id: string }> = ({ id }) => {
  const { suppliers, purchaseOrders, shipments, exceptions, currency } = useSupplyChain();
  const { openEntity } = useEntityDrawer();
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'pos' | 'shipments' | 'exceptions' | 'ai'>('overview');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSent, setContactSent] = useState(false);

  const supplier = useMemo(() => suppliers.find(s => s.id === id), [suppliers, id]);
  const supPOs = useMemo(() => purchaseOrders.filter(po => po.supplierId === id), [purchaseOrders, id]);
  const supShipments = useMemo(() => shipments.filter(s => s.supplierId === id || supPOs.some(po => po.id === s.poId)), [shipments, supplier, supPOs]);
  const supExceptions = useMemo(() => exceptions.filter(e => e.entityId === id || supPOs.some(po => po.id === e.entityId)), [exceptions, id, supPOs]);

  if (!supplier) {
    return <div className="p-12 text-center text-[#777777] font-mono text-xs">Supplier record not found.</div>;
  }

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage) return;
    setContactSent(true);
    setTimeout(() => {
      setContactMessage('');
      setContactSent(false);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#151515] border border-[#2A2A2A] p-5 rounded-xl space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[10px] font-mono text-[#777777] uppercase tracking-wider">{supplier.category} | {supplier.region}</div>
            <h2 className="text-xl font-medium text-[#F5F5F5] mt-0.5">{supplier.name}</h2>
          </div>
          <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono uppercase border ${
            supplier.riskLevel === 'High' ? 'bg-[#1B1B1B] text-[#FF453A] border-[#2A2A2A]' : 'bg-[#1B1B1B] text-[#30D158] border-[#2A2A2A]'
          }`}>
            Risk: {supplier.riskLevel || 'Low'}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">OTIF Rate</div>
            <div className="text-base font-mono text-[#F5F5F5]">{supplier.otif}%</div>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Quality Score</div>
            <div className="text-base font-mono text-[#F5F5F5]">{supplier.qualityRate}%</div>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Total Spend</div>
            <div className="text-base font-mono text-[#F5F5F5]">{formatCurrency(supplier.spend, currency)}</div>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#2A2A2A]">
            <div className="text-[10px] uppercase font-mono text-[#777777] mb-1">Lead Time</div>
            <div className="text-base font-mono text-[#F5F5F5]">{supplier.leadTime} days</div>
          </div>
        </div>
      </div>

      <div className="flex border-b border-[#2A2A2A] gap-6 text-xs font-mono">
        {(['overview', 'performance', 'pos', 'shipments', 'exceptions', 'ai'] as const).map(tab => (
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
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl p-5 space-y-4 text-xs">
            <div className="flex justify-between py-2 border-b border-[#2A2A2A]">
              <span className="text-[#777777]">Supplier ID</span>
              <span className="font-mono text-[#F5F5F5]">{supplier.id}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#2A2A2A]">
              <span className="text-[#777777]">Country / Region</span>
              <span className="font-mono text-[#F5F5F5]">{supplier.country || supplier.region}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#2A2A2A]">
              <span className="text-[#777777]">Open PO Value</span>
              <span className="font-mono text-[#F5F5F5]">{formatCurrency(supplier.openPoValue || 0, currency)}</span>
            </div>

            <div className="pt-4 border-t border-[#2A2A2A] space-y-2">
              <div className="text-[11px] uppercase tracking-wider text-[#777777] font-semibold">Contact Supplier</div>
              <form onSubmit={handleContact} className="space-y-2">
                <textarea
                  className="w-full bg-[#111111] border border-[#2A2A2A] rounded-lg p-3 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#777777]"
                  placeholder="Type message to supplier..."
                  rows={2}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                />
                <button type="submit" className="px-4 py-2 bg-[#1B1B1B] border border-[#2A2A2A] rounded-lg text-xs font-mono uppercase tracking-wider text-[#F5F5F5] hover:bg-[#202020]">
                  Send Message
                </button>
                {contactSent && <span className="text-[10px] text-[#30D158] font-mono ml-2">Message transmitted successfully.</span>}
              </form>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl p-6 space-y-4">
            <div className="text-[11px] uppercase tracking-wider text-[#777777] font-semibold">Historical Performance Trend</div>
            <div className="bg-[#111111] p-6 rounded-lg border border-[#2A2A2A] text-center">
              <div className="text-xs font-mono text-[#777777] tracking-wider uppercase">HISTORICAL TREND NOT AVAILABLE</div>
              <p className="text-[11px] text-[#777777] mt-1">Detailed time-series telemetry has not been archived for this vendor.</p>
            </div>
          </div>
        )}

        {activeTab === 'pos' && (
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#2A2A2A] text-[11px] uppercase tracking-wider text-[#777777] font-semibold">Purchase Orders ({supPOs.length})</div>
            <div className="divide-y divide-[#2A2A2A] text-xs">
              {supPOs.map(po => (
                <div key={po.id} onClick={() => openEntity('po', po.id)} className="p-4 hover:bg-[#202020] cursor-pointer flex justify-between">
                  <span className="font-mono text-[#F5F5F5]">{po.id}</span>
                  <span className="font-mono text-[#777777]">{po.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'shipments' && (
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#2A2A2A] text-[11px] uppercase tracking-wider text-[#777777] font-semibold">Shipments ({supShipments.length})</div>
            <div className="divide-y divide-[#2A2A2A] text-xs">
              {supShipments.map(s => (
                <div key={s.id} onClick={() => openEntity('shipment', s.id)} className="p-4 hover:bg-[#202020] cursor-pointer flex justify-between">
                  <span className="font-mono text-[#F5F5F5]">{s.id}</span>
                  <span className="font-mono text-[#777777]">{s.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'exceptions' && (
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#2A2A2A] text-[11px] uppercase tracking-wider text-[#777777] font-semibold">Exceptions ({supExceptions.length})</div>
            <div className="divide-y divide-[#2A2A2A] text-xs">
              {supExceptions.map(e => (
                <div key={e.id} onClick={() => openEntity('exception', e.id)} className="p-4 hover:bg-[#202020] cursor-pointer flex justify-between">
                  <span className="text-[#FF453A]">{e.type}</span>
                  <span className="font-mono text-[#777777]">{e.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl p-6 text-xs font-mono text-[#B3B3B3]">
            ORION AI Supplier Risk Audit: Supplier {supplier.name} maintains an OTIF of {supplier.otif}%. Recommend maintaining buffer stock to mitigate transit variance.
          </div>
        )}
      </div>
    </div>
  );
};
