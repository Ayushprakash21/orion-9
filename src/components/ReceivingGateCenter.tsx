/**
 * ORION-9 RECEIVING GATE & GOODS RECEIPT NOTE (GRN) CENTER
 * macOS-inspired Desktop Window Application for Layers 4, 7 & 9
 * 
 * Physical Inbound Arrival & Inventory Receiving Pipeline:
 * GATE_ARRIVAL -> DOCK_ASSIGNED -> UNLOADING -> PHYSICAL_COUNT -> GRN_GENERATED -> INVENTORY_POSTED
 */

import React, { useState } from 'react';
import {
  Truck,
  PackageCheck,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Search,
  Check,
  X,
  FileText,
  Warehouse
} from 'lucide-react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useToast } from '../store/ToastContext';
import { kernelEventBus } from '../kernel/EventBus';
import { kernelAuditEngine } from '../kernel/AuditEngine';
import { formatNumber } from '../lib/formatters';

export interface GateEntryRecord {
  id: string; // GATE-2026-001
  carrier: string;
  driverName: string;
  truckPlate: string;
  sealNumber: string;
  poId: string;
  asnId?: string;
  destinationWarehouse: string;
  dockDoor: string;
  status: 'ARRIVED' | 'AT_DOCK' | 'UNLOADING' | 'RECEIVED' | 'DEPARTED';
  arrivalTime: string;
}

export interface GoodsReceiptNote {
  id: string; // GRN-2026-101
  poId: string;
  gateEntryId: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  receivedDate: string;
  receivedBy: string;
  items: Array<{
    productId: string;
    productName: string;
    orderedQty: number;
    receivedQty: number;
    acceptedQty: number;
    rejectedQty: number;
    lotNumber: string;
    inventoryAdjusted: boolean;
  }>;
}

