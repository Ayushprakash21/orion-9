import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, PackageCheck, AlertTriangle, ShieldCheck, 
  RefreshCw, CheckCircle2, Plus, ArrowRight, DollarSign, Wrench
} from 'lucide-react';
import { returnsReverseLogisticsEngine } from '../scm/ReturnsReverseLogisticsEngine';
import { RMARecord } from '../scm/types';

export const ReturnsCenter: React.FC = () => {
  const [rmas, setRmas] = useState<RMARecord[]>([]);
  const [selectedRmaId, setSelectedRmaId] = useState<string | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setRmas(returnsReverseLogisticsEngine.listRMAs());
  };

  const handleApprove = (rmaId: string) => {
    try {
      returnsReverseLogisticsEngine.approveRMA(rmaId, 'demo-tenant', 'cs_supervisor');
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReceive = (rmaId: string) => {
    try {
      returnsReverseLogisticsEngine.receiveReturn({
        tenantId: 'demo-tenant',
        rmaId,
        warehouseId: 'wh-central-01',
        quantityReceived: 2,
        trackingNumber: 'RET-TRACK-9988',
        receiver: 'dock_clerk'
      });
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleInspect = (rmaId: string, productId: string) => {
    try {
      returnsReverseLogisticsEngine.inspectReturn({
        tenantId: 'demo-tenant',
        rmaId,
        productId,
        inspectedQuantity: 2,
        condition: 'OPEN_BOX',
        inspectorNotes: 'Device fully functional; outer packaging unsealed',
        inspector: 'qa_technician'
      });
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDisposition = (rmaId: string) => {
    try {
      returnsReverseLogisticsEngine.dispositionReturn({
        tenantId: 'demo-tenant',
        rmaId,
        disposition: 'RESTOCK',
        quantity: 2,
        destinationWarehouseId: 'wh-central-01',
        actionTaken: 'Restocked to B-Stock inventory buffer',
        dispositioner: 'warehouse_lead'
      });
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCredit = (rmaId: string, customerId: string) => {
    try {
      returnsReverseLogisticsEngine.issueCustomerCredit({
        tenantId: 'demo-tenant',
        rmaId,
        customerId,
        creditAmount: 1850.00,
        currency: 'USD',
        actor: 'billing_clerk'
      });
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12" data-testid="returns-center">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-os-border pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <RotateCcw size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">Returns & Reverse Logistics Center</h1>
            <p className="text-xs text-os-text-muted font-mono">
              RMA Processing, Receiving Inspection, Disposition Routing & Customer Credit Notes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <span className="px-3 py-1 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded flex items-center gap-1.5">
            <ShieldCheck size={13} /> KERNEL GOVERNED (INVARIANT #5)
          </span>
          <button
            type="button"
            onClick={refreshData}
            className="p-2 bg-white/5 hover:bg-white/10 text-os-text-secondary hover:text-white rounded border border-os-border transition-all"
            title="Refresh Data"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-os-card border border-os-border rounded-lg p-4">
          <div className="flex items-center justify-between text-os-text-muted text-xs font-mono">
            <span>TOTAL RMAS</span>
            <RotateCcw size={16} className="text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">{rmas.length}</div>
          <div className="mt-1 text-xs text-os-text-muted">Return Material Authorizations</div>
        </div>

        <div className="bg-os-card border border-os-border rounded-lg p-4">
          <div className="flex items-center justify-between text-os-text-muted text-xs font-mono">
            <span>PENDING INSPECTION</span>
            <PackageCheck size={16} className="text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-400 font-mono">
            {rmas.filter(r => r.status === 'RECEIVED').length}
          </div>
          <div className="mt-1 text-xs text-os-text-muted">At Warehouse Gate</div>
        </div>

        <div className="bg-os-card border border-os-border rounded-lg p-4">
          <div className="flex items-center justify-between text-os-text-muted text-xs font-mono">
            <span>DISPOSITIONED</span>
            <Wrench size={16} className="text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-indigo-400 font-mono">
            {rmas.filter(r => r.status === 'DISPOSITIONED' || r.status === 'REFUNDED').length}
          </div>
          <div className="mt-1 text-xs text-os-text-muted">Restocked / Scrapped</div>
        </div>

        <div className="bg-os-card border border-os-border rounded-lg p-4">
          <div className="flex items-center justify-between text-os-text-muted text-xs font-mono">
            <span>CREDITS ISSUED</span>
            <DollarSign size={16} className="text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400 font-mono">
            {rmas.filter(r => r.status === 'REFUNDED').length}
          </div>
          <div className="mt-1 text-xs text-os-text-muted">Customer Refunds Settled</div>
        </div>
      </div>

      {/* RMA Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-white">Return Authorizations Queue</div>
          <button
            type="button"
            onClick={() => {
              returnsReverseLogisticsEngine.requestRMA({
                tenantId: 'demo-tenant',
                customerOrderId: 'cord-new-889',
                customerId: 'cust-apex-corp',
                productId: 'prod-srv-900',
                quantityReturned: 1,
                returnReason: 'DEFECTIVE',
                notes: 'Thermal sensor failure during high load'
              });
              refreshData();
            }}
            className="px-3 py-1.5 text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded flex items-center gap-1.5 transition-all font-mono"
          >
            <Plus size={13} /> Request New RMA
          </button>
        </div>

        <div className="bg-os-card border border-os-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-white/5 border-b border-os-border text-os-text-muted">
                <tr>
                  <th className="p-3">RMA #</th>
                  <th className="p-3">ORDER ID</th>
                  <th className="p-3">CUSTOMER</th>
                  <th className="p-3">PRODUCT</th>
                  <th className="p-3">QTY</th>
                  <th className="p-3">REASON</th>
                  <th className="p-3">STATUS</th>
                  <th className="p-3 text-right">LIFECYCLE ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-os-border/50 text-os-text-secondary">
                {rmas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-os-text-muted">
                      No RMAs in the queue. Click "Request New RMA" to create a test return.
                    </td>
                  </tr>
                ) : (
                  rmas.map(rma => (
                    <tr key={rma.rmaId} className="hover:bg-white/[0.02]">
                      <td className="p-3 font-bold text-white">{rma.rmaNumber}</td>
                      <td className="p-3 text-indigo-300 font-semibold">{rma.customerOrderId}</td>
                      <td className="p-3 text-os-text-muted">{rma.customerId}</td>
                      <td className="p-3 text-os-text-secondary">{rma.productId}</td>
                      <td className="p-3 font-bold">{rma.quantityReturned}</td>
                      <td className="p-3 text-amber-400 font-semibold">{rma.returnReason}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          rma.status === 'REFUNDED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                          rma.status === 'DISPOSITIONED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                          rma.status === 'INSPECTED' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                          rma.status === 'RECEIVED' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                          rma.status === 'APPROVED' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' :
                          'bg-white/5 text-os-text-muted border-os-border'
                        }`}>
                          {rma.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1.5">
                        {rma.status === 'REQUESTED' && (
                          <button
                            type="button"
                            onClick={() => handleApprove(rma.rmaId)}
                            className="px-2 py-0.5 text-[11px] bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/40 rounded"
                          >
                            Approve
                          </button>
                        )}
                        {rma.status === 'APPROVED' && (
                          <button
                            type="button"
                            onClick={() => handleReceive(rma.rmaId)}
                            className="px-2 py-0.5 text-[11px] bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 rounded"
                          >
                            Receive
                          </button>
                        )}
                        {rma.status === 'RECEIVED' && (
                          <button
                            type="button"
                            onClick={() => handleInspect(rma.rmaId, rma.productId)}
                            className="px-2 py-0.5 text-[11px] bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/40 rounded"
                          >
                            Inspect
                          </button>
                        )}
                        {rma.status === 'INSPECTED' && (
                          <button
                            type="button"
                            onClick={() => handleDisposition(rma.rmaId)}
                            className="px-2 py-0.5 text-[11px] bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/40 rounded"
                          >
                            Disposition
                          </button>
                        )}
                        {rma.status === 'DISPOSITIONED' && (
                          <button
                            type="button"
                            onClick={() => handleCredit(rma.rmaId, rma.customerId)}
                            className="px-2 py-0.5 text-[11px] bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 rounded"
                          >
                            Credit Note
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnsCenter;