export const ReceivingGateCenter: React.FC = () => {
  const { purchaseOrders, suppliers, inventory, updateData } = useSupplyChain();
  const { showToast } = useToast();

  const [gateEntries, setGateEntries] = useState<GateEntryRecord[]>([
    {
      id: 'GATE-2026-441',
      carrier: 'DHL Freight Global',
      driverName: 'Karl Becker',
      truckPlate: 'HH-KL-9821',
      sealNumber: 'SEAL-908122-C',
      poId: 'PO-2026-0001',
      asnId: 'ASN-2026-001',
      destinationWarehouse: 'Central Distribution Hub 1',
      dockDoor: 'Bay 04',
      status: 'RECEIVED',
      arrivalTime: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: 'GATE-2026-442',
      carrier: 'Kuehne + Nagel Express',
      driverName: 'Robert Vance',
      truckPlate: 'B-KN-4412',
      sealNumber: 'SEAL-331908-A',
      poId: 'PO-2026-0002',
      asnId: 'ASN-2026-002',
      destinationWarehouse: 'High-Tech Micro Facility',
      dockDoor: 'Bay 07',
      status: 'UNLOADING',
      arrivalTime: new Date(Date.now() - 3600000 * 3).toISOString()
    },
    {
      id: 'GATE-2026-443',
      carrier: 'FedEx Freight',
      driverName: 'Samira Patel',
      truckPlate: 'M-FX-7721',
      sealNumber: 'SEAL-771239-X',
      poId: 'PO-2026-0003',
      destinationWarehouse: 'Central Distribution Hub 1',
      dockDoor: 'Awaiting Bay',
      status: 'ARRIVED',
      arrivalTime: new Date().toISOString()
    }
  ]);

  const [grns, setGrns] = useState<GoodsReceiptNote[]>([
    {
      id: 'GRN-2026-101',
      poId: 'PO-2026-0001',
      gateEntryId: 'GATE-2026-441',
      supplierId: 'SUP-001',
      supplierName: 'Titan Micro Materials',
      warehouseId: 'WH-001',
      receivedDate: new Date(Date.now() - 86400000 * 2).toISOString(),
      receivedBy: 'Derrick Hall (Inbound Dock Lead)',
      items: [
        {
          productId: 'SKU-TITAN-X1',
          productName: 'Industrial Titanium Alloy Sensor Housing',
          orderedQty: 500,
          receivedQty: 500,
          acceptedQty: 500,
          rejectedQty: 0,
          lotNumber: 'LOT-9921-A',
          inventoryAdjusted: true
        }
      ]
    }
  ]);

  const [activeTab, setActiveTab] = useState<'gate' | 'grn'>('gate');
  const [selectedEntryId, setSelectedEntryId] = useState<string>(gateEntries[1]?.id || gateEntries[0]?.id);

  const selectedEntry = gateEntries.find(g => g.id === selectedEntryId) || gateEntries[0];

  const handleUpdateGateStatus = (id: string, newStatus: GateEntryRecord['status'], dockDoor?: string) => {
    setGateEntries(prev =>
      prev.map(g => (g.id === id ? { ...g, status: newStatus, dockDoor: dockDoor || g.dockDoor } : g))
    );

    kernelAuditEngine.record({
      action: `GATE_STATUS_${newStatus}`,
      actor: { id: 'dock-lead', type: 'USER', name: 'Dock Master' },
      entityId: id,
      entityType: 'gate_entry',
      classification: 'INTERNAL',
      details: { status: newStatus, dockDoor }
    });

    showToast(`Gate arrival ${id} updated to ${newStatus}.`, 'success', 'Gate Entry Updated');
  };

  const handleGenerateGRN = (entry: GateEntryRecord) => {
    const grnId = `GRN-${Date.now().toString(36).toUpperCase()}`;
    const targetPo = purchaseOrders.find(p => p.id === entry.poId);

    const newGrn: GoodsReceiptNote = {
      id: grnId,
      poId: entry.poId,
      gateEntryId: entry.id,
      supplierId: targetPo?.supplierId || 'SUP-001',
      supplierName: 'Titan Micro Materials',
      warehouseId: 'WH-001',
      receivedDate: new Date().toISOString(),
      receivedBy: 'Dock Receiving Officer',
      items: (targetPo?.lines || [
        { productId: 'SKU-TITAN-X1', quantity: 200, unitPrice: 289, receivedQuantity: 200 }
      ]).map(l => ({
        productId: l.productId,
        productName: l.productId,
        orderedQty: l.quantity,
        receivedQty: l.quantity,
        acceptedQty: l.quantity,
        rejectedQty: 0,
        lotNumber: `LOT-${Date.now().toString(36).toUpperCase()}`,
        inventoryAdjusted: true
      }))
    };

    setGrns(prev => [newGrn, ...prev]);
    handleUpdateGateStatus(entry.id, 'RECEIVED');

    // Auto-adjust inventory for received items via SupplyChainContext
    const updatedInventory = inventory.map(inv => {
      const match = newGrn.items.find(item => item.productId === inv.productId);
      if (match) {
        return { ...inv, onHand: inv.onHand + match.acceptedQty };
      }
      return inv;
    });
    updateData('inventory', updatedInventory);

    kernelEventBus.publish('orion:grn:created', {
      grnId,
      poId: entry.poId,
      itemsCount: newGrn.items.length
    }, {
      actor: { id: 'dock-receiver', type: 'USER', name: 'Receiving Team' },
      entityId: grnId,
      entityType: 'grn'
    });

    showToast(`GRN ${grnId} generated and stock automatically posted to inventory!`, 'success', 'Goods Receipt Posted');
  };

  return (
    <div className="flex flex-col h-full bg-[#0D1117] text-white overflow-hidden font-sans">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 bg-[#161B22]/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Truck size={18} />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
                Gate Entry & Goods Receipt Note (GRN) Center
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  Inbound Logistics & Receiving
                </span>
              </h1>
              <p className="text-xs text-white/50">
                Physical Carrier Check-in, Dock Bay Dispatch, GRN Verification & Automatic Stock Posting
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10 text-xs">
          <button
            onClick={() => setActiveTab('gate')}
            className={`px-3 py-1 rounded font-medium transition ${
              activeTab === 'gate' ? 'bg-indigo-600 text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            Gate & Dock Control ({gateEntries.length})
          </button>
          <button
            onClick={() => setActiveTab('grn')}
            className={`px-3 py-1 rounded font-medium transition ${
              activeTab === 'grn' ? 'bg-indigo-600 text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            Goods Receipt Notes ({grns.length})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {activeTab === 'gate' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                Inbound Trucks & Dock Allocations
              </h3>
              <span className="text-xs text-white/40">Real-time gate arrival queue</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {gateEntries.map(entry => (
                <div
                  key={entry.id}
                  className="p-5 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-semibold text-blue-400">{entry.id}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          entry.status === 'RECEIVED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : entry.status === 'UNLOADING'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {entry.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white">{entry.carrier}</h4>
                      <div className="text-xs text-white/50">Driver: {entry.driverName} • Plate: {entry.truckPlate}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs p-2.5 rounded bg-black/40 border border-white/5">
                      <div>
                        <span className="text-[10px] text-white/40 uppercase">Dock Door</span>
                        <div className="font-semibold text-white mt-0.5">{entry.dockDoor}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-white/40 uppercase">PO Reference</span>
                        <div className="font-mono text-indigo-300 mt-0.5">{entry.poId}</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-2">
                    {entry.status === 'ARRIVED' && (
                      <button
                        onClick={() => handleUpdateGateStatus(entry.id, 'AT_DOCK', 'Bay 02')}
                        className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition"
                      >
                        Assign to Bay 02
                      </button>
                    )}

                    {entry.status === 'AT_DOCK' && (
                      <button
                        onClick={() => handleUpdateGateStatus(entry.id, 'UNLOADING')}
                        className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition"
                      >
                        Begin Unloading
                      </button>
                    )}

                    {entry.status === 'UNLOADING' && (
                      <button
                        onClick={() => handleGenerateGRN(entry)}
                        className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition flex items-center gap-1.5 shadow-sm"
                      >
                        <PackageCheck size={13} /> Complete Receipt & Generate GRN
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'grn' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                Issued Goods Receipt Notes (GRN)
              </h3>
              <span className="text-xs text-white/40">Official physical receipt documents</span>
            </div>

            <div className="space-y-4">
              {grns.map(grn => (
                <div key={grn.id} className="p-5 rounded-xl bg-white/[0.02] border border-white/10 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-emerald-400 font-bold">{grn.id}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/70 font-mono">
                          Linked Gate: {grn.gateEntryId}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-1">Receipt for PO {grn.poId}</h4>
                      <div className="text-xs text-white/50">
                        Supplier: {grn.supplierName} • Received By: {grn.receivedBy} • Date:{' '}
                        {new Date(grn.receivedDate).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
                      Stock Posted
                    </span>
                  </div>

                  {/* Items list */}
                  <div className="rounded-lg border border-white/5 overflow-hidden text-xs">
                    <div className="grid grid-cols-5 p-2.5 bg-white/5 font-semibold text-white/60 text-[11px] uppercase">
                      <div>Product SKU</div>
                      <div>Ordered Qty</div>
                      <div>Received Qty</div>
                      <div>Accepted Qty</div>
                      <div>Assigned Lot #</div>
                    </div>
                    <div className="divide-y divide-white/5 bg-black/20">
                      {grn.items.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-5 p-2.5 text-white/80 items-center">
                          <div className="font-mono text-indigo-300 font-semibold">{item.productId}</div>
                          <div className="font-mono text-white/60">{item.orderedQty}</div>
                          <div className="font-mono text-white/80">{item.receivedQty}</div>
                          <div className="font-mono text-emerald-400 font-bold">{item.acceptedQty}</div>
                          <div className="font-mono text-white/60">{item.lotNumber}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
